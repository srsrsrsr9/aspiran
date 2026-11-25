package com.upscpods.app.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContextWrapper
import android.view.View
import android.webkit.WebChromeClient
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.content.Intent
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.upscpods.app.data.DemoCards
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

/**
 * The front door (26 Nov 2026, owner: "the web app is better: there is a Federalism demo I can try without doing all
 * this"). A new install sees the same open demo the website sends people to, before any sign-up: one big button into
 * it, "Join free" beside it, and sign-in for people who already have an account. Nothing is asked first.
 */
@Composable
fun FrontDoor(onTry: () -> Unit, onJoin: () -> Unit, onSignIn: () -> Unit) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(
            Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Spacer(Modifier.height(24.dp))
            Kulhad(ChotuMood.HAPPY, 72.dp, lively = true)
            Text("Remember what you read.", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
            Text("UPSC prep that sticks, and never alone. Try it before you sign up.", style = ReadingText)
            Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Try one topic, free", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Text("Federalism, in about 15 minutes", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Text("Guess first, read a little, real PYQs, a Mains plan. No account, no setup.",
                        color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Button(onClick = onTry, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Start the tour", fontWeight = FontWeight.Bold) }
                }
            }
            OutlinedButton(onClick = onJoin, modifier = Modifier.fillMaxWidth().height(48.dp)) { Text("Join free, no card needed") }
            TextButton(onClick = onSignIn, modifier = Modifier.fillMaxWidth()) { Text("I already have an account") }
        }
    }
}

/** Routes the web app opens without an account (PUBLIC in server/public/app/app.js). Anything else means "Join". */
private val OPEN_ROUTES = setOf("shelf", "compass", "cost", "maps", "thinker", "routine", "roadmap", "calm", "talk", "try", "tryback", "tryit", "tour")

/** The route name in a web app URL's fragment ("#try/federalism" → "try"); "" for none. */
internal fun routeOf(url: String?): String = url?.substringAfter('#', "")?.substringBefore('/')?.substringBefore('?')?.substringBefore('=').orEmpty()

/**
 * The open demo, exactly as on the web (app.aspiran.in/app/#try), full screen. When the visitor taps a Join button
 * inside it, the web app moves to its sign-up route: we catch that and open the app's own sign-up instead.
 * Links that leave the web app open in the phone's browser.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TryDemoScreen(appUrl: String, onJoin: () -> Unit, onClose: () -> Unit) {
    val context = LocalContext.current
    var web by remember { mutableStateOf<WebView?>(null) }
    var joined by remember { mutableStateOf(false) }
    val base = appUrl.trimEnd('/')
    // Joining carries the demo's kept cards into the app's Review (data/DemoCards.kt), as the demo promises.
    fun join() {
        if (joined) return
        joined = true
        val w = web
        if (w == null) { onJoin(); return }
        w.evaluateJavascript("localStorage.getItem('upsc:reviews')") { r ->
            runCatching { Json.parseToJsonElement(r ?: "null").jsonPrimitive.contentOrNull }.getOrNull()?.let { DemoCards.hold(context, it) }
            onJoin()
        }
    }
    // A video's full-screen button: the WebView hands us the player's view; we show it over everything, with the
    // system bars hidden. Back (or the player's own button) brings it back. (No forced rotation: turning the screen
    // would rebuild the activity and reload the demo.)
    var full by remember { mutableStateOf<View?>(null) }
    var fullDone by remember { mutableStateOf<WebChromeClient.CustomViewCallback?>(null) }
    val activity = remember(context) { context.findActivity() }
    DisposableEffect(full) {
        val a = activity
        if (full != null && a != null) {
            val bars = WindowCompat.getInsetsController(a.window, a.window.decorView)
            bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            bars.hide(WindowInsetsCompat.Type.systemBars())
            onDispose { bars.show(WindowInsetsCompat.Type.systemBars()) }
        } else onDispose { }
    }
    fun leaveFull() { fullDone?.onCustomViewHidden(); full = null; fullDone = null }
    BackHandler { val w = web; if (full != null) leaveFull() else if (w != null && w.canGoBack()) w.goBack() else onClose() }
    DisposableEffect(Unit) { onDispose { fullDone?.onCustomViewHidden(); web?.destroy() } }
    Box(Modifier.fillMaxSize()) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxSize().safeDrawingPadding()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onClose) { Text("✕ Close") }
                // The demo has its own Join buttons; one more here would be a second ask on the same screen.
            }
            Box(Modifier.weight(1f)) {
                AndroidView(factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        // Chotu's voice in the demo starts on the visitor's first tap, as on the web.
                        settings.mediaPlaybackRequiresUserGesture = true
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                                val u = request.url.toString()
                                if (u.startsWith("$base/app")) return false
                                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))) }
                                return true
                            }
                            override fun doUpdateVisitedHistory(view: WebView, url: String?, isReload: Boolean) {
                                if (url != null && url.startsWith("$base/app") && routeOf(url) !in OPEN_ROUTES) join()
                            }
                        }
                        webChromeClient = object : WebChromeClient() {
                            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                                if (full != null) { callback.onCustomViewHidden(); return }
                                full = view; fullDone = callback
                            }
                            override fun onHideCustomView() { full = null; fullDone = null }
                        }
                        loadUrl("$base/app/#try/path-pol-federalism")
                        web = this
                    }
                }, modifier = Modifier.fillMaxSize())
            }
        }
    }
    full?.let { v ->
        AndroidView(factory = { v }, modifier = Modifier.fillMaxSize().background(Color.Black))
    }
    }
}

private tailrec fun android.content.Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}
