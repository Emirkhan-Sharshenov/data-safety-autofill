package com.meshnet.app.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File

/** Cap on file attachments: the mesh moves data over BLE/Wi-Fi Direct at modest
 *  throughput, and payload bytes are base64-inflated (~33%) inside JSON sync frames —
 *  keep this generous but bounded so one big file can't stall the whole relay queue. */
const val MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024 // 8 MB

/**
 * Writes a received (or about-to-be-sent) attachment's bytes into this app's private
 * files dir and returns a content:// URI other apps can open via FileProvider — no
 * storage permission needed, since the file never leaves app-private storage until
 * explicitly shared through that URI.
 */
object AttachmentStore {
    private const val AUTHORITY_SUFFIX = ".fileprovider"

    fun save(context: Context, messageId: String, fileName: String, bytes: ByteArray): Uri {
        val dir = File(context.filesDir, "attachments").apply { mkdirs() }
        val file = File(dir, "${messageId}_$fileName")
        if (!file.exists()) {
            file.writeBytes(bytes)
        }
        return FileProvider.getUriForFile(context, context.packageName + AUTHORITY_SUFFIX, file)
    }

    fun openIntent(context: Context, uri: Uri, mimeType: String?): Intent =
        Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mimeType?.takeIf { it.isNotBlank() } ?: "*/*")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

    fun readBytes(context: Context, uri: Uri): ByteArray? =
        context.contentResolver.openInputStream(uri)?.use { it.readBytes() }

    fun queryDisplayName(context: Context, uri: Uri): String? {
        val cursor = context.contentResolver.query(uri, null, null, null, null) ?: return uri.lastPathSegment
        return cursor.use {
            val nameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (it.moveToFirst() && nameIndex >= 0) it.getString(nameIndex) else uri.lastPathSegment
        }
    }
}
