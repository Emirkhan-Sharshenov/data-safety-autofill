package com.meshnet.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import com.meshnet.app.crypto.KeyManager
import com.meshnet.app.data.MeshDatabase
import com.meshnet.app.data.Priority
import com.meshnet.app.data.toJson
import com.meshnet.app.data.toMessageEntity
import com.meshnet.app.net.BloomFilter
import com.meshnet.app.net.MeshTransport
import com.meshnet.app.net.PeerConnectionRegistry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

private const val CHANNEL_ID = "mesh_relay"
private const val NOTIFICATION_ID = 1
private const val TAG = "MeshRelayService"

private const val FRAME_MANIFEST = "manifest"
private const val FRAME_MESSAGES = "messages"

/**
 * Foreground service: keeps advertising/discovery alive while the app is backgrounded
 * and performs store-and-forward sync (Bloom filter exchange -> delta transfer) with
 * each peer it connects to.
 *
 * Wire protocol (JSON frames over Nearby's raw byte payloads):
 *  - "manifest": sender's Bloom filter of active message ids. On receipt, the peer
 *    pushes back every message it holds that the filter says the sender is missing.
 *  - "messages": a batch of signed messages. Each is signature-verified against its
 *    claimed senderPublicKey before being stored; forged or tampered messages are
 *    dropped silently rather than relayed further. Non-emergency messages are also
 *    required to come from a QR-paired (trusted_nodes) sender — see handleMessages.
 */
class MeshRelayService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var transport: MeshTransport
    private lateinit var db: MeshDatabase
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        db = MeshDatabase.get(this)
        transport = MeshTransport(this, localEndpointName = android.os.Build.MODEL)
        startForeground(NOTIFICATION_ID, buildNotification())
        acquireWakeLock()
        transport.start(
            onPeerReady = { endpointId, displayName ->
                PeerConnectionRegistry.onConnected(endpointId, displayName)
                scope.launch { sendManifest(endpointId) }
            },
            onPeerLost = { endpointId -> PeerConnectionRegistry.onDisconnected(endpointId) },
            onPayload = { endpointId, bytes -> scope.launch { handlePayload(endpointId, bytes) } }
        )
    }

    /** Announce what this node has, so the peer can push back whatever it holds that we're missing. */
    private suspend fun sendManifest(endpointId: String) {
        db.messageDao().evictExpired()
        val ids = db.messageDao().activeIds()
        val bloom = BloomFilter.build(ids)
        val frame = JSONObject().apply {
            put("type", FRAME_MANIFEST)
            put("bloom", Base64.encodeToString(bloom.toByteArray(), Base64.NO_WRAP))
            put("hashCount", bloom.hashCount)
            put("bitCount", bloom.bitCount)
        }
        transport.send(endpointId, frame.toString().toByteArray(Charsets.UTF_8))
    }

    private suspend fun handlePayload(endpointId: String, bytes: ByteArray) {
        val json = try {
            JSONObject(String(bytes, Charsets.UTF_8))
        } catch (e: Exception) {
            Log.w(TAG, "Dropping malformed frame from $endpointId", e)
            return
        }

        when (json.optString("type")) {
            FRAME_MANIFEST -> handleManifest(endpointId, json)
            FRAME_MESSAGES -> handleMessages(json)
            else -> {
                Log.w(TAG, "Unknown frame type from $endpointId: ${json.optString("type")}")
                return
            }
        }
        PeerConnectionRegistry.onSynced(endpointId)
    }

    private suspend fun handleManifest(endpointId: String, json: JSONObject) {
        val bloom = BloomFilter.from(
            bytes = Base64.decode(json.getString("bloom"), Base64.NO_WRAP),
            hashCount = json.getInt("hashCount"),
            bitCount = json.getInt("bitCount"),
        )

        db.messageDao().evictExpired()
        val myIds = db.messageDao().activeIds()
        val peerIsMissing = myIds.filterNot { bloom.mightContain(it) }
        if (peerIsMissing.isEmpty()) return

        val messages = db.messageDao().getByIds(peerIsMissing)
        val frame = JSONObject().apply {
            put("type", FRAME_MESSAGES)
            put("items", JSONArray(messages.map { it.toJson() }))
        }
        transport.send(endpointId, frame.toString().toByteArray(Charsets.UTF_8))
    }

    private suspend fun handleMessages(json: JSONObject) {
        val items = json.getJSONArray("items")
        for (i in 0 until items.length()) {
            val entity = items.optJSONObject(i)?.toMessageEntity() ?: continue

            val signatureBytes = try {
                Base64.decode(entity.signature, Base64.NO_WRAP)
            } catch (e: IllegalArgumentException) {
                continue
            }
            if (!KeyManager.verify(entity.senderPublicKey, entity.payload, signatureBytes)) {
                Log.w(TAG, "Dropping message ${entity.id}: signature verification failed")
                continue
            }
            // EMERGENCY packets flood-fill regardless of trust (SOS override — see the
            // "radio echo" behaviour); everything else requires a QR-paired sender.
            if (entity.priority != Priority.EMERGENCY && !db.trustedNodeDao().isTrusted(entity.senderPublicKey)) {
                Log.w(TAG, "Dropping message ${entity.id}: sender ${entity.senderPublicKey.take(12)}… is not a trusted node")
                continue
            }
            if (entity.ttlHops <= 0) continue // hop budget exhausted — do not relay further
            if (entity.ttlExpiresAtMillis <= System.currentTimeMillis()) continue // expired in transit

            db.messageDao().insert(entity.copy(ttlHops = entity.ttlHops - 1))
        }
    }

    /** Without this, Doze/App Standby can suspend the CPU mid-sync on many OEM
     *  skins within seconds of the screen turning off, silently killing relaying. */
    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MeshNet:relay").apply {
            setReferenceCounted(false)
            acquire(TimeUnit.HOURS.toMillis(12))
        }
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Mesh relay", NotificationManager.IMPORTANCE_MIN)
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MeshNet active")
            .setContentText("Relaying messages nearby")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .build()
    }

    override fun onDestroy() {
        wakeLock?.let { if (it.isHeld) it.release() }
        transport.stop()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
