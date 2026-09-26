package com.meshnet.app.net

import android.graphics.Bitmap
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.common.BitMatrix

/** Renders a node's public-key payload as a QR bitmap for the offline trust handshake. */
object QrCodes {
    fun encode(content: String, sizePx: Int = 512): Bitmap {
        val matrix: BitMatrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx)
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.RGB_565)
        for (x in 0 until sizePx) {
            for (y in 0 until sizePx) {
                bitmap.setPixel(x, y, if (matrix.get(x, y)) FOREGROUND else BACKGROUND)
            }
        }
        return bitmap
    }

    private const val FOREGROUND = android.graphics.Color.BLACK
    private const val BACKGROUND = android.graphics.Color.WHITE
}
