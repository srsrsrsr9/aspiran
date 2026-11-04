package com.upscpods.app.ui

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.upscpods.app.R

// Earth and sky (artefacts/design/earth-and-sky.md). The Adda is earth (chai, clay, cardamom); Prep is sky, in Kulhad.kt.
// Chai is the one accent in both. Same values as the web app and the website. Dynamic colour off (ux-guide.md section 5).
// Never use #C8693A for buttons: it fails contrast with white.
private val Light = lightColorScheme(
    primary = Color(0xFF9A4E0E),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFF6E2C9),
    onPrimaryContainer = Color(0xFF2A1B12),
    tertiary = Color(0xFF4F6B3E),
    surface = Color(0xFFF7F2EA),
    background = Color(0xFFF7F2EA),
    onSurface = Color(0xFF2A1B12),
    onBackground = Color(0xFF2A1B12),
    onSurfaceVariant = Color(0xFF6E5A4C),
    outline = Color(0xFFB9A693),
    outlineVariant = Color(0xFFE4D8C8),
    // Warm neutrals so Material's default purples never show through.
    secondaryContainer = Color(0xFFE3EAD9),
    onSecondaryContainer = Color(0xFF26301C),
    surfaceVariant = Color(0xFFEDE3D5),
    surfaceContainerLow = Color(0xFFFFFDF9),
    surfaceContainer = Color(0xFFF1E9DD),
)

private val Dark = darkColorScheme(
    primary = Color(0xFFF0A04B),
    onPrimary = Color(0xFF1B1205),
    primaryContainer = Color(0xFF3B2716),
    onPrimaryContainer = Color(0xFFF6E2C9),
    tertiary = Color(0xFF9DBB83),
    surface = Color(0xFF17100B),
    background = Color(0xFF17100B),
    onSurface = Color(0xFFF3E8DA),
    onBackground = Color(0xFFF3E8DA),
    onSurfaceVariant = Color(0xFFBFA996),
    outline = Color(0xFF6E5A4C),
    outlineVariant = Color(0xFF3A2B1F),
    secondaryContainer = Color(0xFF26301C),
    onSecondaryContainer = Color(0xFFE3EAD9),
    surfaceVariant = Color(0xFF3A2B1F),
    surfaceContainerLow = Color(0xFF22180F),
    surfaceContainer = Color(0xFF2A1E14),
)

// Martel 400/700 (SIL OFL, licence in assets/licenses) covers Latin and Devanagari.
val ReadingFont: FontFamily = FontFamily(
    Font(R.font.martel_regular, FontWeight.Normal),
    Font(R.font.martel_bold, FontWeight.Bold),
)

/** Reading text: 17 sp on 27 sp (English). Hindi uses ReadingHindi. */
val ReadingText = TextStyle(
    fontFamily = ReadingFont,
    fontSize = 17.sp,
    lineHeight = 27.sp,
    lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None),
)
/** Devanagari needs at least 1.6x line height; 17 sp × 1.7 ≈ 29 sp. */
val ReadingHindi = ReadingText.copy(lineHeight = 29.sp)

private val AppTypography = Typography().let { base ->
    base.copy(
        // Headings in Martel, as on the website and the web app.
        headlineLarge = base.headlineLarge.copy(fontFamily = ReadingFont, fontWeight = FontWeight.Bold),
        headlineMedium = base.headlineMedium.copy(fontFamily = ReadingFont, fontWeight = FontWeight.Bold),
        headlineSmall = base.headlineSmall.copy(fontFamily = ReadingFont, fontWeight = FontWeight.Bold),
        titleLarge = base.titleLarge.copy(fontFamily = ReadingFont, fontSize = 20.sp, fontWeight = FontWeight.Bold),
        labelSmall = base.labelSmall.copy(fontSize = 12.sp), // nothing under 12 sp
    )
}

private val AppShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(12.dp),
)

@Composable
fun PodsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isDark()) Dark else Light,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}

/** Flat card: 12 dp corners, no shadow. */
@Composable
fun FlatCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = content,
    )
}

/** Main-action height (56 dp); everything else meets 48 dp by Material defaults. */
val MainActionHeight = 56.dp
