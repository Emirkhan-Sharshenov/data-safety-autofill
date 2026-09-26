package com.meshnet.app.data

import android.util.Base64
import org.json.JSONObject

/** Wire encoding for a single message, used inside a "messages" sync frame. */
fun MessageEntity.toJson(): JSONObject = JSONObject().apply {
    put("id", id)
    put("senderPublicKey", senderPublicKey)
    put("signature", signature)
    put("payload", Base64.encodeToString(payload, Base64.NO_WRAP))
    put("priority", priority.name)
    put("ttlHops", ttlHops)
    put("ttlExpiresAtMillis", ttlExpiresAtMillis)
    put("geohash", geohash ?: JSONObject.NULL)
    put("createdAtMillis", createdAtMillis)
    put("attachmentName", attachmentName ?: JSONObject.NULL)
    put("attachmentMimeType", attachmentMimeType ?: JSONObject.NULL)
    put("caption", caption ?: JSONObject.NULL)
}

fun JSONObject.toMessageEntity(): MessageEntity? = try {
    MessageEntity(
        id = getString("id"),
        senderPublicKey = getString("senderPublicKey"),
        signature = getString("signature"),
        payload = Base64.decode(getString("payload"), Base64.NO_WRAP),
        priority = Priority.valueOf(getString("priority")),
        ttlHops = getInt("ttlHops"),
        ttlExpiresAtMillis = getLong("ttlExpiresAtMillis"),
        geohash = if (isNull("geohash")) null else getString("geohash"),
        createdAtMillis = getLong("createdAtMillis"),
        delivered = false,
        attachmentName = if (has("attachmentName") && !isNull("attachmentName")) getString("attachmentName") else null,
        attachmentMimeType = if (has("attachmentMimeType") && !isNull("attachmentMimeType")) getString("attachmentMimeType") else null,
        caption = if (has("caption") && !isNull("caption")) getString("caption") else null,
    )
} catch (e: Exception) {
    null
}
