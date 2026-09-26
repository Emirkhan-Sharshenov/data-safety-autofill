package com.meshnet.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import com.meshnet.app.crypto.KeyManager
import com.meshnet.app.data.MeshDatabase
import com.meshnet.app.data.MessageEntity
import com.meshnet.app.data.Priority
import com.meshnet.app.ui.components.MeshBottomNav
import com.meshnet.app.ui.components.MeshDestination
import com.meshnet.app.ui.screens.ComposeScreen
import com.meshnet.app.ui.screens.MeshMapScreen
import com.meshnet.app.ui.screens.MessagesScreen
import com.meshnet.app.ui.screens.NodeStatusScreen
import com.meshnet.app.ui.screens.TrustPairScreen
import com.meshnet.app.ui.theme.MeshNetTheme
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MeshNetTheme {
                PermissionsGate {
                    MeshApp()
                }
            }
        }
    }
}

/** Hop TTL and cache-persistence window per priority — mirrors the compose screen's segmented control. */
private fun ttlHopsFor(priority: Priority) = when (priority) {
    Priority.EMERGENCY -> 8
    Priority.NORMAL -> 5
    Priority.BACKGROUND -> 3
}

private fun ttlDurationMillisFor(priority: Priority) = when (priority) {
    Priority.EMERGENCY -> 24 * 60 * 60 * 1000L
    Priority.NORMAL -> 6 * 60 * 60 * 1000L
    Priority.BACKGROUND -> 72 * 60 * 60 * 1000L
}

@Composable
private fun MeshApp() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize()) {
        Column(Modifier.weight(1f)) {
            NavHost(navController, startDestination = MeshDestination.Messages.route) {
                composable(MeshDestination.Messages.route) {
                    MessagesScreen(onCompose = { navController.navigate("compose") })
                }
                composable(MeshDestination.MeshMap.route) { MeshMapScreen() }
                composable(MeshDestination.TrustPair.route) { TrustPairScreen() }
                composable(MeshDestination.NodeStatus.route) { NodeStatusScreen() }
                composable("compose") {
                    ComposeScreen(
                        onBack = { navController.popBackStack() },
                        onTransmit = { body, priority, attachment ->
                            val now = System.currentTimeMillis()
                            // A file attachment IS the payload (so its signature covers the
                            // actual bytes being relayed); plain text goes in payload when
                            // there's no attachment, otherwise it's just a caption.
                            val payloadBytes = attachment?.bytes ?: body.toByteArray(Charsets.UTF_8)
                            val signature = KeyManager.sign(payloadBytes)
                            val message = MessageEntity(
                                id = UUID.randomUUID().toString(),
                                senderPublicKey = KeyManager.publicKeyBase64(),
                                signature = android.util.Base64.encodeToString(signature, android.util.Base64.NO_WRAP),
                                payload = payloadBytes,
                                priority = priority,
                                ttlHops = ttlHopsFor(priority),
                                ttlExpiresAtMillis = now + ttlDurationMillisFor(priority),
                                geohash = null,
                                createdAtMillis = now,
                                attachmentName = attachment?.name,
                                attachmentMimeType = attachment?.mimeType,
                                caption = attachment?.let { body.ifBlank { null } },
                            )
                            scope.launch {
                                MeshDatabase.get(context).messageDao().insert(message)
                            }
                            // MeshRelayService picks this up on its next peer sync (see
                            // service/MeshRelayService.kt sendManifest) — no direct call needed.
                        }
                    )
                }
            }
        }
        if (currentRoute != "compose") {
            MeshBottomNav(
                current = MeshDestination.entries.find { it.route == currentRoute } ?: MeshDestination.Messages,
                onSelect = { dest ->
                    navController.navigate(dest.route) {
                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}
