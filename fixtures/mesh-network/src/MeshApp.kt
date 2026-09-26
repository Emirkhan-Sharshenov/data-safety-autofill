package com.meshnet.app

import android.app.Application
import com.meshnet.app.crypto.KeyManager

class MeshApp : Application() {
    override fun onCreate() {
        super.onCreate()
        KeyManager.init(this)
    }
}
