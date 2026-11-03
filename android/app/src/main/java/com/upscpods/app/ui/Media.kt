package com.upscpods.app.ui

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.media.MediaPlayer
import android.provider.Settings
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import com.caverock.androidsvg.SVG
import com.upscpods.app.R
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.NewsItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/** True when the phone's "remove animations" setting is on: show every state still. */
fun reducedMotion(context: Context): Boolean =
    Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f

/** Renders a server SVG (AndroidSVG keeps its <text> labels) at the width it's shown at. */
suspend fun renderSvg(library: ContentLibrary, path: String, widthPx: Int): Bitmap? = withContext(Dispatchers.Default) {
    val f = library.file(path) ?: return@withContext null
    runCatching {
        val svg = SVG.getFromString(f.readText())
        val box = svg.documentViewBox ?: RectF(0f, 0f, svg.documentWidth.coerceAtLeast(1f), svg.documentHeight.coerceAtLeast(1f))
        val h = (widthPx * box.height() / box.width()).toInt().coerceAtLeast(1)
        val bmp = Bitmap.createBitmap(widthPx, h, Bitmap.Config.ARGB_8888)
        svg.setDocumentWidth("100%")
        svg.setDocumentHeight("100%")
        svg.renderToCanvas(Canvas(bmp), RectF(0f, 0f, widthPx.toFloat(), h.toFloat()))
        bmp
    }.getOrNull()
}

/** A card or item drawing. Shows nothing until it's loaded, and nothing at all in data saver. */
@Composable
fun SvgImage(library: ContentLibrary?, path: String?, modifier: Modifier = Modifier, aspect: Float = 1.6f) {
    if (library == null || path == null || library.dataSaver()) return
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val px = with(LocalDensity.current) { maxWidth.roundToPx() }.coerceIn(64, 1440)
        val bmp by produceState<ImageBitmap?>(null, path, px) { value = renderSvg(library, path, px)?.asImageBitmap() }
        bmp?.let {
            Image(it, contentDescription = null, contentScale = ContentScale.FillWidth, modifier = Modifier.fillMaxWidth().aspectRatio(it.width.toFloat() / it.height))
        }
    }
}

/**
 * A looping sound (soundscape or music bed) that only plays after the person turned sound on.
 * Released when the screen that owns it leaves.
 */
class LoopPlayer {
    private var player: MediaPlayer? = null
    var playingPath by mutableStateOf<String?>(null)
        private set

    fun play(file: File, path: String, gain: Float = 1f, loop: Boolean = true, onDone: () -> Unit = {}) {
        stop()
        player = runCatching {
            MediaPlayer().apply {
                setDataSource(file.absolutePath)
                isLooping = loop
                setVolume(gain, gain)
                setOnCompletionListener { if (!loop) { stop(); onDone() } }
                prepare()
                start()
            }
        }.getOrNull()
        playingPath = if (player != null) path else null
    }

    fun pause() = runCatching { player?.pause() }
    fun resume() = runCatching { player?.start() }
    fun setGain(g: Float) = runCatching { player?.setVolume(g, g) }

    fun stop() {
        runCatching { player?.stop() }
        player?.release()
        player = null
        playingPath = null
    }
}

@Composable
fun rememberLoopPlayer(): LoopPlayer {
    val p = remember { LoopPlayer() }
    DisposableEffect(p) { onDispose { p.stop() } }
    return p
}

/**
 * "Chai of the Day" status card, 1080×1920, drawn on the phone in the reading language.
 * Never for tragic or unshareable cards.
 */
suspend fun shareCard(context: Context, library: ContentLibrary?, item: NewsItem, hindi: Boolean, date: String) {
    val v = item.text(hindi)
    val file = withContext(Dispatchers.Default) {
        val w = 1080
        val h = 1920
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        c.drawColor(0xFFF7F2EA.toInt())
        val reading = runCatching { ResourcesCompat.getFont(context, R.font.martel_bold) }.getOrNull() ?: Typeface.DEFAULT_BOLD
        val readingRegular = runCatching { ResourcesCompat.getFont(context, R.font.martel_regular) }.getOrNull() ?: Typeface.DEFAULT
        fun text(s: String, size: Float, color: Int, face: Typeface, top: Float, width: Int = w - 160): Float {
            val p = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = size; this.color = color; typeface = face }
            val layout = StaticLayout.Builder.obtain(s, 0, s.length, p, width).setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(0f, if (hindi) 1.25f else 1.1f).build()
            c.save(); c.translate(80f, top); layout.draw(c); c.restore()
            return top + layout.height
        }
        var y = 140f
        y = text(if (hindi) "आज की चाय" else "Chai of the Day", 54f, 0xFF9A4E0E.toInt(), reading, y)
        y = text(date, 36f, 0xFF6B5E54.toInt(), readingRegular, y + 8f)
        val art = item.illustration?.takeIf { library != null && !library.dataSaver() }?.let { renderSvg(library!!, it, w - 160) }
        if (art != null) {
            c.drawBitmap(art, 80f, y + 48f, null)
            y += 48f + art.height
        }
        y = text(v.chips.joinToString("  ·  "), 34f, 0xFF14696B.toInt(), readingRegular, y + 56f)
        y = text(v.headline, 64f, 0xFF201B17.toInt(), reading, y + 24f)
        v.takeaway?.let { y = text(it, 46f, 0xFF201B17.toInt(), readingRegular, y + 40f) }
        val foot = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = 36f; color = 0xFF9A4E0E.toInt(); typeface = reading }
        c.drawText("Aspiran ☕", 80f, h - 120f, foot)
        val dir = File(context.cacheDir, "share").apply { mkdirs() }
        File(dir, "chai-${item.id}-${if (hindi) "hi" else "en"}.png").also { f -> f.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) } }
    }
    val uri = FileProvider.getUriForFile(context, context.packageName + ".share", file)
    val send = Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM, uri)
        .putExtra(Intent.EXTRA_TEXT, v.takeaway ?: v.headline)
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    context.startActivity(Intent.createChooser(send, if (hindi) "कार्ड शेयर करें" else "Share this card"))
}
