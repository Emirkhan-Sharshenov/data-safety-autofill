package com.meshnet.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class Priority { EMERGENCY, NORMAL, BACKGROUND }

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val senderPublicKey: String,
    val signature: String,
    /** Text UTF-8 bytes for a plain message, or raw file bytes when [attachmentName] is set. */
    val payload: ByteArray,
    val priority: Priority,
    val ttlHops: Int,
    val ttlExpiresAtMillis: Long,
    val geohash: String?,
    val createdAtMillis: Long,
    val delivered: Boolean = false,
    /** Original filename, e.g. "report.pdf" — null means [payload] is plain UTF-8 text. */
    val attachmentName: String? = null,
    /** MIME type of the attachment, e.g. "application/pdf". Null when there's no attachment. */
    val attachmentMimeType: String? = null,
    /** Optional short text sent alongside a file attachment. */
    val caption: String? = null,
)
