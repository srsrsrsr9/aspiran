import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

// Firebase sign-in settings. These are public identifiers (not secrets), but they belong to one Firebase project,
// so they live in local.properties (never committed) or come from the build machine, not from this file.
val localProps = Properties().apply {
    rootProject.file("local.properties").takeIf { it.isFile }?.inputStream()?.use { load(it) }
}
fun firebaseValue(key: String, env: String): String =
    (localProps.getProperty("firebase.$key") ?: project.findProperty("upsc.firebase.$key") as String? ?: System.getenv(env))
        ?.trim()?.takeIf { it.isNotEmpty() && !it.contains('"') } ?: ""
val firebaseConfig = linkedMapOf(
    "FIREBASE_API_KEY" to firebaseValue("apiKey", "UPSC_FIREBASE_API_KEY"),
    "FIREBASE_APP_ID" to firebaseValue("appId", "UPSC_FIREBASE_APP_ID"),
    "FIREBASE_PROJECT_ID" to firebaseValue("projectId", "UPSC_FIREBASE_PROJECT_ID"),
    "GOOGLE_WEB_CLIENT_ID" to firebaseValue("webClientId", "UPSC_GOOGLE_WEB_CLIENT_ID"),
)

android {
    // Code package (namespace) stays com.upscpods.app: only the store id below is public, and `in` is a Kotlin keyword.
    namespace = "com.upscpods.app"
    compileSdk = 37

    defaultConfig {
        applicationId = "in.aspiran.app" // owner, 31 Oct 2026: set before the first Play upload; never change it after
        minSdk = 26
        targetSdk = 36
        versionCode = 11
        versionName = "0.5.3"
        // Sign-in (auth-build.md). No google-services.json: the four Firebase values come from local.properties
        // (firebase.apiKey, firebase.appId, firebase.projectId, firebase.webClientId), -Pupsc.firebase.<key>=..., or env.
        firebaseConfig.forEach { (field, value) -> buildConfigField("String", field, "\"$value\"") }
        // Google Play Billing for Plus (data/PlayBilling.kt). Off unless the build asks for it with -Pupsc.playBilling=true:
        // a build without it never starts a purchase, whatever the server's play_billing flag says.
        buildConfigField("boolean", "PLAY_BILLING", (project.findProperty("upsc.playBilling") == "true").toString())
        // Focus blocks close apps through an accessibility service (data/FocusGuard). Debug builds have it. Release and
        // review builds leave it out (src/release and src/review AndroidManifest.xml) until Play has approved the
        // accessibility declaration; to put it back, delete src/release/AndroidManifest.xml and set this to true there.
        buildConfigField("boolean", "FOCUS_GUARD", "true")
        // Usage analytics (data/Metrics.kt): PostHog's project token is write-only and public by design, not a secret.
        // Events, screen names and crashes only; no session replay on Android. Empty switches it off.
        buildConfigField("String", "POSTHOG_KEY", "\"phc_w8BUoc6nfx5UU7HFg2w5kZKTySWPBQKF6TbsQPPs8Sbx\"")
        buildConfigField("String", "POSTHOG_HOST", "\"https://us.i.posthog.com\"")
    }

    // Release signing. The keystore and its passwords never live in this repo: they come from
    // keystore.properties (path below, outside the repo by default) or from environment variables.
    // keystore.properties keys: storeFile, storePassword, keyAlias, keyPassword.
    // Env vars: UPSC_KEYSTORE_FILE, UPSC_KEYSTORE_PASSWORD, UPSC_KEY_ALIAS, UPSC_KEY_PASSWORD.
    // Point at another properties file with -PkeystoreProperties=/path/to/keystore.properties.
    val keystorePropsFile = file(
        (project.findProperty("keystoreProperties") as String?)
            ?: System.getenv("UPSC_KEYSTORE_PROPERTIES")
            ?: "${rootDir.parentFile.parentFile}/upsc-pods-keys/keystore.properties",
    )
    val keystoreProps = Properties().apply {
        if (keystorePropsFile.isFile) keystorePropsFile.inputStream().use { load(it) }
    }
    fun signingValue(key: String, env: String): String? =
        (keystoreProps.getProperty(key) ?: System.getenv(env))?.takeIf { it.isNotBlank() }
    val releaseSigning = mapOf(
        "storeFile" to signingValue("storeFile", "UPSC_KEYSTORE_FILE"),
        "storePassword" to signingValue("storePassword", "UPSC_KEYSTORE_PASSWORD"),
        "keyAlias" to signingValue("keyAlias", "UPSC_KEY_ALIAS"),
        "keyPassword" to signingValue("keyPassword", "UPSC_KEY_PASSWORD"),
    )

    signingConfigs {
        create("release") {
            releaseSigning["storeFile"]?.let { storeFile = file(it) }
            storePassword = releaseSigning["storePassword"]
            keyAlias = releaseSigning["keyAlias"]
            keyPassword = releaseSigning["keyPassword"]
        }
    }

    buildTypes {
        debug {
            // Debug builds keep the server typed in Me → Settings; nothing is preset.
            buildConfigField("String", "DEFAULT_SERVER", "\"\"")
        }
        release {
            isMinifyEnabled = false
            // The pod server release builds talk to (the live workers.dev address; change this line for a custom domain).
            // Release builds accept https only (see data/ServerPolicy.kt).
            buildConfigField("String", "DEFAULT_SERVER", "\"https://app.aspiran.in\"")
            buildConfigField("boolean", "FOCUS_GUARD", "false")
            signingConfig = signingConfigs.getByName("release")
        }
        // A test copy to send to a phone over WhatsApp or Drive: the release app, signed with the debug key and without
        // the Focus accessibility service (src/review/AndroidManifest.xml), because Play Protect in India blocks
        // sideloaded apps that have one. ./gradlew assembleReview → app/build/outputs/apk/review/app-review.apk
        create("review") {
            initWith(getByName("release"))
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

// Fail a release build early, with a clear message, when the signing details are missing.
// Debug builds never need them. Android Studio's Build > Generate Signed App Bundle / APK passes its own
// keystore as android.injected.signing.* properties, which replace this signingConfig, so skip the check then.
gradle.taskGraph.whenReady {
    val wantsRelease = allTasks.any { it.project == project && it.name.contains("Release") && (it.name.startsWith("assemble") || it.name.startsWith("bundle") || it.name.startsWith("package")) }
    if (!wantsRelease) return@whenReady
    // Without Firebase a release build still builds, with sign-in turned off (no sign-in screen, no gate: the app
    // works as it did before sign-in). Adding the values turns it on. Debug builds use the local dev sign-in instead.
    val missingFirebase = firebaseConfig.filterValues { it.isBlank() }.keys
    if (missingFirebase.isNotEmpty()) logger.warn(
        "WARNING: Sign-in is OFF in this release build (no Firebase settings). Missing: ${missingFirebase.joinToString(", ")}. " +
            "Add firebase.apiKey, firebase.appId, firebase.projectId and firebase.webClientId to android/local.properties " +
            "(or pass -Pupsc.firebase.<key>=...) to turn it on. Google is the only sign-in, so all four are needed. See auth-build.md.",
    )
    if (project.hasProperty("android.injected.signing.store.file")) return@whenReady
    val cfg = android.signingConfigs.getByName("release")
    val missing = buildList {
        if (cfg.storeFile == null) add("storeFile (UPSC_KEYSTORE_FILE)")
        else if (!cfg.storeFile!!.isFile) add("storeFile: no file at ${cfg.storeFile}")
        if (cfg.storePassword.isNullOrBlank()) add("storePassword (UPSC_KEYSTORE_PASSWORD)")
        if (cfg.keyAlias.isNullOrBlank()) add("keyAlias (UPSC_KEY_ALIAS)")
        if (cfg.keyPassword.isNullOrBlank()) add("keyPassword (UPSC_KEY_PASSWORD)")
    }
    if (missing.isNotEmpty()) throw GradleException(
        "Release signing isn't set up. Missing: ${missing.joinToString(", ")}. " +
            "Put them in a keystore.properties outside this repo (default: ../../upsc-pods-keys/keystore.properties, " +
            "or pass -PkeystoreProperties=/path), or set the environment variables. See android/README.md.",
    )
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.appcompat)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    testImplementation("junit:junit:4.13.2")
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.work.runtime)
    implementation(libs.okhttp)
    implementation(libs.androidsvg)
    implementation(libs.litertlm)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services)
    implementation(libs.googleid)
    implementation(libs.installreferrer)
    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.ui)
    implementation(libs.androidx.media3.datasource)
    implementation(libs.androidx.media3.database)
    implementation(libs.play.billing)
    implementation("com.posthog:posthog-android:3.76.2")
    debugImplementation(libs.androidx.compose.ui.tooling)
}
