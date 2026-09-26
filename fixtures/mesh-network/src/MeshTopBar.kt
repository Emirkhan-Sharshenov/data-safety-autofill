package com.meshnet.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType

/** Header used on every top-level screen: identity, connection pill, RF/telemetry strip. */
@Composable
fun MeshTopBar(screenTitle: String, nodeCount: Int, rfChannels: String = "BLE+LoRa+Wi-Fi Direct") {
    Column(Modifier.fillMaxWidth().background(MeshColors.Surface.copy(alpha = 0.95f)).padding(horizontal = 16.dp, vertical = 8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("MESHNET", style = MeshType.headlineMd, color = MeshColors.OnSurface)
                }
                Text(screenTitle.uppercase(), style = MeshType.labelMd, color = MeshColors.OnSurfaceVariant)
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill("ACTIVE")
                Row(
                    Modifier.size(32.dp).background(MeshColors.Primary, CircleShape),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = MeshColors.OnPrimary)
                }
            }
        }
        Row(
            Modifier.fillMaxWidth().background(MeshColors.SurfaceContainerLow).padding(horizontal = 8.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("RF: $rfChannels", style = MeshType.labelSm, color = MeshColors.OnSurfaceVariant)
            Text("$nodeCount NODES", style = MeshType.labelSm, color = MeshColors.Secondary)
        }
    }
}

@Composable
private fun RowScope.StatusPill(text: String) {
    Row(
        Modifier.background(MeshColors.SurfaceContainerHigh).padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Dot(MeshColors.SecondaryContainer)
        Text(text, style = MeshType.labelSm, color = MeshColors.SecondaryContainer)
    }
}

@Composable
fun Dot(color: Color, size: androidx.compose.ui.unit.Dp = 6.dp) {
    androidx.compose.foundation.layout.Box(Modifier.size(size).background(color, CircleShape))
}
