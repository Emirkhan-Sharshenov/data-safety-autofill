package com.meshnet.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.InsertDriveFile
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.meshnet.app.data.AttachmentStore
import com.meshnet.app.data.MAX_ATTACHMENT_BYTES
import com.meshnet.app.data.Priority
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType

data class PendingAttachment(val name: String, val mimeType: String, val bytes: ByteArray)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeScreen(onBack: () -> Unit, onTransmit: (String, Priority, PendingAttachment?) -> Unit) {
    val context = LocalContext.current
    var body by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(Priority.NORMAL) }
    var attachment by remember { mutableStateOf<PendingAttachment?>(null) }
    var attachmentError by remember { mutableStateOf<String?>(null) }

    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        val bytes = AttachmentStore.readBytes(context, uri)
        val name = AttachmentStore.queryDisplayName(context, uri) ?: "file"
        when {
            bytes == null -> attachmentError = "Couldn't read that file."
            bytes.size > MAX_ATTACHMENT_BYTES -> attachmentError = "File too large (max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB)."
            else -> {
                attachmentError = null
                val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
                attachment = PendingAttachment(name, mime, bytes)
            }
        }
    }

    Scaffold(
        containerColor = MeshColors.Background,
        topBar = {
            TopAppBar(
                title = { Text("COMPOSE PACKET", style = MeshType.headlineMd) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MeshColors.Surface, titleContentColor = MeshColors.OnSurface)
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxWidth().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("PACKET TRANSMIT PRIORITY", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
            Row(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLowest).padding(4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                PriorityTab("Emergency", Priority.EMERGENCY, priority, MeshColors.PrimaryContainer, MeshColors.OnPrimary, Modifier.weight(1f)) { priority = it }
                PriorityTab("Normal", Priority.NORMAL, priority, MeshColors.SecondaryContainer, MeshColors.OnSecondary, Modifier.weight(1f)) { priority = it }
                PriorityTab("Low-Pwr", Priority.BACKGROUND, priority, MeshColors.Tertiary, MeshColors.OnTertiary, Modifier.weight(1f)) { priority = it }
            }

            OutlinedTextField(
                value = body,
                onValueChange = { body = it },
                modifier = Modifier.fillMaxWidth().height(160.dp),
                placeholder = { Text(if (attachment != null) "Optional caption..." else "Enter packet payload...", style = MeshType.bodyMd) },
                textStyle = MeshType.bodyMd,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MeshColors.SurfaceContainerHigh,
                    unfocusedContainerColor = MeshColors.SurfaceContainerHigh,
                    focusedTextColor = MeshColors.OnSurface,
                    unfocusedTextColor = MeshColors.OnSurface,
                ),
                keyboardOptions = KeyboardOptions.Default,
            )
            Text("${body.length} / 220 BYTES", style = MeshType.labelSm, color = if (body.length > 200) MeshColors.PrimaryContainer else MeshColors.Secondary)

            val currentAttachment = attachment
            if (currentAttachment != null) {
                Row(
                    Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerHigh).padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.InsertDriveFile, contentDescription = null, tint = MeshColors.SecondaryContainer)
                    Column(Modifier.weight(1f)) {
                        Text(currentAttachment.name, style = MeshType.bodyMd, color = MeshColors.OnSurface)
                        Text(
                            "${currentAttachment.mimeType} • ${formatBytes(currentAttachment.bytes.size)}",
                            style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant
                        )
                    }
                    Icon(
                        Icons.Default.Close, contentDescription = "Remove attachment",
                        tint = MeshColors.OnSurfaceVariant,
                        modifier = Modifier.size(20.dp).clickable { attachment = null }
                    )
                }
            } else {
                Row(
                    Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer)
                        .clickable { filePicker.launch(arrayOf("*/*")) }
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AttachFile, contentDescription = null, tint = MeshColors.OnSurfaceVariant)
                    Text("ATTACH FILE (PDF, PHOTO, ANYTHING)", style = MeshType.labelMd, color = MeshColors.OnSurfaceVariant)
                }
            }
            attachmentError?.let { Text(it, style = MeshType.labelSm, color = MeshColors.PrimaryContainer) }

            Button(
                onClick = {
                    onTransmit(body, priority, attachment)
                    onBack()
                },
                enabled = body.isNotBlank() || attachment != null,
                colors = ButtonDefaults.buttonColors(containerColor = MeshColors.SecondaryContainer, contentColor = MeshColors.OnSecondary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("TRANSMIT OVER MESH", style = MeshType.labelLg)
            }
        }
    }
}

private fun formatBytes(bytes: Int): String = when {
    bytes < 1024 -> "$bytes B"
    bytes < 1024 * 1024 -> "${bytes / 1024} KB"
    else -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
}

@Composable
private fun PriorityTab(
    label: String,
    value: Priority,
    selected: Priority,
    activeColor: androidx.compose.ui.graphics.Color,
    activeContent: androidx.compose.ui.graphics.Color,
    modifier: Modifier,
    onSelect: (Priority) -> Unit,
) {
    val isSelected = value == selected
    Column(
        modifier
            .background(if (isSelected) activeColor else MeshColors.SurfaceContainer)
            .clickable { onSelect(value) }
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            label.uppercase(),
            style = MeshType.labelMd,
            color = if (isSelected) activeContent else MeshColors.OnSurfaceVariant,
        )
    }
}
