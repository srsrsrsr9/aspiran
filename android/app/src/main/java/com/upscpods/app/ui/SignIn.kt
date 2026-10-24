package com.upscpods.app.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.Auth
import com.upscpods.app.data.AuthConfig
import com.upscpods.app.data.AuthSession
import com.upscpods.app.data.RecoveryEmail
import kotlinx.coroutines.launch

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}

/**
 * Google (or, in debug builds against a local test server, the dev sign-in), and under it "Use username and
 * password" when the server offers it (auth.password). Calls [onDone] once the
 * server knows this account. [memberIdHint] is this phone's existing member id, so an install from before sign-in
 * keeps its pod. [onRetryConfig] reloads /config when it hasn't loaded yet.
 */
@Composable
fun SignInPanel(server: String, auth: AuthConfig?, memberIdHint: String?, onRetryConfig: suspend () -> Unit, onDone: (AuthSession) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var msg by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    fun finish() {
        msg = "Checking your account…"
        scope.launch {
            try { onDone(Auth.establish(server, memberIdHint)) } catch (e: Exception) { msg = e.message; busy = false }
        }
    }
    val status: @Composable () -> Unit = {
        msg?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
        // A Google error carries its type and code: let the person copy it for support.
        val clip = LocalClipboardManager.current
        if (msg != null && msg == Auth.lastGoogleError) TextButton(onClick = { clip.setText(AnnotatedString(msg ?: "")) }) { Text("Copy error details") }
    }
    val pwOn = auth?.password == true && server.isNotBlank()
    val recoveryOn = pwOn && auth?.recovery == true
    var pwOpen by rememberSaveable { mutableStateOf(false) }
    var mustChange by remember { mutableStateOf<AuthSession?>(null) }

    FlatCard {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val mode = auth?.mode
            val googleReady = mode == "firebase" && Auth.firebaseBuilt
            val devReady = mode == "dev" && Auth.devAllowed
            mustChange?.let { s ->
                ChangePasswordForm(server, forced = true) { onDone(s) }
                return@Column
            }
            when {
                pwOn && !googleReady && !devReady -> PasswordForm(server, memberIdHint, open = true, recoveryOn) { s, change -> if (change) mustChange = s else onDone(s) }
                server.isBlank() -> Text("Set the pod server first, in Me → My Path. Then come back here to sign in.")
                mode == null -> {
                    Text("Connect to the internet to sign in. It only takes a minute.")
                    OutlinedButton(enabled = !busy, onClick = { busy = true; scope.launch { onRetryConfig(); busy = false } }) { Text("Try again") }
                }
                mode == "dev" && Auth.devAllowed -> {
                    var who by rememberSaveable { mutableStateOf("") }
                    Text("Local test server: no Firebase, a fake sign-in. Real builds show the Google button here.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(who, { who = it.take(60) }, singleLine = true, placeholder = { Text("Any email (dev only)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth())
                    Button(enabled = !busy, onClick = {
                        busy = true
                        try { Auth.devSignIn(who); finish() } catch (e: Exception) { msg = e.message; busy = false }
                    }) { Text("Dev sign-in") }
                    status()
                }
                mode == "firebase" && Auth.firebaseBuilt -> {
                    Button(enabled = !busy, modifier = Modifier.fillMaxWidth().height(MainActionHeight), onClick = {
                        val a = context.activity() ?: return@Button
                        busy = true; msg = null
                        scope.launch { try { Auth.signInGoogle(a); finish() } catch (e: Exception) { msg = e.message; busy = false } }
                    }) { Text("Continue with Google") }
                    status()
                    Text("We keep your Google email only to sign you in.", style = MaterialTheme.typography.bodySmall)
                }
                mode == "firebase" -> Text("This test build has no sign-in settings, so it can't sign in to this server. Use a build made with the Firebase settings (auth-build.md), or a local test server.")
                else -> Text("Sign-in isn't set up on this server yet, so your pod and ${Brand.MASCOT_SHORT} online can't open. The Free Shelf, Today's Chai and your own tools still work.")
            }
            if (pwOn && (googleReady || devReady)) {
                if (!pwOpen) TextButton(onClick = { pwOpen = true }) { Text("Use username and password") }
                else PasswordForm(server, memberIdHint, open = false, recoveryOn) { s, change -> if (change) mustChange = s else onDone(s) }
            }
        }
    }
}

