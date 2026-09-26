package com.meshnet.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/** A peer whose public key was verified via the offline QR handshake (see TrustPairScreen). */
@Entity(tableName = "trusted_nodes")
data class TrustedNodeEntity(
    @PrimaryKey val publicKeyBase64: String,
    val nodeId: String,
    val pairedAtMillis: Long,
)
