package com.meshnet.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.activity.compose.rememberLauncherForActivityResult
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.meshnet.app.crypto.KeyManager
import com.meshnet.app.data.MeshDatabase
import com.meshnet.app.data.TrustedNodeEntity
import com.meshnet.app.net.PeerConnectionRegistry
import com.meshnet.app.net.QrCodes
import com.meshnet.app.ui.components.MeshTopBar
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType
import kotlinx.coroutines.launch

private enum class PairMode { SHOW, SCAN }

@Composable
fun TrustPairScreen() {
    var mode by remember { mutableStateOf(PairMode.SHOW) }
    var scannedPeer by remember { mutableStateOf<String?>(null) }
    var justSaved by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val connections by PeerConnectionRegistry.connections.collectAsState()

    val scanLauncher = rememberLauncherForActivityResult(ScanContract()) { result ->
        if (result.contents != null) {
            scannedPeer = result.contents
            justSaved = false
            mode = PairMode.SCAN
        }
    }

    Scaffold(containerColor = MeshColors.Background, topBar = { MeshTopBar(screenTitle = "Trust Pair", nodeCount = connections.size) }) { padding ->
        Column(Modifier.fillMaxWidth().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(16.dp)) {
                Text("OFFLINE TRUST HANDSHAKE", style = MeshType.headlineLg, color = MeshColors.OnSurface)
                Text(
                    "Exchange public keys peer-to-peer via camera scan — no server needed.",
                    style = MeshType.bodySm, color = MeshColors.OnSurfaceVariant
                )
            }

            Row(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLow).padding(4.dp)) {
                ModeTab("My Key", Icons.Default.QrCode2, mode == PairMode.SHOW, Modifier.weight(1f)) { mode = PairMode.SHOW }
                ModeTab("Scan Peer", Icons.Default.QrCodeScanner, mode == PairMode.SCAN, Modifier.weight(1f)) {
                    scanLauncher.launch(
                        ScanOptions()
                            .setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                            .setPrompt("Point at the peer's Trust Pair QR")
                            .setBeepEnabled(false)
                            .setOrientationLocked(false)
                    )
                }
            }

            when (mode) {
                PairMode.SHOW -> ShowKeyPanel()
                PairMode.SCAN -> ScanResultPanel(scannedPeer)
            }

            Button(
                onClick = {
                    val peer = scannedPeer ?: return@Button
                    val parts = peer.split("|")
                    val peerId = parts.getOrElse(0) { peer }
                    val peerPublicKey = parts.getOrElse(1) { return@Button }
                    scope.launch {
                        MeshDatabase.get(context).trustedNodeDao().insert(
                            TrustedNodeEntity(
                                publicKeyBase64 = peerPublicKey,
                                nodeId = peerId,
                                pairedAtMillis = System.currentTimeMillis(),
                            )
                        )
                        justSaved = true
                    }
                },
                enabled = mode == PairMode.SCAN && scannedPeer != null && !justSaved,
                colors = ButtonDefaults.buttonColors(containerColor = MeshColors.SecondaryContainer, contentColor = MeshColors.OnSecondary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(18.dp))
                Text(if (justSaved) "  SAVED TO TRUSTED RING" else "  SAVE TO TRUSTED RING", style = MeshType.labelLg)
            }
        }
    }
}

@Composable
private fun ModeTab(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val bg = if (selected) MeshColors.SurfaceContainerHigh else androidx.compose.ui.graphics.Color.Transparent
    val fg = if (selected) MeshColors.SecondaryContainer else MeshColors.OnSurfaceVariant
    Row(
        modifier
            .background(bg)
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = fg, modifier = Modifier.size(16.dp))
        Text("  ${label.uppercase()}", style = MeshType.labelMd, color = fg)
    }
}

@Composable
private fun ShowKeyPanel() {
    // Payload carries the real public key (not just a fingerprint) so the scanning peer
    // can verify this node's message signatures after the handshake.
    val qrPayload = remember { "${KeyManager.nodeId()}|${KeyManager.publicKeyBase64()}" }
    val qrBitmap = remember(qrPayload) { QrCodes.encode(qrPayload) }

    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Image(
            bitmap = qrBitmap.asImageBitmap(),
            contentDescription = "My node QR code",
            modifier = Modifier.fillMaxWidth(0.7f).aspectRatio(1f).background(MeshColors.SurfaceContainerLowest).padding(16.dp)
        )
        Text(KeyManager.nodeId(), style = MeshType.bodyLg, color = MeshColors.SecondaryContainer, modifier = Modifier.padding(top = 12.dp))
        Text("FINGERPRINT: ${KeyManager.fingerprint()}", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
    }
}

@Composable
private fun ScanResultPanel(scannedPeer: String?) {
    if (scannedPeer == null) {
        Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(16.dp)) {
            Text("No peer scanned yet. Tap \"Scan Peer\" to open the camera.", style = MeshType.bodyMd, color = MeshColors.OnSurfaceVariant)
        }
        return
    }

    val parts = scannedPeer.split("|")
    val peerId = parts.getOrElse(0) { scannedPeer }
    val peerPublicKey = parts.getOrElse(1) { "unknown" }

    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerHigh).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.size(24.dp).background(MeshColors.SecondaryContainer, CircleShape), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Verified, contentDescription = null, tint = MeshColors.OnSecondary, modifier = Modifier.size(16.dp))
            }
            Text("PEER SCANNED", style = MeshType.headlineMd, color = MeshColors.SecondaryContainer)
        }
        Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(10.dp).padding(top = 12.dp)) {
            KeyValueRow("PEER IDENTITY", peerId)
            KeyValueRow("PUBLIC KEY", peerPublicKey.take(20) + "…")
            KeyValueRow("TRUST POLICY", "Pending — save to pin locally")
        }
    }
}

@Composable
private fun KeyValueRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
        Text(value, style = MeshType.labelSm, color = MeshColors.OnSurface)
    }
}
