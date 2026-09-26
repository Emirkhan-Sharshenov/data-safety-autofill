package com.meshnet.app.net

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update

data class PeerConnection(
    val endpointId: String,
    val displayName: String,
    val connectedAtMillis: Long,
    val lastSyncAtMillis: Long? = null,
)

/**
 * Live view of the direct (1-hop) Nearby Connections links this device currently holds,
 * updated by MeshRelayService and observed by the UI (Node Status's "Bridged Peer Matrix").
 * Nearby Connections doesn't expose RSSI/hop-count — those are physical-radio details it
 * abstracts away — so this only tracks what the API actually gives us: who's connected,
 * since when, and when we last exchanged a sync frame with them.
 */
object PeerConnectionRegistry {
    private val _connections = MutableStateFlow<List<PeerConnection>>(emptyList())
    val connections: StateFlow<List<PeerConnection>> = _connections

    fun onConnected(endpointId: String, displayName: String) {
        val now = System.currentTimeMillis()
        _connections.update { current ->
            current.filterNot { it.endpointId == endpointId } + PeerConnection(endpointId, displayName, now)
        }
    }

    fun onDisconnected(endpointId: String) {
        _connections.update { current -> current.filterNot { it.endpointId == endpointId } }
    }

    fun onSynced(endpointId: String) {
        _connections.update { current ->
            current.map { if (it.endpointId == endpointId) it.copy(lastSyncAtMillis = System.currentTimeMillis()) else it }
        }
    }
}