/**
 * Username and password: sign in, or create an account. A forgotten password is reset by email when the account has
 * a recovery email and the server can send mail ([recovery]); otherwise staff set a temporary one.
 */
@Composable
private fun PasswordForm(server: String, memberIdHint: String?, open: Boolean, recovery: Boolean, onDone: (AuthSession, Boolean) -> Unit) {
    val scope = rememberCoroutineScope()
    var signUp by rememberSaveable { mutableStateOf(false) }
    var forgot by rememberSaveable { mutableStateOf(false) }
    var user by rememberSaveable { mutableStateOf("") }
    var pass by remember { mutableStateOf("") }
    var pass2 by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    fun submit() {
        val u = user.trim().lowercase()
        if (signUp) {
            if (!Regex("^[a-z0-9_.]{3,30}$").matches(u)) { msg = "Usernames are 3 to 30 small letters, numbers, _ or ."; return }
            if (pass.length < 8) { msg = "Use at least 8 characters for your password."; return }
            if (pass != pass2) { msg = "The two passwords don't match."; return }
        } else if (u.isEmpty() || pass.isEmpty()) { msg = "Type your username and password."; return }
        busy = true; msg = if (signUp) "Creating your account…" else "Signing in…"
        scope.launch {
            try {
                val (s, change) = Auth.passwordSignIn(server, signUp, u, pass, memberIdHint)
                pass = ""; pass2 = ""; onDone(s, change)
            } catch (e: Exception) { msg = e.message; busy = false }
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (!open) Text("Username and password", style = MaterialTheme.typography.titleSmall)
        OutlinedTextField(user, { user = it.take(30) }, singleLine = true, label = { Text("Username") }, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii, autoCorrectEnabled = false, imeAction = ImeAction.Next))
        OutlinedTextField(pass, { pass = it.take(200) }, singleLine = true, label = { Text("Password") }, modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))
        if (signUp) {
            OutlinedTextField(pass2, { pass2 = it.take(200) }, singleLine = true, label = { Text("Password again") }, modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))
            Text("Usernames are 3 to 30 small letters, numbers, _ or . Use at least 8 characters for the password. " +
                if (recovery) "After signing in you can add a recovery email in Me, in case you forget it." else "Keep your password safe: if you forget it, write to support and we'll set a temporary one.",
                style = MaterialTheme.typography.bodySmall)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Button(enabled = !busy, onClick = { submit() }) { Text(if (signUp) "Create account" else "Sign in") }
            TextButton(enabled = !busy, onClick = { signUp = !signUp; msg = null }) { Text(if (signUp) "I have an account" else "New here? Create an account") }
        }
        msg?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
        if (!signUp) {
            if (!forgot) TextButton(onClick = { forgot = true }) { Text("Forgot password?") }
            else if (recovery) ForgotPasswordForm(server) { s -> onDone(s, false) }
            else Text("Write to support and we'll set a temporary password for you. You choose a new one when you sign in.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

/** Forgot password: a code by email (username or recovery email), then a new password with it. Signs this phone in. */
@Composable
private fun ForgotPasswordForm(server: String, onDone: (AuthSession) -> Unit) {
    val scope = rememberCoroutineScope()
    var who by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var next by remember { mutableStateOf("") }
    var again by remember { mutableStateOf("") }
    var haveCode by rememberSaveable { mutableStateOf(false) }
    var msg by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Forgot password?", style = MaterialTheme.typography.titleSmall)
        Text("If you added a recovery email, we'll send a code to it. It works once, for 30 minutes.", style = MaterialTheme.typography.bodySmall)
        OutlinedTextField(who, { who = it.take(200) }, singleLine = true, label = { Text("Username or recovery email") }, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, autoCorrectEnabled = false))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedButton(enabled = !busy, onClick = {
                if (who.isBlank()) { msg = "Type your username or your recovery email."; return@OutlinedButton }
                busy = true; msg = "Sending…"
                scope.launch {
                    try { msg = Auth.forgotPassword(server, who); haveCode = true } catch (e: Exception) { msg = e.message }
                    busy = false
                }
            }) { Text("Email me a code") }
            if (!haveCode) TextButton(onClick = { haveCode = true }) { Text("I have a code") }
        }
        if (haveCode) {
            OutlinedTextField(code, { code = it.trim().take(60) }, singleLine = true, label = { Text("Code from the email") }, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii, autoCorrectEnabled = false))
            listOf(
                Triple("New password (at least 8 characters)", next) { v: String -> next = v },
                Triple("New password again", again) { v: String -> again = v },
            ).forEach { (label, value, set) ->
                OutlinedTextField(value, { set(it.take(200)) }, singleLine = true, label = { Text(label) }, modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))
            }
            Button(enabled = !busy, onClick = {
                when {
                    code.isBlank() -> msg = "Paste the code from the email."
                    next.length < 8 -> msg = "Use at least 8 characters."
                    next != again -> msg = "The two new passwords don't match."
                    else -> {
                        busy = true; msg = "Saving…"
                        scope.launch {
                            try { val s = Auth.resetPassword(server, code, next); next = ""; again = ""; code = ""; msg = null; onDone(s) }
                            catch (e: Exception) { msg = e.message; busy = false }
                        }
                    }
                }
            }) { Text("Set my new password") }
        }
        msg?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
    }
}

