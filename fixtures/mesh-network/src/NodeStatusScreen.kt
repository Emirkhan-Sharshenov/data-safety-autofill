package com.meshnet.app.ui.screens

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.meshnet.app.data.MeshDatabase
import com.meshnet.app.data.TrustedNodeEntity
import com.meshnet.app.net.PeerConnection
import com.meshnet.app.net.PeerConnectionRegistry
import com.meshnet.app.ui.components.MeshTopBar
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date
import java.util.concurrent.TimeUnit

private const val BUFFER_CAP_BYTES = 64L * 1024 * 1024 // soft target for the store-and-forward cache

@Composable
fun NodeStatusScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember { MeshDatabase.get(context) }
    val trustedNodes by db.trustedNodeDao().observeAll().collectAsState(initial = emptyList())
    val connections by PeerConnectionRegistry.connections.collectAsState()
    val messageCount by db.messageDao().observeCount().collectAsState(initial = 0)
    val bufferBytes by db.messageDao().observeTotalBytes().collectAsState(initial = 0L)

    Scaffold(containerColor = MeshColors.Background, topBar = { MeshTopBar(screenTitle = "Node Status", nodeCount = connections.size) }) { padding ->
        LazyColumn(Modifier.fillMaxWidth().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { BatteryCard() }
            item { BufferCard(messageCount = messageCount, bufferBytes = bufferBytes) }
            item {
                Text(
                    "TRUSTED NODES (${trustedNodes.size}) • QR-PAIRED",
                    style = MeshType.labelMd, color = MeshColors.OnSurfaceVariant
                )
            }
            if (trustedNodes.isEmpty()) {
                item {
                    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(12.dp)) {
                        Text(
                            "No trusted nodes yet. Pair with a peer on the Trust Pair screen.",
                            style = MeshType.bodySm, color = MeshColors.OnSurfaceVariant
                        )
                    }
                }
            } else {
                items(trustedNodes, key = { it.publicKeyBase64 }) { node ->
                    TrustedNodeRow(node, onDelete = {
                        scope.launch { db.trustedNodeDao().delete(node.publicKeyBase64) }
                    })
                }
            }
            item {
                Text(
                    "BRIDGED PEER MATRIX (${connections.size} ACTIVE LINKS)",
                    style = MeshType.labelMd, color = MeshColors.OnSurfaceVariant
                )
            }
            if (connections.isEmpty()) {
                item {
                    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(12.dp)) {
                        Text(
                            "No direct connections yet. MeshRelayService is advertising and scanning for peers.",
                            style = MeshType.bodySm, color = MeshColors.OnSurfaceVariant
                        )
                    }
                }
            } else {
                items(connections, key = { it.endpointId }) { peer -> PeerRow(peer) }
            }
        }
    }
}

@Composable
private fun BatteryCard() {
    val context = LocalContext.current
    val batteryStatus = remember {
        context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    }
    val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
    val percent = if (level >= 0 && scale > 0) (level * 100f / scale) else 0f
    val isCharging = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) in
        listOf(BatteryManager.BATTERY_STATUS_CHARGING, BatteryManager.BATTERY_STATUS_FULL)
    val lowPower = percent <= 25f

    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLow).padding(16.dp)) {
        Text("BATTERY TELEMETRY • POWER GOVERNOR", style = MeshType.labelMd, color = MeshColors.OnSurface)
        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("${percent.toInt()}%", style = MeshType.headlineLg, color = MeshColors.SecondaryContainer)
            Text(if (isCharging) "Charging" else "On battery", style = MeshType.bodySm, color = MeshColors.OnSurfaceVariant)
        }
        LinearProgressIndicator(
            progress = { percent / 100f },
            modifier = Modifier.fillMaxWidth().height(6.dp).padding(top = 8.dp),
            color = if (lowPower) MeshColors.Tertiary else MeshColors.SecondaryContainer,
            trackColor = MeshColors.SurfaceContainerLowest,
        )
        Text(
            if (lowPower) {
                "Battery ≤25% — this device should switch to RECEIVE-ONLY to protect emergency broadcast telemetry."
            } else {
                "Relay-active. Auto-downgrades to RECEIVE-ONLY at ≤25% battery."
            },
            style = MeshType.bodySm,
            color = if (lowPower) MeshColors.Tertiary else MeshColors.OnSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

@Composable
private fun BufferCard(messageCount: Int, bufferBytes: Long) {
    val fraction = (bufferBytes.toFloat() / BUFFER_CAP_BYTES).coerceIn(0f, 1f)
    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLow).padding(16.dp)) {
        Text("STORE & FORWARD BUFFER", style = MeshType.labelMd, color = MeshColors.OnSurface)
        Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("${formatBytes(bufferBytes)} / ${formatBytes(BUFFER_CAP_BYTES)}", style = MeshType.bodyLg, color = MeshColors.OnSurface)
            Text("${(fraction * 100).toInt()}%", style = MeshType.labelLg, color = MeshColors.Secondary)
        }
        LinearProgressIndicator(
            progress = { fraction },
            modifier = Modifier.fillMaxWidth().height(4.dp).padding(top = 8.dp),
            color = MeshColors.Secondary,
            trackColor = MeshColors.SurfaceContainerLowest,
        )
        Text("$messageCount message(s) cached locally", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
    }
}

@Composable
private fun TrustedNodeRow(node: TrustedNodeEntity, onDelete: () -> Unit) {
    val pairedAt = remember(node.pairedAtMillis) { DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(node.pairedAtMillis)) }
    Row(
        Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.size(22.dp).background(MeshColors.SecondaryContainer, CircleShape),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = MeshColors.OnSecondary, modifier = Modifier.size(14.dp))
            }
            Column {
                Text(node.nodeId, style = MeshType.bodyMd, color = MeshColors.OnSurface)
                Text("${node.publicKeyBase64.take(16)}… • Paired $pairedAt", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
            }
        }
        Icon(
            Icons.Default.Delete, contentDescription = "Remove trusted node",
            tint = MeshColors.Error,
            modifier = Modifier.size(20.dp).clickable(onClick = onDelete)
        )
    }
}

@Composable
private fun PeerRow(peer: PeerConnection) {
    val now = System.currentTimeMillis()
    val connectedFor = remember(peer.connectedAtMillis, now) { formatDuration(now - peer.connectedAtMillis) }
    val syncStatus = if (peer.lastSyncAtMillis != null) {
        "Synced ${formatDuration(now - peer.lastSyncAtMillis)} ago"
    } else {
        "Awaiting first sync"
    }
    val accent = if (peer.lastSyncAtMillis != null) MeshColors.SecondaryContainer else MeshColors.Tertiary

    Row(
        Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(10.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(peer.displayName, style = MeshType.bodyMd, color = MeshColors.OnSurface)
            Text("${peer.endpointId} • Direct route • up $connectedFor", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
        }
        Text(syncStatus, style = MeshType.labelSm, color = accent)
    }
}

private fun formatDuration(millis: Long): String {
    val minutes = TimeUnit.MILLISECONDS.toMinutes(millis)
    return when {
        minutes < 1 -> "${TimeUnit.MILLISECONDS.toSeconds(millis)}s"
        minutes < 60 -> "${minutes}m"
        else -> "${TimeUnit.MILLISECONDS.toHours(millis)}h"
    }
}

private fun formatBytes(bytes: Long): String = when {
    bytes < 1024 -> "$bytes B"
    bytes < 1024 * 1024 -> "%.1f KB".format(bytes / 1024.0)
    else -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
}
