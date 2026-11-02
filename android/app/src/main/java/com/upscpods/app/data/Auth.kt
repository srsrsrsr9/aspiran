package com.upscpods.app.data

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.FirebaseOptions
import com.google.firebase.FirebaseTooManyRequestsException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException
import com.google.firebase.auth.GoogleAuthProvider
import com.upscpods.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Where the access check stands. OFFLINE_OK is inside the 72-hour grace; OFFLINE_EXPIRED is past it: the app still
 * reads what the phone has (with a banner), but pod chat stays off until the account is checked again.
 */
enum class Access { OK, SIGN_IN, SUSPENDED, OFFLINE_OK, OFFLINE_EXPIRED }

/** A sign-in the server knows about. [label] and [email] are for this person only ("Signed in as a@b.com"). */
data class AuthSession(val uid: String, val memberId: String, val provider: String, val label: String, val email: String? = null)

/** The recovery email on a username account: [email] once checked, [pending] while its code is out. [mail] is false when the server can't send email. */
data class RecoveryEmail(val email: String?, val pending: String?, val mail: Boolean)

/**
 * Sign-in and the access switch (auth-build.md). Firebase Authentication proves who someone is (Google only,
 * through Credential Manager); the server's accounts table says whether they may use the app.
 *
 * - Every member call carries the Firebase ID token ([AuthInterceptor] on each OkHttp client).
 * - /me/status is checked on open and on resume, at most every 6 hours; a 403 account_suspended from any call counts too.
 * - Offline, the app keeps working from the phone. Past 72 hours from the last successful check, pod chat waits for a
 *   connection; Chai, the library, saved current affairs, PYQs and Calm still open.
 * - Debug builds without Firebase settings use the server's local dev sign-in (AUTH_MODE=dev, local addresses only).
 * - Username and password (server password.ts, when /config says auth.password) is the other way in: the server
 *   issues its own session token ("upw."), kept in these prefs and sent exactly like the Firebase ID token.
 *   With a recovery email (checked with a code), "Forgot password?" mails a single-use reset code.
 *
 * The Google email is kept by Firebase and the server's accounts table only; it is never shown to other
 * members and never sent to Chotu.
 */
object Auth {
    const val CHECK_EVERY_MS = 6 * 3_600_000L
    const val GRACE_MS = 72 * 3_600_000L
    private val MEMBER_ROUTE = Regex("^/(pods/(join|leave|me|choose|merge-stay)|pods/[\\w-]+/ws|members/profile|commons/[\\w-]+/ws|season/add|mocks/band|plus(/.*)?|chotu|chotu/report|consent|events|feedback|privacy/(export|delete)|rooms/(list|join|leave|photo)|rooms/photo/\\w+|rooms/[\\w-]+/ws|answers/evaluate|interview/follow)$")
    fun isMemberRoute(path: String) = MEMBER_ROUTE.matches(path.trimEnd('/'))

    /**
     * Firebase settings came with this build (BuildConfig, from local.properties). Google is the only sign-in, so the web
     * client id is needed too. A release build without them has sign-in off.
     */
    val firebaseBuilt = BuildConfig.FIREBASE_API_KEY.isNotBlank() && BuildConfig.FIREBASE_APP_ID.isNotBlank() && BuildConfig.FIREBASE_PROJECT_ID.isNotBlank() && BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotBlank()
    /** The local dev sign-in is offered only by debug builds; the server also refuses dev tokens outside local dev. */
    val devAllowed = BuildConfig.DEBUG
    /** This build can sign in at all: username and password needs nothing in the build, so always. */
    val enabled = true

