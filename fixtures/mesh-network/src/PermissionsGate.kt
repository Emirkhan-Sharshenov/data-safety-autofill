package com.meshnet.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.meshnet.app.service.MeshRelayService
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType

/** Permissions Nearby Connections needs to advertise/discover/connect at all. */
fun meshRuntimePermissions(): Array<String> = buildList {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        add(Manifest.permission.BLUETOOTH_ADVERTISE)
        add(Manifest.permission.BLUETOOTH_CONNECT)
        add(Manifest.permission.BLUETOOTH_SCAN)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        add(Manifest.permission.NEARBY_WIFI_DEVICES)
        add(Manifest.permission.POST_NOTIFICATIONS)
    }
    add(Manifest.permission.ACCESS_FINE_LOCATION)
}.toTypedArray()

private fun hasAllPermissions(context: android.content.Context, permissions: Array<String>): Boolean =
    permissions.all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }

/**
 * Gates the app behind the runtime permissions Nearby Connections requires, then starts
 * MeshRelayService exactly once they're granted — without this, the relay never runs and
 * the device never advertises, discovers, or syncs with anyone.
 */
@Composable
fun PermissionsGate(content: @Composable () -> Unit) {
    val context = LocalContext.current
    val required = remember { meshRuntimePermissions() }
    var granted by remember { mutableStateOf(hasAllPermissions(context, required)) }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        granted = result.values.all { it }
    }

    LaunchedEffect(granted) {
        if (granted) {
            ContextCompat.startForegroundService(context, Intent(context, MeshRelayService::class.java))
        }
    }

    if (granted) {
        content()
    } else {
        Column(
            Modifier.fillMaxSize().background(MeshColors.Background).padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text("MESHNET NEEDS NEARBY PERMISSIONS", style = MeshType.headlineLg, color = MeshColors.OnSurface)
            Text(
                "Bluetooth, Wi-Fi and location access let this device find and relay messages with nearby phones — nothing is sent to a server.",
                style = MeshType.bodyMd, color = MeshColors.OnSurfaceVariant,
                modifier = Modifier.padding(top = 12.dp, bottom = 20.dp)
            )
            Button(
                onClick = { launcher.launch(required) },
                colors = ButtonDefaults.buttonColors(containerColor = MeshColors.SecondaryContainer, contentColor = MeshColors.OnSecondary)
            ) {
                Text("GRANT PERMISSIONS", style = MeshType.labelLg)
            }
        }
    }
}