/** Me → Account: an email for "Forgot password?", used only after its 6-digit code is typed in. */
@Composable
fun RecoveryEmailForm(server: String, onDone: () -> Unit) {
    val scope = rememberCoroutineScope()
    var st by remember { mutableStateOf<RecoveryEmail?>(null) }
    var email by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    LaunchedEffect(server) { try { st = Auth.recoveryStatus(server) } catch (e: Exception) { msg = e.message } }
    fun act(busyText: String, call: suspend () -> RecoveryEmail) {
        busy = true; msg = busyText
        scope.launch {
            try { st = call(); msg = null; code = "" } catch (e: Exception) { msg = e.message }
            busy = false
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Recovery email", style = MaterialTheme.typography.titleSmall)
        Text("Only for resetting your password if you forget it. We don't send anything else, and nobody else sees it.", style = MaterialTheme.typography.bodySmall)
        val s = st
        when {
            s == null -> if (msg == null) Text("Loading…", style = MaterialTheme.typography.bodySmall)
            !s.mail -> Text("Email isn't set up on this server yet.", style = MaterialTheme.typography.bodyMedium)
            else -> {
                Text(s.email?.let { "Recovery email: $it" } ?: "No recovery email yet.", style = MaterialTheme.typography.bodyMedium)
                s.pending?.let { p ->
                    Text("We sent a code to $p. Type it here. It works for 30 minutes.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(code, { v -> code = v.filter { it.isDigit() }.take(6) }, singleLine = true, label = { Text("6-digit code") }, modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword))
                    Button(enabled = !busy, onClick = { act("Checking…") { Auth.recoveryVerify(server, code) } }) { Text("Confirm") }
                }
                OutlinedTextField(email, { email = it.trim().take(200) }, singleLine = true, label = { Text("Email address") }, modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, autoCorrectEnabled = false))
            }
        }
        Row {
            if (st?.mail == true) OutlinedButton(enabled = !busy, onClick = { act("Sending a code…") { Auth.recoveryAdd(server, email) } }) { Text(if (st?.email != null) "Change email" else "Send a code") }
            if (st?.email != null) TextButton(enabled = !busy, onClick = { act("Removing…") { Auth.recoveryRemove(server) } }) { Text("Remove") }
            TextButton(enabled = !busy, onClick = onDone) { Text("Close") }
        }
        msg?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
    }
}

/** After a temporary password ([forced]), or from Me → Account. Other devices are signed out. */
@Composable
fun ChangePasswordForm(server: String, forced: Boolean, onDone: () -> Unit) {
    val scope = rememberCoroutineScope()
    var cur by remember { mutableStateOf("") }
    var next by remember { mutableStateOf("") }
    var again by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(if (forced) "Choose a new password" else "Change password", style = MaterialTheme.typography.titleSmall)
        if (forced) Text("You signed in with a temporary password. Choose your own now.", style = MaterialTheme.typography.bodySmall)
        listOf(
            Triple(if (forced) "Temporary password" else "Current password", cur) { v: String -> cur = v },
            Triple("New password (at least 8 characters)", next) { v: String -> next = v },
            Triple("New password again", again) { v: String -> again = v },
        ).forEach { (label, value, set) ->
            OutlinedTextField(value, { set(it.take(200)) }, singleLine = true, label = { Text(label) }, modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))
        }
        Row {
            Button(enabled = !busy, onClick = {
                when {
                    next.length < 8 -> msg = "Use at least 8 characters."
                    next != again -> msg = "The two new passwords don't match."
                    else -> {
                        busy = true; msg = "Saving…"
                        scope.launch {
                            try { Auth.changePassword(server, cur, next); cur = ""; next = ""; again = ""; msg = null; onDone() }
                            catch (e: Exception) { msg = e.message; busy = false }
                        }
                    }
                }
            }) { Text(if (forced) "Set my new password" else "Change password") }
            if (!forced) TextButton(enabled = !busy, onClick = onDone) { Text("Cancel") }
        }
        msg?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) }
    }
}

