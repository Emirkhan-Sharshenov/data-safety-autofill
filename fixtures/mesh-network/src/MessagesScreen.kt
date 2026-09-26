package com.meshnet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CellTower
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.meshnet.app.crypto.KeyManager
import com.meshnet.app.data.AttachmentStore
import com.meshnet.app.data.MeshDatabase
import com.meshnet.app.data.MessageEntity
import com.meshnet.app.data.Priority
import com.meshnet.app.net.PeerConnectionRegistry
import com.meshnet.app.ui.components.Dot
import com.meshnet.app.ui.components.MeshTopBar
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType
import java.util.concurrent.TimeUnit

@Composable
fun MessagesScreen(onCompose: () -> Unit) {
    val context = LocalContext.current
    val messageDao = remember { MeshDatabase.get(context).messageDao() }
    val messages by messageDao.observeAll().collectAsState(initial = emptyList())
    val connections by PeerConnectionRegistry.connections.collectAsState()

    Scaffold(
        containerColor = MeshColors.Background,
        topBar = { MeshTopBar(screenTitle = "Messages", nodeCount = connections.size) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onCompose,
                containerColor = MeshColors.SecondaryContainer,
                contentColor = MeshColors.OnSecondary,
                icon = { Icon(Icons.Default.CellTower, contentDescription = null) },
                text = { Text("NEW BROADCAST", style = MeshType.labelLg) }
            )
        }
    ) { padding ->
        if (messages.isEmpty()) {
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                Text(
                    "No messages yet. Compose one, or wait for a peer to sync one to you.",
                    style = MeshType.bodyMd, color = MeshColors.OnSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages, key = { it.id }) { message -> MessageCard(message) }
            }
        }
    }
}

@Composable
private fun MessageCard(message: MessageEntity) {
    val context = LocalContext.current
    val accent = when (message.priority) {
        Priority.EMERGENCY -> MeshColors.PrimaryContainer
        Priority.NORMAL -> MeshColors.SecondaryContainer
        Priority.BACKGROUND -> MeshColors.Tertiary
    }
    val isMine = remember(message.senderPublicKey) { message.senderPublicKey == KeyManager.publicKeyBase64() }
    val senderLabel = remember(message.senderPublicKey) {
        if (isMine) "YOU" else message.senderPublicKey.take(10) + "…"
    }
    val timeAgo = remember(message.createdAtMillis) { formatAgo(System.currentTimeMillis() - message.createdAtMillis) }
    val hopSummary = "${message.ttlHops} hop(s) budget left"
    val deliveryStatus = if (isMine) "SENT BY YOU" else "RECEIVED"

    Row(
        Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min)
            .background(if (message.priority == Priority.EMERGENCY) MeshColors.SurfaceContainerHigh else MeshColors.SurfaceContainer)
    ) {
        Box(Modifier.fillMaxHeight().width(4.dp).background(accent))
        Column(Modifier.padding(12.dp).fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (message.priority == Priority.EMERGENCY) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = MeshColors.OnPrimary, modifier = Modifier.size(14.dp))
                    }
                    Text(senderLabel, style = MeshType.labelSm, color = accent)
                }
                Text(timeAgo, style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
            }

            if (message.attachmentName != null) {
                message.caption?.let {
                    Text(it, style = MeshType.bodyMd, color = MeshColors.OnSurface, modifier = Modifier.padding(top = 6.dp))
                }
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(MeshColors.SurfaceContainerLow)
                        .clickable {
                            val uri = AttachmentStore.save(context, message.id, message.attachmentName, message.payload)
                            context.startActivity(AttachmentStore.openIntent(context, uri, message.attachmentMimeType))
                        }
                        .padding(10.dp)
                        .padding(top = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.InsertDriveFile, contentDescription = null, tint = accent)
                    Column(Modifier.weight(1f)) {
                        Text(message.attachmentName, style = MeshType.bodyMd, color = MeshColors.OnSurface)
                        Text(
                            "${message.attachmentMimeType ?: "file"} • ${formatFileSize(message.payload.size)}",
                            style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant
                        )
                    }
                    Icon(Icons.Default.OpenInNew, contentDescription = "Open", tint = accent, modifier = Modifier.size(18.dp))
                }
            } else {
                val body = remember(message.id) { String(message.payload, Charsets.UTF_8) }
                Text(body, style = MeshType.bodyMd, color = MeshColors.OnSurface, modifier = Modifier.padding(top = 6.dp))
            }
            // Stacked, not side-by-side: hop summary and delivery status can each run long
            // (public keys, hop counts), and a Row with SpaceBetween won't wrap them —
            // it silently compresses one side into an unreadable sliver instead.
            Column(
                Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLow).padding(8.dp).padding(top = 8.dp)
            ) {
                Text(hopSummary, style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Dot(accent)
                    Text(deliveryStatus, style = MeshType.labelSm, color = accent)
                }
            }
        }
    }
}

private fun formatFileSize(bytes: Int): String = when {
    bytes < 1024 -> "$bytes B"
    bytes < 1024 * 1024 -> "${bytes / 1024} KB"
    else -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
}

private fun formatAgo(millis: Long): String {
    val minutes = TimeUnit.MILLISECONDS.toMinutes(millis)
    return when {
        minutes < 1 -> "${TimeUnit.MILLISECONDS.toSeconds(millis)}s ago"
        minutes < 60 -> "${minutes}m ago"
        else -> "${TimeUnit.MILLISECONDS.toHours(millis)}h ago"
    }
}