    private lateinit var app: Context
    private val prefs by lazy { app.getSharedPreferences("auth", Context.MODE_PRIVATE) }
    private val json = Json { ignoreUnknownKeys = true }
    private val http = OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).build()
    private val main = Handler(Looper.getMainLooper())

    var session by mutableStateOf<AuthSession?>(null); private set
    /** The support contact while access is switched off, or null when it isn't. "" when the server gave none. */
    var suspended by mutableStateOf<String?>(null); private set
    var access by mutableStateOf(Access.OK); private set
    /** Called (on the main thread) when the server says the account is switched off: close sockets, drop cached server content. */
    var onSuspended: () -> Unit = {}

    private val fb: FirebaseAuth? by lazy {
        if (!firebaseBuilt) return@lazy null
        val options = FirebaseOptions.Builder()
            .setApiKey(BuildConfig.FIREBASE_API_KEY)
            .setApplicationId(BuildConfig.FIREBASE_APP_ID)
            .setProjectId(BuildConfig.FIREBASE_PROJECT_ID)
            .build()
        val fbApp = FirebaseApp.getApps(app).firstOrNull { it.name == FirebaseApp.DEFAULT_APP_NAME } ?: FirebaseApp.initializeApp(app, options)
        FirebaseAuth.getInstance(fbApp)
    }

    fun init(context: Context) {
        if (::app.isInitialized) return
        app = context.applicationContext
        session = prefs.getString("uid", null)?.let { uid ->
            AuthSession(uid, prefs.getString("memberId", "")!!, prefs.getString("provider", "")!!, prefs.getString("label", "")!!, prefs.getString("email", null))
        }
        suspended = if (prefs.getBoolean("suspended", false)) prefs.getString("support", "") else null
    }

    private val devToken: String? get() = prefs.getString("devToken", null)
    /** Our own session token after a username and password sign-in. */
    private val pwToken: String? get() = prefs.getString("pwToken", null)
    val lastOk: Long get() = prefs.getLong("lastOk", 0L)
    private fun markOk() = prefs.edit().putLong("lastOk", System.currentTimeMillis()).apply()

    /** A saved session with a live credential (Firebase keeps its user on the phone, so this holds offline). */
    val signedIn: Boolean get() = session != null && (devToken != null || pwToken != null || fb?.currentUser != null)

    /**
     * The ID token for a server call. Blocking: call it off the main thread (OkHttp's threads do).
     * Firebase refreshes it about once an hour; [force] gets a fresh one now.
     */
    fun tokenBlocking(force: Boolean = false): String? {
        devToken?.let { return it }
        pwToken?.let { return it }
        val u = fb?.currentUser ?: return null
        return try {
            Tasks.await(u.getIdToken(force), 15, TimeUnit.SECONDS).token
        } catch (e: Exception) {
            // A user deleted or disabled in Firebase can't sign in again: drop the session, the app asks to sign in.
            if (e.cause is FirebaseAuthInvalidUserException) signOutLocal()
            null
        }
    }

    // --- Signing in --------------------------------------------------------------------------------------

    /** Google through Credential Manager, then Firebase. Needs the Activity for the account picker. */
    suspend fun signInGoogle(activity: Activity) {
        val auth = fb ?: throw AuthError("Sign-in isn't set up in this build.")
        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isBlank()) throw AuthError("Google sign-in isn't set up in this build. Ask us for an updated app.")
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build())
            .build()
        // The real Credential Manager error type and message are shown (and logged), so a setup problem (a SHA-1 or
        // web client id that doesn't match) can be told apart from someone closing the picker.
        val result = try {
            CredentialManager.create(activity).getCredential(activity, request)
        } catch (e: GetCredentialCancellationException) {
            throw googleError("Google sign-in was closed before it finished", e)
        } catch (e: NoCredentialException) {
            throw googleError("No Google account could be used on this phone", e)
        } catch (e: GetCredentialException) {
            throw googleError("Google sign-in didn't work", e)
        } catch (e: Exception) {
            throw googleError("Couldn't open Google sign-in", e)
        }
        val c = result.credential
        if (c !is CustomCredential || c.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) throw AuthError("That wasn't a Google account. Try again.")
        val idToken = try { GoogleIdTokenCredential.createFrom(c.data).idToken } catch (e: Exception) { throw googleError("Google's answer couldn't be read", e) }
        try {
            withContext(Dispatchers.IO) { Tasks.await(auth.signInWithCredential(GoogleAuthProvider.getCredential(idToken, null)), 30, TimeUnit.SECONDS) }
        } catch (e: Exception) {
            throw googleError("Firebase didn't accept the Google sign-in", (e.cause as? Exception) ?: e)
        }
    }

    /** The last Google sign-in error with its type and code, to copy for support (no tokens or personal data). */
    var lastGoogleError by mutableStateOf<String?>(null); private set

    private fun googleError(what: String, e: Exception): AuthError {
        val detail = buildList {
            add(e.javaClass.simpleName)
            if (e is GetCredentialException) add("type=${e.type}")
            if (e is FirebaseAuthException) add("code=${e.errorCode}")
            e.message?.takeIf { it.isNotBlank() }?.let { add(it.take(300)) }
            e.cause?.let { c -> add("cause=${c.javaClass.simpleName}: ${c.message?.take(200) ?: ""}") }
        }.joinToString(" · ")
        val text = "$what. Details: $detail"
        android.util.Log.w("UpscAuth", text, e)
        main.post { lastGoogleError = text }
        return AuthError(text)
    }

    /**
     * Username and password: [signUp] creates the account. Saves the server's session token and the session, like
     * [establish]. Returns the session and whether a new password must be chosen (after a temporary one from staff).
     */
    suspend fun passwordSignIn(server: String, signUp: Boolean, username: String, password: String, memberIdHint: String?): Pair<AuthSession, Boolean> = withContext(Dispatchers.IO) {
        if (server.isBlank()) throw AuthError("Set the pod server first (Me → My Path).")
        val body = buildJsonObject {
            put("username", username.trim().lowercase()); put("password", password)
            memberIdHint?.let { put("memberId", it) }; put("appVersion", "android-" + BuildConfig.VERSION_NAME)
        }
        val req = Request.Builder().url("$server/auth/password/${if (signUp) "signup" else "signin"}")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        val d = postForSession(req)
        val s = savePasswordSession(d)
        withContext(Dispatchers.Main) {
            session = s
            if (d.str("status") == "suspended") markSuspended(d.str("support")) else { clearSuspended(); markOk(); access = Access.OK }
        }
        s to (d.str("mustChange") == "true")
    }

    /** Change the password (or choose one after a temporary password). Other devices are signed out. */
    suspend fun changePassword(server: String, current: String, next: String) = withContext(Dispatchers.IO) {
        val t = pwToken ?: throw AuthError("Please sign in again.")
        val body = buildJsonObject { put("current", current); put("next", next) }
        val req = Request.Builder().url("$server/auth/password/change").header("Authorization", "Bearer $t")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        val s = savePasswordSession(postForSession(req))
        withContext(Dispatchers.Main) { session = s }
    }

    // --- Recovery email and "Forgot password?" ---------------------------------------------------------------

    /** POST /auth/password/<op>. [signedIn] sends this phone's session token (for the account's own recovery email). */
    private fun pwCall(server: String, op: String, body: JsonObject = JsonObject(emptyMap()), signedIn: Boolean = false): JsonObject {
        if (server.isBlank()) throw AuthError("Set the pod server first (Me → My Path).")
        val b = Request.Builder().url("$server/auth/password/$op").post(body.toString().toRequestBody("application/json".toMediaType()))
        if (signedIn) b.header("Authorization", "Bearer ${pwToken ?: throw AuthError("Please sign in again.")}")
        return postForSession(b.build())
    }
    private fun JsonObject.recovery() = RecoveryEmail(str("email"), str("pending"), str("mail") == "true")

    suspend fun recoveryStatus(server: String) = withContext(Dispatchers.IO) { pwCall(server, "recovery", signedIn = true).recovery() }
    /** Sends a 6-digit code to [email]. The address is used only after [recoveryVerify]. */
    suspend fun recoveryAdd(server: String, email: String) = withContext(Dispatchers.IO) {
        pwCall(server, "recovery/add", buildJsonObject { put("email", email.trim()) }, signedIn = true).recovery()
    }
    suspend fun recoveryVerify(server: String, code: String) = withContext(Dispatchers.IO) {
        pwCall(server, "recovery/verify", buildJsonObject { put("code", code.trim()) }, signedIn = true).recovery()
    }
    suspend fun recoveryRemove(server: String) = withContext(Dispatchers.IO) { pwCall(server, "recovery/remove", signedIn = true).recovery() }

    /** By username or recovery email. The server's answer is the same whether or not the account exists. */
    suspend fun forgotPassword(server: String, who: String): String = withContext(Dispatchers.IO) {
        pwCall(server, "forgot", buildJsonObject { put("who", who.trim()) }).str("message") ?: "If that account has a recovery email, we've sent a code to it."
    }

    /** Sets a new password with the code from the email and signs this phone in. Other devices are signed out. */
    suspend fun resetPassword(server: String, code: String, next: String): AuthSession = withContext(Dispatchers.IO) {
        val d = pwCall(server, "reset", buildJsonObject { put("token", code.trim()); put("next", next); put("appVersion", "android-" + BuildConfig.VERSION_NAME) })
        val s = savePasswordSession(d)
        withContext(Dispatchers.Main) {
            session = s
            if (d.str("status") == "suspended") markSuspended(d.str("support")) else { clearSuspended(); markOk(); access = Access.OK }
        }
        s
    }

    private fun postForSession(req: Request): JsonObject {
        val (code, d) = try {
            http.newCall(req).execute().use { r -> r.code to runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrDefault(JsonObject(emptyMap())) }
        } catch (e: Exception) { throw AuthError("Couldn't reach the server. Try again when you're online.") }
        if (code !in 200..299) throw AuthError(d.str("error") ?: "Couldn't sign you in (error $code). Try again.")
        return d
    }

    private fun savePasswordSession(d: JsonObject): AuthSession {
        val username = d.str("username") ?: ""
        val s = AuthSession(d.str("uid") ?: "", d.str("memberId") ?: "", "password", "Signed in as @$username")
        prefs.edit().putString("pwToken", d.str("token")).putString("username", username).remove("devToken")
            .putString("uid", s.uid).putString("memberId", s.memberId).putString("provider", s.provider).putString("label", s.label).remove("email").apply()
        return s
    }

    /** Local dev only: a clearly fake token the server accepts when it runs with AUTH_MODE=dev on a local address. */
    fun devSignIn(email: String) {
        if (!devAllowed) throw AuthError("Dev sign-in is only in debug builds.")
        val contact = email.trim()
        if (!Regex("^[^@\\s]+@[^@\\s]+$").matches(contact)) throw AuthError("Type any email for the dev account.")
        prefs.edit().putString("devToken", "dev:${contact.filter { it.isLetterOrDigit() || it == '_' }.takeLast(30)}:$contact").apply()
    }

    /**
     * After Firebase (or dev) sign-in: tells the server, which creates the account on first sign-in and links this
     * phone's existing member id, so nothing is lost. Returns the session, or throws with a sentence to show.
     */
    suspend fun establish(server: String, memberIdHint: String?): AuthSession = withContext(Dispatchers.IO) {
        if (server.isBlank()) throw AuthError("Set the pod server first (Me → My Path).")
        val t = tokenBlocking(force = true) ?: throw AuthError("Not signed in.")
        val body = buildJsonObject { memberIdHint?.let { put("memberId", it) }; put("appVersion", "android-" + BuildConfig.VERSION_NAME) }
        val req = Request.Builder().url("$server/auth/session").header("Authorization", "Bearer $t")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        val (code, d) = try {
            http.newCall(req).execute().use { r -> r.code to runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrDefault(JsonObject(emptyMap())) }
        } catch (e: Exception) { throw AuthError("Couldn't reach the server. Try again when you're online.") }
        if (code !in 200..299) throw AuthError(d.str("error") ?: "Couldn't sign you in (error $code). Try again.")
        val u = fb?.currentUser
        val provider = d.str("provider") ?: ""
        val email = if (provider == "google.com") u?.email else if (provider == "password") null else devToken?.split(":")?.getOrNull(2)
        val label = if (provider == "password") "Signed in as @${prefs.getString("username", "")}"
            else (if (provider == "google.com") "Signed in with Google" else "Dev sign-in") + (email?.let { " as $it" } ?: "")
        val s = AuthSession(d.str("uid") ?: "", d.str("memberId") ?: memberIdHint ?: "", provider, label, email)
        prefs.edit().putString("uid", s.uid).putString("memberId", s.memberId).putString("provider", s.provider).putString("label", s.label).putString("email", s.email).apply()
        withContext(Dispatchers.Main) {
            session = s
            if (d.str("status") == "suspended") markSuspended(d.str("support")) else { clearSuspended(); markOk(); access = Access.OK }
        }
        s
    }

    /** Sign out on this phone. Everything saved on the phone stays. */
    suspend fun signOut() {
        signOutLocal()
        runCatching { CredentialManager.create(app).clearCredentialState(ClearCredentialStateRequest()) }
    }

    private fun signOutLocal() {
        prefs.edit().remove("uid").remove("memberId").remove("provider").remove("label").remove("email").remove("devToken").remove("pwToken").remove("username").apply()
        runCatching { fb?.signOut() }
        main.post { session = null }
    }

    /** For "Delete my data": removes the Firebase user too. Returns a sentence to show when that couldn't be done. */
    suspend fun deleteFirebaseUser(): String? {
        val u = fb?.currentUser
        val why = if (u == null) null else try { awaitTask(u.delete()); null } catch (e: Exception) {
            if (e is FirebaseAuthRecentLoginRequiredException) "Your data was deleted. To also remove your sign-in, sign in again and choose Delete once more."
            else "Your data was deleted, but we couldn't remove your sign-in. Write to us and we'll do it."
        }
        signOut()
        return why
    }

    // --- The access check ----------------------------------------------------------------------------------

    /** Checks /me/status when due (or now with [force]) and updates [access]. */
    suspend fun check(server: String, force: Boolean = false): Access {
        val result = checkNow(server, force)
        withContext(Dispatchers.Main) { access = result }
        return result
    }

    private suspend fun checkNow(server: String, force: Boolean): Access {
        if (suspended != null) return Access.SUSPENDED
        if (!signedIn) return Access.SIGN_IN
        val last = lastOk
        if (!force && System.currentTimeMillis() - last < CHECK_EVERY_MS) return Access.OK
        val grace = { if (System.currentTimeMillis() - last < GRACE_MS) Access.OFFLINE_OK else Access.OFFLINE_EXPIRED }
        if (server.isBlank()) return grace()
        return withContext(Dispatchers.IO) {
            try {
                val t = tokenBlocking() ?: return@withContext if (signedIn) grace() else Access.SIGN_IN
                val req = Request.Builder().url("$server/me/status").header("Authorization", "Bearer $t").header("Cache-Control", "no-store").build()
                val (code, d) = http.newCall(req).execute().use { r -> r.code to runCatching { json.parseToJsonElement(r.body.string()).jsonObject }.getOrDefault(JsonObject(emptyMap())) }
                when {
                    code == 403 && d.str("code") == "account_suspended" -> { withContext(Dispatchers.Main) { markSuspended(d.str("support")) }; Access.SUSPENDED }
                    code !in 200..299 -> grace() // the server is having trouble: the grace period covers it
                    d.str("status") == "suspended" -> { withContext(Dispatchers.Main) { markSuspended(d.str("support")) }; Access.SUSPENDED }
                    d.str("status") == "none" -> { establish(server, session?.memberId); Access.OK }
                    else -> { markOk(); Access.OK }
                }
            } catch (e: AuthError) { grace() } catch (e: Exception) { grace() }
        }
    }

    /** The server says this account is switched off: sign out, clear tokens, tell the app to drop cached server content. */
    fun markSuspended(support: String?) {
        if (Looper.myLooper() != Looper.getMainLooper()) { main.post { markSuspended(support) }; return }
        prefs.edit().putBoolean("suspended", true).putString("support", support ?: "").apply()
        suspended = support ?: ""
        access = Access.SUSPENDED
        signOutLocal()
        runCatching { onSuspended() }
    }

    /** After a suspension is lifted, the person signs in again from the notice. */
    fun clearSuspended() {
        prefs.edit().remove("suspended").remove("support").apply()
        suspended = null
        if (access == Access.SUSPENDED) access = Access.OK
    }

    private fun JsonObject.str(k: String) = this[k]?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }

    private fun friendly(e: Exception): String = when (e) {
        is FirebaseTooManyRequestsException -> "Too many tries. Wait a little and try again."
        is FirebaseNetworkException -> "You seem to be offline. Connect and try again."
        else -> "Couldn't sign you in. Please try again."
    }

    private suspend fun <T> awaitTask(task: Task<T>): T = suspendCancellableCoroutine { cont ->
        task.addOnSuccessListener { cont.resume(it) }
            .addOnFailureListener { cont.resumeWithException(if (it is AuthError) it else AuthError(friendly(it))) }
    }

    /** Server calls that see a 403 account_suspended, or succeed, report here (from OkHttp threads). */
    internal fun onMemberResponse(r: Response) {
        if (r.isSuccessful) { markOk(); return }
        if (r.code == 403) {
            val d = runCatching { json.parseToJsonElement(r.peekBody(4096).string()).jsonObject }.getOrNull() ?: return
            if (d.str("code") == "account_suspended") markSuspended(d.str("support"))
        }
    }
}

class AuthError(message: String) : Exception(message)

/**
 * Adds the ID token to every member call (and pod socket) on an OkHttp client. On a 401 it refreshes the token once;
 * a 403 account_suspended switches the app to the "access has been switched off" screen.
 */
object AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val req = chain.request()
        if (!Auth.isMemberRoute(req.url.encodedPath)) return chain.proceed(req)
        val token = Auth.tokenBlocking()
        var r = chain.proceed(if (token != null) req.newBuilder().header("Authorization", "Bearer $token").build() else req)
        if (r.code == 401 && token != null && !token.startsWith("dev:") && !token.startsWith("upw.")) {
            val fresh = Auth.tokenBlocking(force = true)
            if (fresh != null && fresh != token) { r.close(); r = chain.proceed(req.newBuilder().header("Authorization", "Bearer $fresh").build()) }
        }
        Auth.onMemberResponse(r)
        return r
    }
}
