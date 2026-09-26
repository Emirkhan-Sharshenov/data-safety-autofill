package com.meshnet.app.net

import android.content.Context
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionResolution
import com.google.android.gms.nearby.connection.ConnectionsClient
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Strategy

private const val SERVICE_ID = "com.meshnet.app.SERVICE"

/**
 * Wraps Nearby Connections (P2P_CLUSTER: switches between BLE / Wi-Fi Direct / Hotspot
 * on its own) into a simple advertise/discover/sync surface for the relay service.
 */
class MeshTransport(context: Context, private val localEndpointName: String) {

    private val client: ConnectionsClient = Nearby.getConnectionsClient(context)
    private val pendingNames = mutableMapOf<String, String>()

    fun start(
        onPeerReady: (endpointId: String, displayName: String) -> Unit,
        onPeerLost: (endpointId: String) -> Unit,
        onPayload: (endpointId: String, bytes: ByteArray) -> Unit,
    ) {
        val lifecycleCallback = object : ConnectionLifecycleCallback() {
            override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
                pendingNames[endpointId] = info.endpointName
                client.acceptConnection(endpointId, object : PayloadCallback() {
                    override fun onPayloadReceived(fromEndpointId: String, payload: Payload) {
                        payload.asBytes()?.let { onPayload(fromEndpointId, it) }
                    }
                    override fun onPayloadTransferUpdate(fromEndpointId: String, update: PayloadTransferUpdate) {}
                })
            }
            override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
                if (result.status.isSuccess) {
                    onPeerReady(endpointId, pendingNames[endpointId] ?: endpointId)
                } else {
                    pendingNames.remove(endpointId)
                }
            }
            override fun onDisconnected(endpointId: String) {
                pendingNames.remove(endpointId)
                onPeerLost(endpointId)
            }
        }

        client.startAdvertising(
            localEndpointName, SERVICE_ID, lifecycleCallback,
            com.google.android.gms.nearby.connection.AdvertisingOptions.Builder()
                .setStrategy(Strategy.P2P_CLUSTER).build()
        )

        client.startDiscovery(SERVICE_ID, object : EndpointDiscoveryCallback() {
            override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
                client.requestConnection(localEndpointName, endpointId, lifecycleCallback)
            }
            override fun onEndpointLost(endpointId: String) {}
        }, DiscoveryOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build())
    }

    fun send(endpointId: String, bytes: ByteArray) {
        client.sendPayload(endpointId, Payload.fromBytes(bytes))
    }

    fun stop() {
        client.stopAdvertising()
        client.stopDiscovery()
        client.stopAllEndpoints()
    }
}
