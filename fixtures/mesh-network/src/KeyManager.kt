package com.meshnet.app.crypto

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.crypto.tink.subtle.Ed25519Sign
import com.google.crypto.tink.subtle.Ed25519Verify
import java.security.GeneralSecurityException
import java.security.MessageDigest

/**
 * Holds this device's Ed25519 identity keypair. Generated once and persisted in
 * EncryptedSharedPreferences (Android Keystore-backed) so the node id stays stable
 * across app restarts. Every outgoing message is signed with [sign]; every message
 * received from a peer is checked with [verify] before being stored or relayed.
 */
object KeyManager {
    private const val PREFS_NAME = "mesh_identity"
    private const val KEY_PRIVATE = "ed25519_private"
    private const val KEY_PUBLIC = "ed25519_public"

    @Volatile private var signer: Ed25519Sign? = null
    @Volatile private var publicKey: ByteArray? = null

    fun init(context: Context) {
        if (signer != null) return
        synchronized(this) {
            if (signer != null) return
            val prefs = encryptedPrefs(context.applicationContext)
            val storedPrivate = prefs.getString(KEY_PRIVATE, null)
            val storedPublic = prefs.getString(KEY_PUBLIC, null)

            val (privateBytes, publicBytes) = if (storedPrivate != null && storedPublic != null) {
                Base64.decode(storedPrivate, Base64.NO_WRAP) to Base64.decode(storedPublic, Base64.NO_WRAP)
            } else {
                val keyPair = Ed25519Sign.KeyPair.newKeyPair()
                prefs.edit()
                    .putString(KEY_PRIVATE, Base64.encodeToString(keyPair.privateKey, Base64.NO_WRAP))
                    .putString(KEY_PUBLIC, Base64.encodeToString(keyPair.publicKey, Base64.NO_WRAP))
                    .apply()
                keyPair.privateKey to keyPair.publicKey
            }
            signer = Ed25519Sign(privateBytes)
            publicKey = publicBytes
        }
    }

    private fun encryptedPrefs(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        return EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun publicKeyBase64(): String = Base64.encodeToString(requirePublicKey(), Base64.NO_WRAP)

    /** Short human-readable id derived from the public key, shown in the UI as "0x...". */
    fun nodeId(): String {
        val digest = sha256(requirePublicKey())
        return "0x" + digest.take(4).joinToString("") { "%02X".format(it) }
    }

    fun fingerprint(): String {
        val digest = sha256(requirePublicKey())
        return "ED25519:" + digest.joinToString("") { "%02X".format(it) }.take(20)
    }

    fun sign(data: ByteArray): ByteArray = requireSigner().sign(data)

    fun verify(publicKeyBase64: String, data: ByteArray, signature: ByteArray): Boolean = try {
        val pub = Base64.decode(publicKeyBase64, Base64.NO_WRAP)
        Ed25519Verify(pub).verify(signature, data)
        true
    } catch (e: GeneralSecurityException) {
        false
    } catch (e: IllegalArgumentException) {
        false
    }

    private fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)

    private fun requireSigner() = signer ?: error("KeyManager.init(context) must run before use — see MeshApp.onCreate")
    private fun requirePublicKey() = publicKey ?: error("KeyManager.init(context) must run before use — see MeshApp.onCreate")
}
