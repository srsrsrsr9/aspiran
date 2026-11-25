package com.upscpods.app.ui

import android.annotation.SuppressLint
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
    fun join() { if (!joined) { joined = true; onJoin() } }
    BackHandler { val w = web; if (w != null && w.canGoBack()) w.goBack() else onClose() }
    DisposableEffect(Unit) { onDispose { web?.destroy() } }
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
                        loadUrl("$base/app/#try/path-pol-federalism")
                        web = this
                    }
                }, modifier = Modifier.fillMaxSize())
            }
        }
    }
}
