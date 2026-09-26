package com.meshnet.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.meshnet.app.net.PeerConnection
import com.meshnet.app.net.PeerConnectionRegistry
import com.meshnet.app.ui.components.MeshTopBar
import com.meshnet.app.ui.theme.MeshColors
import com.meshnet.app.ui.theme.MeshType
import java.util.concurrent.TimeUnit
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun MeshMapScreen() {
    val connections by PeerConnectionRegistry.connections.collectAsState()

    Scaffold(
        containerColor = MeshColors.Background,
        topBar = { MeshTopBar(screenTitle = "Mesh Map", nodeCount = connections.size) }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { RadarView(connections) }
            if (connections.isEmpty()) {
                item {
                    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(12.dp)) {
                        Text(
                            "No direct links yet. Nodes appear here as soon as MeshRelayService connects to them.",
                            style = MeshType.bodySm, color = MeshColors.OnSurfaceVariant
                        )
                    }
                }
            } else {
                items(connections, key = { it.endpointId }) { node -> NodeRow(node) }
            }
        }
    }
}

/**
 * Nearby Connections gives us who's linked, not their real bearing or distance — it
 * abstracts away the radio layer. So peers are laid out evenly around "you" at a fixed
 * radius rather than plotted by true position; this is a connectivity diagram, not a
 * literal map.
 */
@Composable
private fun RadarView(connections: List<PeerConnection>) {
    Column(
        Modifier.fillMaxWidth().aspectRatio(1f).background(MeshColors.SurfaceContainerLowest)
    ) {
        Canvas(Modifier.fillMaxSize().padding(8.dp)) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val maxRadius = size.minDimension / 2f

            // Range rings
            listOf(0.28f, 0.52f, 0.76f, 1f).forEach { fraction ->
                drawCircle(
                    color = MeshColors.SurfaceVariant,
                    radius = maxRadius * fraction,
                    center = center,
                    style = Stroke(width = 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f)))
                )
            }

            val nodeRadius = maxRadius * 0.62f
            connections.forEachIndexed { index, node ->
                val angle = 2 * Math.PI * index / maxOf(connections.size, 1) - Math.PI / 2
                val pos = Offset(
                    x = (center.x + nodeRadius * cos(angle)).toFloat(),
                    y = (center.y + nodeRadius * sin(angle)).toFloat(),
                )
                val color = if (node.lastSyncAtMillis != null) MeshColors.SecondaryContainer else MeshColors.Tertiary
                drawLine(color = color.copy(alpha = 0.8f), start = center, end = pos, strokeWidth = 2.dp.toPx())
                drawCircle(color = color, radius = 7.dp.toPx(), center = pos)
            }

            // Self, center
            drawCircle(color = MeshColors.SecondaryContainer, radius = 9.dp.toPx(), center = center)
            drawCircle(color = MeshColors.SurfaceContainerLowest, radius = 4.dp.toPx(), center = center)
        }
    }
}

@Composable
private fun NodeRow(node: PeerConnection) {
    val now = System.currentTimeMillis()
    val status = if (node.lastSyncAtMillis != null) {
        "Synced ${formatAgo(now - node.lastSyncAtMillis)} ago"
    } else {
        "Connected, awaiting first sync"
    }
    Column(Modifier.fillMaxWidth().background(MeshColors.SurfaceContainer).padding(12.dp)) {
        Text(node.displayName, style = MeshType.headlineMd, color = MeshColors.OnSurface)
        Text(
            "${node.endpointId} • direct link",
            style = MeshType.labelSm,
            color = MeshColors.OnSurfaceVariant
        )
        Text(
            status,
            style = MeshType.labelSm,
            color = if (node.lastSyncAtMillis != null) MeshColors.SecondaryContainer else MeshColors.Tertiary
        )
    }
}

private fun formatAgo(millis: Long): String {
    val minutes = TimeUnit.MILLISECONDS.toMinutes(millis)
    return when {
        minutes < 1 -> "${TimeUnit.MILLISECONDS.toSeconds(millis)}s"
        minutes < 60 -> "${minutes}m"
        else -> "${TimeUnit.MILLISECONDS.toHours(millis)}h"
    }
}
