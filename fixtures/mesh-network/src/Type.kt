package com.meshnet.app.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Design used Space Grotesk (headlines) + Space Mono (labels/telemetry).
// Swap these for the real Google Fonts via the downloadable-fonts API when ready;
// System default/monospace keep the same rhythm without a network fetch at first run.
val HeadlineFont = FontFamily.Default
val MonoFont = FontFamily.Monospace

object MeshType {
    val headlineXl = TextStyle(fontFamily = HeadlineFont, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 38.sp)
    val headlineLg = TextStyle(fontFamily = HeadlineFont, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 30.sp)
    val headlineMd = TextStyle(fontFamily = HeadlineFont, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 24.sp)
    val bodyLg = TextStyle(fontFamily = MonoFont, fontSize = 15.sp, lineHeight = 22.sp)
    val bodyMd = TextStyle(fontFamily = MonoFont, fontSize = 13.sp, lineHeight = 18.sp)
    val bodySm = TextStyle(fontFamily = MonoFont, fontSize = 11.sp, lineHeight = 16.sp)
    val labelLg = TextStyle(fontFamily = MonoFont, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 0.6.sp)
    val labelMd = TextStyle(fontFamily = MonoFont, fontWeight = FontWeight.Bold, fontSize = 10.sp, letterSpacing = 0.8.sp)
    val labelSm = TextStyle(fontFamily = MonoFont, fontWeight = FontWeight.Bold, fontSize = 9.sp, letterSpacing = 0.9.sp)
}
