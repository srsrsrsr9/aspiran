package com.upscpods.app.ui

import androidx.compose.foundation.isSystemInDarkTheme
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

// Fixed brand colours, dynamic colour off (ux-guide.md section 5).
// Never use #B8732A for buttons: it fails contrast with white.
private val Light = lightColorScheme(
    primary = Color(0xFF8D4F01),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFFFDCC0),
    onPrimaryContainer = Color(0xFF2D1600),
    tertiary = Color(0xFF14696B),
    surface = Color(0xFFFFF8F3),
    background = Color(0xFFFFF8F3),
    onSurface = Color(0xFF201B17),
    onBackground = Color(0xFF201B17),
    // Warm neutrals so Material's default purples never show through.
    secondaryContainer = Color(0xFFF5DEC8),
    onSecondaryContainer = Color(0xFF2B1700),
    surfaceVariant = Color(0xFFF1E0D0),
    surfaceContainerLow = Color(0xFFFCEFE3),
    surfaceContainer = Color(0xFFF8EADC),
)

private val Dark = darkColorScheme(
    primary = Color(0xFFFFB876),
    onPrimary = Color(0xFF4B2800),
    primaryContainer = Color(0xFF6B3B00),
    onPrimaryContainer = Color(0xFFFFDCC0),
    tertiary = Color(0xFF82D3D5),
    surface = Color(0xFF18120D),
    background = Color(0xFF18120D),
    onSurface = Color(0xFFE9E1DB),
    onBackground = Color(0xFFE9E1DB),
    secondaryContainer = Color(0xFF5A4331),
    onSecondaryContainer = Color(0xFFF8DEC8),
    surfaceVariant = Color(0xFF52443A),
    surfaceContainerLow = Color(0xFF221A14),
    surfaceContainer = Color(0xFF261E18),
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
        titleLarge = base.titleLarge.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold),
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
        colorScheme = if (isSystemInDarkTheme()) Dark else Light,
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