/** An install from before sign-in: one screen, and everything on the phone stays as it is. */
@Composable
fun SignInScreen(name: String?, server: String, auth: AuthConfig?, memberIdHint: String, onRetryConfig: suspend () -> Unit, onNeedToTalk: () -> Unit, onDone: (AuthSession) -> Unit) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = onNeedToTalk) { Text("Need to talk?") } }
            ChotuSays((if (!name.isNullOrBlank()) "Welcome back, ${name.trim()}! " else "Welcome back! ") +
                "The app now asks everyone to sign in once, to keep the Adda safe. Your journal, stamps, profile and saved work stay on this phone as they are, and your pod stays yours.")
            SignInPanel(server, auth, memberIdHint, onRetryConfig, onDone)
            Text("Your Google email or username is only for signing in. Your pod never sees it, and it never goes to ${Brand.MASCOT_SHORT}.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

/** Calm and full screen. Notes stay on the phone unless the person chooses to delete them. */
@Composable
fun SuspendedScreen(support: String?, onSignInAgain: () -> Unit, onDeleteLocal: () -> Unit, onNeedToTalk: () -> Unit) {
    val context = LocalContext.current
    var confirm by remember { mutableStateOf(false) }
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Kulhad(ChotuMood.CALM, 72.dp)
            Text("Your access has been switched off", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            FlatCard {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("You can't use UPSC Pods with this account right now, so you've been signed out.", style = ReadingText)
                    if (!support.isNullOrBlank()) {
                        Text("If you think this is a mistake, or want to talk about it, write to $support.", style = ReadingText)
                        TextButton(onClick = {
                            val uri = if ('@' in support) Uri.parse("mailto:$support") else Uri.parse(support)
                            runCatching { context.startActivity(Intent(if ('@' in support) Intent.ACTION_SENDTO else Intent.ACTION_VIEW, uri)) }
                        }) { Text("Contact support") }
                    } else Text("If you think this is a mistake, write to the UPSC Pods team.", style = ReadingText)
                    Text("Your journal, notes and saved work are still on this phone. Nothing has been deleted.", style = MaterialTheme.typography.bodySmall)
                }
            }
            OutlinedButton(onClick = onSignInAgain, modifier = Modifier.fillMaxWidth()) { Text("Sign in again") }
            TextButton(onClick = { confirm = true }) { Text("Delete my data") }
            TextButton(onClick = onNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }
        }
    }
    if (confirm) AlertDialog(
        onDismissRequest = { confirm = false },
        title = { Text("Delete everything on this phone?") },
        text = { Text("Your journal, profile, answers, mock results and focus log will be deleted from this phone. This can't be undone. To erase what the server holds too, write to us (you can't sign in while access is off).") },
        confirmButton = { TextButton(onClick = { confirm = false; onDeleteLocal() }) { Text("Delete") } },
        dismissButton = { TextButton(onClick = { confirm = false }) { Text("Keep it") } },
    )
}

/** Offline for more than 72 hours since the last successful check. */
@Composable
fun OfflineGate(onTryAgain: suspend () -> Unit, onNeedToTalk: () -> Unit) {
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxSize().safeDrawingPadding().verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Kulhad(ChotuMood.CALM, 72.dp)
            Text("Connect to the internet to keep using UPSC Pods", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            Text("It's been more than three days since the app could check your account. Connect once and everything opens again; nothing is lost.", style = ReadingText, textAlign = TextAlign.Center)
            Button(enabled = !busy, modifier = Modifier.fillMaxWidth().height(MainActionHeight), onClick = { busy = true; scope.launch { onTryAgain(); busy = false } }) {
                Text(if (busy) "Checking…" else "Try again")
            }
            TextButton(onClick = onNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }
        }
    }
}
