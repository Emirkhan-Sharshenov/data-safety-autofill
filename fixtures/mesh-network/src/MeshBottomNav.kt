package com.meshnet.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Sensors
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType

enum class MeshDestination(val route: String, val label: String, val icon: ImageVector) {
    Messages("messages", "Messages", Icons.Default.ChatBubble),
    MeshMap("mesh_map", "Mesh Map", Icons.Default.Hub),
    TrustPair("trust_pair", "Trust Pair", Icons.Default.Key),
    NodeStatus("node_status", "Node Status", Icons.Default.Sensors),
}

@Composable
fun MeshBottomNav(current: MeshDestination, onSelect: (MeshDestination) -> Unit) {
    NavigationBar(containerColor = MeshColors.Surface, contentColor = MeshColors.OnSurfaceVariant) {
        MeshDestination.entries.forEach { dest ->
            NavigationBarItem(
                selected = dest == current,
                onClick = { onSelect(dest) },
                icon = { Icon(dest.icon, contentDescription = dest.label) },
                label = { Text(dest.label.uppercase(), style = MeshType.labelSm) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MeshColors.SecondaryContainer,
                    selectedTextColor = MeshColors.SecondaryContainer,
                    unselectedIconColor = MeshColors.OnSurfaceVariant,
                    unselectedTextColor = MeshColors.OnSurfaceVariant,
                    indicatorColor = MeshColors.SurfaceContainerHigh,
                )
            )
        }
    }
}
