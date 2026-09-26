package com.meshnet.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Token names/values match the Stitch "MeshNet" export 1:1 so the Compose UI
 * stays visually identical to the HTML mockups without re-deriving a palette.
 */
object MeshColors {
    val Background = Color(0xFF071421)
    val Surface = Color(0xFF071421)
    val SurfaceContainerLowest = Color(0xFF030F1B)
    val SurfaceContainerLow = Color(0xFF101D29)
    val SurfaceContainer = Color(0xFF14212D)
    val SurfaceContainerHigh = Color(0xFF1E2B38)
    val SurfaceContainerHighest = Color(0xFF293643)
    val SurfaceVariant = Color(0xFF293643)
    val SurfaceBright = Color(0xFF2E3A48)

    val OnBackground = Color(0xFFD6E4F6)
    val OnSurface = Color(0xFFD6E4F6)
    val OnSurfaceVariant = Color(0xFFE5BDBE)

    // Accent: signal-green, used for "connected"/active-relay states
    val Secondary = Color(0xFF6CFFBF)
    val SecondaryContainer = Color(0xFF00E5A0)
    val OnSecondary = Color(0xFF003824)
    val OnSecondaryContainer = Color(0xFF006141)

    // Amber: relay / medical / low-power states
    val Tertiary = Color(0xFFFFBA4B)
    val TertiaryContainer = Color(0xFFC48400)
    val OnTertiary = Color(0xFF442B00)
    val OnTertiaryContainer = Color(0xFF3B2500)

    // Warning-red: emergency / SOS
    val Primary = Color(0xFFFFB3B6)
    val PrimaryContainer = Color(0xFFFF5168)
    val OnPrimary = Color(0xFF68001A)
    val OnPrimaryContainer = Color(0xFF5B0015)

    val Error = Color(0xFFFFB4AB)
    val ErrorContainer = Color(0xFF93000A)
    val OnError = Color(0xFF690005)
    val OnErrorContainer = Color(0xFFFFDAD6)

    val Outline = Color(0xFFAC8889)
    val OutlineVariant = Color(0xFF5C3F41)
}
