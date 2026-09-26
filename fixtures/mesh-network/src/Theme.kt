package com.meshnet.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val MeshDarkScheme = darkColorScheme(
    background = MeshColors.Background,
    surface = MeshColors.Surface,
    surfaceVariant = MeshColors.SurfaceVariant,
    onBackground = MeshColors.OnBackground,
    onSurface = MeshColors.OnSurface,
    onSurfaceVariant = MeshColors.OnSurfaceVariant,
    primary = MeshColors.Primary,
    onPrimary = MeshColors.OnPrimary,
    primaryContainer = MeshColors.PrimaryContainer,
    onPrimaryContainer = MeshColors.OnPrimaryContainer,
    secondary = MeshColors.Secondary,
    onSecondary = MeshColors.OnSecondary,
    secondaryContainer = MeshColors.SecondaryContainer,
    onSecondaryContainer = MeshColors.OnSecondaryContainer,
    tertiary = MeshColors.Tertiary,
    onTertiary = MeshColors.OnTertiary,
    tertiaryContainer = MeshColors.TertiaryContainer,
    onTertiaryContainer = MeshColors.OnTertiaryContainer,
    error = MeshColors.Error,
    onError = MeshColors.OnError,
    errorContainer = MeshColors.ErrorContainer,
    onErrorContainer = MeshColors.OnErrorContainer,
    outline = MeshColors.Outline,
    outlineVariant = MeshColors.OutlineVariant,
)

@Composable
fun MeshNetTheme(content: @Composable () -> Unit) {
    // MeshNet is always dark — matches the "works when everything else is down" mood.
    MaterialTheme(
        colorScheme = MeshDarkScheme,
        typography = Typography(),
        content = content
    )
}
