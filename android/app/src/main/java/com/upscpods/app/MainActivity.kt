package com.upscpods.app

import com.upscpods.app.ui.LampOff
import com.upscpods.app.ui.LibraryScreen
import com.upscpods.app.data.ContentLibrary
import com.upscpods.app.data.DistressMatcher
import com.upscpods.app.data.MockMcq
import com.upscpods.app.data.PlusGate
import com.upscpods.app.data.Prep
import com.upscpods.app.data.PrepQ
import com.upscpods.app.ui.CompilationScreen
import com.upscpods.app.ui.InsightsScreen
import com.upscpods.app.ui.LearnHubScreen
import com.upscpods.app.ui.LongReadsScreen
import com.upscpods.app.ui.PlusInfoScreen
import com.upscpods.app.ui.PlusBanner
import com.upscpods.app.ui.SevenWays
import com.upscpods.app.ui.CaPlayerScreen
import com.upscpods.app.ui.CaWeekCard
import com.upscpods.app.data.CurrentAffairs
import com.upscpods.app.ui.SyllabusStrip
import com.upscpods.app.ui.SyllabusTab
import com.upscpods.app.ui.plusWays
import com.upscpods.app.ui.PrepEntries
import com.upscpods.app.ui.PrepTool
import com.upscpods.app.ui.ReaderScreen
import com.upscpods.app.ui.ReviseScreen
import com.upscpods.app.ui.WeeklyTestScreen
import com.upscpods.app.data.AppConfig
import com.upscpods.app.ui.AnnouncementBanner
import androidx.compose.foundation.layout.Column
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import com.upscpods.app.ui.ChotuTour
import com.upscpods.app.ui.MePage
import com.upscpods.app.ui.TabGlyph
import com.upscpods.app.ui.TabIcon
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.LifecycleResumeEffect
import com.upscpods.app.data.Access
import com.upscpods.app.data.Auth
import com.upscpods.app.data.Metrics
import com.upscpods.app.data.RoadmapStore
import com.upscpods.app.ui.RoadmapSection
import com.upscpods.app.data.AuthSession
import com.upscpods.app.ui.OfflineGate
import com.upscpods.app.ui.SignInPanel
import com.upscpods.app.ui.SignInScreen
import com.upscpods.app.ui.SuspendedScreen
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.upscpods.app.data.Brief
import com.upscpods.app.data.BriefRepository
import com.upscpods.app.data.AppRepository
import com.upscpods.app.data.DayState
import com.upscpods.app.data.PodClient
import com.upscpods.app.data.Chotu
import com.upscpods.app.data.NewsItem
import com.upscpods.app.data.Practice
import com.upscpods.app.data.PracticeQuestion
import com.upscpods.app.data.TaskId
import com.upscpods.app.ui.ChotuMood
import com.upscpods.app.ui.ChotuSays
import com.upscpods.app.data.ReadingLanguage
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch
import com.upscpods.app.data.ProfileStore
import com.upscpods.app.ui.OnboardingScreen
import com.upscpods.app.ui.LaunchWelcome
import com.upscpods.app.data.LanguageRequests
import androidx.compose.ui.platform.LocalContext
import com.upscpods.app.ui.ChaiScreen
import com.upscpods.app.ui.CloseTheDayScreen
import com.upscpods.app.ui.MascotTab
import com.upscpods.app.ui.MyPathTab
import com.upscpods.app.ui.NeedToTalkSheet
import com.upscpods.app.ui.PodTab
import com.upscpods.app.ui.RoomsScreen
import com.upscpods.app.ui.AnswerStudioScreen
import com.upscpods.app.data.Rooms
import com.upscpods.app.data.AnswerLog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay
import com.upscpods.app.ui.RatingSheet
import com.upscpods.app.ui.PodsTheme
import com.upscpods.app.ui.MainsScreen
import com.upscpods.app.ui.PracticeTab
import com.upscpods.app.ui.PrelimsScreen
import com.upscpods.app.ui.TodayScreen
import com.upscpods.app.ui.FiveMinutePill
import com.upscpods.app.data.Nudge
import com.upscpods.app.data.Ritual
import com.upscpods.app.data.Rituals
import com.upscpods.app.data.Recall
import com.upscpods.app.data.Week
import com.upscpods.app.data.Focus
import com.upscpods.app.ui.FocusScreen
import com.upscpods.app.data.Guide
import com.upscpods.app.data.PodStatus
import com.upscpods.app.data.quoteFor
import com.upscpods.app.ui.HonestGuideLinks
import com.upscpods.app.ui.HonestNumbers
import com.upscpods.app.ui.KnowThePaper
import com.upscpods.app.ui.PlanBBothWays
import com.upscpods.app.ui.PlanningMirror
import com.upscpods.app.ui.ShelfScreen
import com.upscpods.app.ui.ShouldersScreen
import com.upscpods.app.ui.WoopCard
import com.upscpods.app.ui.WoopLine
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import com.upscpods.app.data.Community
import com.upscpods.app.data.StagedProfile
import com.upscpods.app.ui.AddaTab
import com.upscpods.app.ui.MeTab
import com.upscpods.app.ui.PrepSpace
import com.upscpods.app.ui.ProfileAskCard
import com.upscpods.app.ui.ShelfTool
import com.upscpods.app.ui.ShelfToolScreen
import com.upscpods.app.ui.StampToast
import com.upscpods.app.ui.StayOrMoveCard
import com.upscpods.app.ui.Rhythm
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.MaterialTheme
import com.upscpods.app.ui.FlatCard
import com.upscpods.app.ui.MockListTab
import com.upscpods.app.ui.MockPaperScreen
import com.upscpods.app.ui.MockResultScreen
import com.upscpods.app.data.Mocks
import com.upscpods.app.data.ActiveMock
import com.upscpods.app.data.MockPaper
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import java.time.DayOfWeek
import java.time.LocalDate

// AppCompatActivity so app language and reading language can use per-app locales.
class MainActivity : AppCompatActivity() {
    // A nudge tapped while the app is already open (singleTask): onNewIntent hands its ritual to the screen.
    private val nudged = mutableStateOf<Ritual?>(null)

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val r = Ritual.of(intent.getStringExtra(Rituals.EXTRA))
        nudged.value = r ?: Ritual.CHAI.takeIf { intent.getBooleanExtra(Nudge.EXTRA_FROM_NUDGE, false) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Auth.init(this)
        enableEdgeToEdge()
        val brief = BriefRepository.loadBundled(this)
        // Opened from a ritual nudge (data/Rituals.kt): straight into its action. Morning Chai goes to Today's Chai.
        val ritual = Ritual.of(intent?.getStringExtra(Rituals.EXTRA))
        val fromNudge = intent?.getBooleanExtra(Nudge.EXTRA_FROM_NUDGE, false) == true || ritual == Ritual.CHAI
        // After the system splash (the steaming kulhad icon), today's greeting rises from the kulhad for a moment.
        // Members only: someone new gets the full eleven-language welcome as the first onboarding screen.
        val greet = savedInstanceState == null && !fromNudge && ritual == null && ProfileStore.load(this).onboarded
        setContent {
            PodsTheme {
                var welcome by rememberSaveable { mutableStateOf(greet) }
                Box(Modifier.fillMaxSize()) {
                    AppRoot(brief, fromNudge, ritual.takeIf { savedInstanceState == null }, nudged.value, onNudged = { nudged.value = null }, onDial = { number ->
                        // ACTION_DIAL opens the dialer pre-filled; no call permission needed.
                        startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")))
                    })
                    if (welcome) LaunchWelcome { welcome = false }
                }
            }
        }
    }
}

// Community-first: Adda (people, warm) is home; Prep (study, cool) holds Today's 3, Practice and My Plan.
private enum class Tab(val label: String, val glyph: TabGlyph) {
    ADDA("Adda", TabGlyph.ADDA),
    POD("Pod", TabGlyph.POD),
    MASCOT(Brand.MASCOT_SHORT, TabGlyph.CHOTU),
    PREP("Prep", TabGlyph.PREP),
    ME("Me", TabGlyph.ME),
}

// Four chips (sell-first plan W2): Mocks sits inside "Practice & Mocks"; Plus opens from its banner and the locked layers.
private enum class PrepSub(val label: String) { TODAY("Today"), SYLLABUS("Syllabus"), PRACTICE("Practice & Mocks"), MOCKS("Mocks"), PLAN("My Plan") }

private enum class Overlay { NONE, CHAI, CLOSE_DAY, PRELIMS, MAINS, ANSWER_STUDIO, CARDS, LIBRARY, LAMP, REMEMBER, SHOULDERS, SHELF, FOCUS, TOOL, MOCK, MOCK_RESULT, LEARN, READS, READER, PREP_TOOL, PLUS_INFO, CA }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppRoot(bundled: Brief, fromNudge: Boolean, ritual: Ritual?, nudged: Ritual?, onNudged: () -> Unit, onDial: (String) -> Unit) {
    val context = LocalContext.current
    var profile by remember { mutableStateOf(ProfileStore.load(context)) }
    val staged = remember { StagedProfile(context) }
    val pod = remember { PodClient(context) }
    val community = remember { Community({ pod.serverUrl }, { pod.memberId }) }
    // Open rooms (server rooms.ts) and Answer Studio's attempt log.
    val rooms = remember { Rooms(context, community, pod) }
    val answerLog = remember { AnswerLog(context) }
    val roadmap = remember { RoadmapStore(context) { pod.serverUrl } }
    val langRequests = remember { LanguageRequests(context) }
    // Growth counts (data/Metrics.kt): first open with the Play referrer, then one app_open a day. Never any text.
    LaunchedEffect(Unit) { Metrics.init(context, { pod.serverUrl }, { Auth.session?.memberId ?: pod.memberId }); Metrics.boot() }
    // Language requests made offline (or before a server was set) go up when the server can be reached.
    LaunchedEffect(Unit) { langRequests.sync(community) }
    // The admin console's switches, banners and sign-in settings; the last answer holds offline.
    val config = remember { AppConfig(context) { pod.serverUrl } }
    LaunchedEffect(Unit) { config.refresh() }
    val scope = rememberCoroutineScope()

    // Sign-in (data/Auth.kt, auth-build.md). Not needed with no server set (debug), or while the server doesn't require
    // it and this build can't sign in to it anyway (rollout), or in a release build made without Firebase settings
    // (sign-in is off in that build: no sign-in screen, no gate). Otherwise every member call carries the account's token.
    val authCfg = config.auth
    val authOptional = pod.serverUrl.isBlank() || !Auth.enabled || (authCfg != null && !authCfg.required && !authCfg.password &&
        (authCfg.mode == "unconfigured" || (authCfg.mode == "firebase" && !Auth.firebaseBuilt) || (authCfg.mode == "dev" && !Auth.devAllowed)))
    pod.mayConnect = { Auth.suspended == null && (authOptional || Auth.signedIn) && Auth.access != Access.OFFLINE_EXPIRED }
    remember(pod) { Auth.onSuspended = { pod.forget(); rooms.forget() }; true }
    // The access check: on open and whenever the app comes back, at most every 6 hours (Auth.check throttles).
    LifecycleResumeEffect(authOptional) {
        if (!authOptional) scope.launch { Auth.check(pod.serverUrl) }
        onPauseOrDispose { }
    }
    var gateTalk by rememberSaveable { mutableStateOf(false) }
    // A sign-in whose account already had a member id (from another phone) brings that pod here.
    val signedIn = { s: AuthSession -> if (s.memberId.isNotBlank()) pod.adoptMemberId(s.memberId) }
    if (!profile.onboarded) {
        // Switched off at sign-in during first run: the notice; there's nothing saved on the phone yet but the language vote.
        Auth.suspended?.let { support ->
            SuspendedScreen(support, onSignInAgain = { Auth.clearSuspended() },
                onDeleteLocal = { langRequests.clear(); Auth.clearSuspended() }, onNeedToTalk = { gateTalk = true })
            if (gateTalk) NeedToTalkSheet(onDial, onDismiss = { gateTalk = false })
            return
        }
        OnboardingScreen(langRequests, community,
            signIn = if (authOptional) null else ({ done ->
                SignInPanel(pod.serverUrl, config.auth, pod.memberId, onRetryConfig = { config.refresh() }) { s -> signedIn(s); done() }
            }),
            onFinish = { consented, persona ->
            ProfileStore.save(context, consented, persona)
            Metrics.track("onboarding_done")
            // The reading language is also the pod's language: one of the four matching fields.
            persona?.let { staged.set("lang", if (it.language == ReadingLanguage.HINDI) "hindi" else "english", "told") }
            profile = ProfileStore.load(context)
        })
        return
    }
    val persona = profile.persona
    if (!authOptional && Auth.suspended == null && !Auth.signedIn) {
        // An install from before sign-in (or after Sign out): one screen; everything on the phone stays.
        SignInScreen(persona?.name, pod.serverUrl, config.auth, pod.memberId, onRetryConfig = { config.refresh() }, onNeedToTalk = { gateTalk = true }) { s ->
            signedIn(s); pod.start(persona)
        }
        if (gateTalk) NeedToTalkSheet(onDial, onDismiss = { gateTalk = false })
        return
    }
    if (!authOptional && Auth.suspended == null && Auth.access == Access.OFFLINE_EXPIRED) {
        OfflineGate(onTryAgain = { if (Auth.check(pod.serverUrl, force = true) == Access.OK) pod.start(persona) }, onNeedToTalk = { gateTalk = true })
        if (gateTalk) NeedToTalkSheet(onDial, onDismiss = { gateTalk = false })
        return
    }
    val day = remember { DayState() }
    val repo = remember { AppRepository(context) }
    val chotu = remember { Chotu.get(context) }
    val recall = remember { Recall(context) }
    val week = remember { Week(context) }
    // Editor-approved explainers, games, sounds and Lamp Off from the pod server, cached for offline.
    val library = remember { ContentLibrary(context) { pod.serverUrl } }
    // Cinematic current affairs (W7): the week's scenes from the server's /ca, kept for offline.
    val ca = remember { CurrentAffairs(context) { pod.serverUrl } }
    remember(pod, staged) {
        pod.matchFields = { staged.synced() }
        pod.onStamp = { staged.award(it) }
        // Smarter Chotu: approved notes go with online questions only when the member switched it on.
        chotu.memoryNotes = { if (staged.smarterChotu && staged.notes.isNotEmpty()) "What I asked you to remember:\n" + staged.notes.joinToString("\n") { "- $it" } else null }
        true
    }
    var closedDays by remember { mutableStateOf(emptyList<LocalDate>()) }
    // Result-day mode: the admin's result days, or the member's own 72 hours.
    val result: String? = config.resultNow?.let { it.label.ifBlank { "It's a result week. No wins posts, no offers, and ${Brand.MASCOT_SHORT} stays quiet." } }
        ?: if (staged.myResultMode) "You switched on result-day mode." else null
    LaunchedEffect(config.podChat, config.podJoin) { pod.gate(config.podChat, config.podJoin, persona) }
    // Open mode: below the sign-up threshold nobody new is matched; the Pod tab shows the rooms.
    pod.roomsOnly = { config.podsOpen }
    // The room list (and the Pod tab's unread badge) refreshes while the app is on screen.
    val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(androidx.lifecycle.Lifecycle.State.STARTED) { while (true) { rooms.refresh(); delay(60_000) } }
    }
    // Monday's goal nudge says how many people are starting the week in your biggest room: a real count, kept from here.
    LaunchedEffect(rooms.joined, pod.summary) {
        val big = rooms.joined.maxByOrNull { it.members }
        if (big != null && big.members >= (pod.summary?.humans ?: 0)) Rituals.noteCount(context, big.name, big.members)
        else pod.summary?.humans?.let { Rituals.noteCount(context, "your pod", it) }
    }
    // Connected while the app is on screen; the server keeps the pod's history meanwhile.
    LifecycleStartEffect(pod) {
        // Opening the app at all means the last nudge wasn't ignored.
        Nudge.opened(context)
        Nudge.schedule(context)
        pod.start(persona)
        onStopOrDispose { pod.stop() }
    }
    var brief by remember { mutableStateOf(bundled) }
    var loaded by remember { mutableStateOf(false) }

    // Today opens from the local cache; nothing here waits on the network.
    LaunchedEffect(Unit) {
        brief = repo.latestBrief { bundled }
        // Newer pack from the pod server, if one is set and reachable. Today never waits on this.
        pod.latestBrief()?.let { raw -> runCatching { repo.cacheBrief(raw) }.getOrNull() }?.let { if (it.date >= brief.date || brief.sample) brief = it }
        repo.ensureCached(brief)
        repo.loadInto(day)
        loaded = true
        closedDays = repo.closedDays()
        staged.checkStamps(closedDays, pod.joinedOn)
        library.refresh()
        ca.refresh()
    }
    val hindi = persona?.language == ReadingLanguage.HINDI
    val bank = remember { Practice.loadBank(context) }
    val mains = remember(brief, hindi) { Practice.mainsTask(brief, hindi) }
    var questions by remember { mutableStateOf(emptyList<PracticeQuestion>()) }
    var saved by remember { mutableStateOf(emptyList<NewsItem>()) }
    var archive by remember { mutableStateOf(emptyList<Brief>()) }
    var cardsToRead by remember { mutableStateOf<Brief?>(null) }
    var overlay by rememberSaveable {
        mutableStateOf(when {
            fromNudge -> Overlay.CHAI
            ritual == Ritual.ANSWER_HOUR || ritual == Ritual.COMEBACK -> Overlay.ANSWER_STUDIO
            ritual == Ritual.SUNDAY_CA -> Overlay.CA
            else -> Overlay.NONE
        })
    }
    // A ritual done: Chotu's reaction, and a stamp the first time (W4).
    var reward by remember { mutableStateOf<Ritual?>(null) }
    // The nudge this open came from, until its screen is closed.
    var arrived by rememberSaveable { mutableStateOf(ritual) }
    val ritualDone = { r: Ritual -> if (Rituals.finished(context, r)) { reward = r; staged.award(r.stamp) } }
    var yesterdayQ by remember { mutableStateOf<PracticeQuestion?>(null) }
    var monthly by remember { mutableStateOf(emptyList<PracticeQuestion>()) }
    // "Just 5 minutes": when it started, while it runs.
    var fiveAt by rememberSaveable { mutableStateOf<Long?>(null) }
    // "Why this works" and the reading shelf open on one entry; Back returns where they came from.
    var guideAnchor by rememberSaveable { mutableStateOf<String?>(null) }
    var guideBack by rememberSaveable { mutableStateOf(Overlay.NONE) }
    val openWhy = { key: String -> guideBack = overlay; guideAnchor = key; overlay = Overlay.SHOULDERS }
    val openShelf = { book: String? -> guideBack = if (overlay == Overlay.SHOULDERS) guideBack else overlay; guideAnchor = book; overlay = Overlay.SHELF }
    var woopDue by remember { mutableStateOf(week.woopDue()) }
    var woop by remember { mutableStateOf(week.woop()) }
    var mirror by remember { mutableStateOf(week.mirror()) }
    // Mock papers: the paper in progress lives in a file, so it resumes after the app is closed.
    val mocks = remember { Mocks(context) }
    val prep = remember { Prep(context) }
    var misses by remember { mutableStateOf(prep.misses()) }
    // A distress match anywhere keeps offers away for a day (the never-list).
    remember(prep) { DistressMatcher.onMatch = { prep.markCare() }; true }
    var activeMock by remember { mutableStateOf(mocks.active()) }
    var mockHistory by remember { mutableStateOf(mocks.history()) }
    var mockUsedUp by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { if (activeMock != null) overlay = Overlay.MOCK }
    val startMock = { p: MockPaper ->
        scope.launch {
            // With Plus switched on, full papers count against the monthly allowance. The quick mock never does.
            if (config.plus && !p.quick && !community.useMockAllowance()) { mockUsedUp = true; return@launch }
            activeMock = mocks.start(p)
            Focus.start(context, mocks.focusMinutes(p), p.title)
            overlay = Overlay.MOCK
        }
        Unit
    }
    val submitMock = { m: ActiveMock ->
        mocks.submit(m)
        Focus.stop(context)
        // A wrong Chai-card question comes back in Prelims practice in 3 days, as in the daily set.
        m.paper.questions.forEachIndexed { i, q ->
            val a = m.answers[i]
            // Every wrong answer goes to the error log (mock insights, revise my misses).
            if (a != null) { if (a != q.en.answerIndex) prep.addMiss(PrepQ(q.id, q.topic, q.en)) else prep.clearMiss(q.id) }
            if (q.cardId != null && a != null && a != q.en.answerIndex) {
                val pq = PracticeQuestion(q.id, q.topic, com.upscpods.app.data.Mcq(q.en.question, q.en.options, q.en.answerIndex, q.en.explanation), q.cardId, false)
                scope.launch { repo.recordAnswer(pq, false) }
            }
        }
        activeMock = null
        misses = prep.misses()
        mockHistory = mocks.history()
        overlay = Overlay.MOCK_RESULT
    }
    var libraryItem by rememberSaveable { mutableStateOf<String?>(null) }
    // A piece opened from the Learn hub returns there; everything else returns home.
    var libraryBack by rememberSaveable { mutableStateOf(Overlay.NONE) }
    val openItem = { id: String -> libraryBack = if (overlay == Overlay.LEARN) Overlay.LEARN else Overlay.NONE; libraryItem = id; overlay = Overlay.LIBRARY }
    // Learn and play, long reads and the Plus tools (data/Prep.kt, ui/PrepScreens.kt).
    var readId by rememberSaveable { mutableStateOf<String?>(null) }
    // The current-affairs week and scene to open; no week means the latest (the Sunday nudge opens that one).
    var caWeek by rememberSaveable { mutableStateOf<String?>(null) }
    var caScene by rememberSaveable { mutableStateOf(0) }
    var prepTool by rememberSaveable { mutableStateOf(PrepTool.WEEKLY) }
    var prepBack by rememberSaveable { mutableStateOf(Overlay.NONE) }
    val openTool = { t: PrepTool -> if (overlay != Overlay.PREP_TOOL) prepBack = overlay; prepTool = t; overlay = Overlay.PREP_TOOL }
    val openPlusInfo = { if (overlay != Overlay.PLUS_INFO) prepBack = overlay; overlay = Overlay.PLUS_INFO }
    var plusMember by remember { mutableStateOf<Boolean?>(null) }
    // Debug builds only: a "plus" switch in the "debug" prefs opens the Plus tools for demos and screenshots.
    val debugPlus = remember { BuildConfig.DEBUG && context.getSharedPreferences("debug", Context.MODE_PRIVATE).getBoolean("plus", false) }
    val plusGate = if (debugPlus) PlusGate(member = true) else PlusGate(member = plusMember == true, loading = plusMember == null)
    val plusQuiet = prep.quiet(day.paused, result != null) != null
    val bankQs = remember(bank) { bank.map { PrepQ(it.id, it.topic, MockMcq(it.en.question, it.en.options, it.en.answerIndex, it.en.explanation)) } }
    val prepAnswer = { q: PrepQ, right: Boolean -> if (right) prep.clearMiss(q.id) else prep.addMiss(q); misses = prep.misses() }
    val weekQs = remember(archive, brief) { prep.chaiQuestions((listOf(brief) + archive).distinctBy { it.date }, 7) }
    val monthQs = remember(archive, brief) { prep.chaiQuestions((listOf(brief) + archive).distinctBy { it.date }, 30) }
    LaunchedEffect(loaded, brief, day.savedCards) {
        if (!loaded) return@LaunchedEffect
        archive = repo.archive()
        if (questions.isEmpty()) questions = Practice.prelimsSet(brief, repo.dueCards(), bank, hindi, misses = recall.fridayMisses(archive, hindi))
        saved = repo.savedCards()
        if (yesterdayQ == null) yesterdayQ = recall.yesterdayQuestion(brief, archive, hindi)
        monthly = recall.monthlySet(archive, hindi)
    }
    // Save every change to the day.
    LaunchedEffect(loaded) {
        if (loaded) snapshotFlow { day.snapshot() }.drop(1).collect {
            repo.persist(it, brief)
            // The planning mirror's log: planned vs done minutes. Paused days don't count.
            if (!day.paused) Week.minutesOf(it).let { (planned, done) -> week.logMinutes(planned, done) }
        }
    }
    var tab by rememberSaveable { mutableStateOf(when (ritual) { Ritual.QUIZ_NIGHT -> Tab.POD; Ritual.MONDAY_GOAL -> Tab.PREP; else -> Tab.ADDA }) }
    // With a matched pod, the open rooms are one tap away on the Pod tab.
    var showRooms by rememberSaveable { mutableStateOf(false) }
    // Me's open page lives here so the top bar can show its title and a back arrow.
    var mePage by rememberSaveable { mutableStateOf(MePage.HOME) }
    // Each tab keeps its scroll and inputs while you're elsewhere.
    val tabState = rememberSaveableStateHolder()
    // Chotu's tour runs once, right after onboarding (and again after "Redo the first-run steps").
    var touring by rememberSaveable { mutableStateOf(!staged.toured) }
    var prepSub by rememberSaveable { mutableStateOf(PrepSub.TODAY) }
    var syllabusPaper by rememberSaveable { mutableStateOf<String?>(null) }
    var syllabusFocus by rememberSaveable { mutableStateOf<String?>(null) }
    // Plus tools are gated by the member's plan whatever the admin flag says, so this asks whenever Prep or a tool opens.
    // The tour ends on the Plus pitch, with the server's prices.
    var plusPrice by remember { mutableStateOf<Int?>(null) }
    LaunchedEffect(overlay, tab, touring) {
        if (tab == Tab.PREP || touring || overlay in setOf(Overlay.PREP_TOOL, Overlay.PLUS_INFO, Overlay.MOCK_RESULT, Overlay.CA))
            community.plusStatus()?.let { plusMember = it.plan != null; plusPrice = it.yearlyInr() } ?: run { if (plusMember == null) plusMember = false }
    }
    var tool by rememberSaveable { mutableStateOf(ShelfTool.COMPASS) }
    LaunchedEffect(day.dayClosed) { if (loaded) { closedDays = repo.closedDays(); staged.checkStamps(closedDays, pod.joinedOn) } }
    // One practice set's topic scores, for the season counter, mastery stamps and the app's guesses.
    var session by remember { mutableStateOf(mapOf<String, Pair<Int, Int>>()) }
    val finishPractice = {
        val n = session.values.sumOf { it.second }
        if (n > 0) {
            staged.practiceFinished(session)
            scope.launch { community.seasonAdd(n) }
        }
        session = emptyMap()
    }
    var needToTalk by rememberSaveable { mutableStateOf(false) }
    val openNeedToTalk = { needToTalk = true }

    // Back from any tab goes home to the Adda first (Me's own pages step back to Me before that).
    BackHandler(enabled = overlay == Overlay.NONE && tab != Tab.ADDA) { tab = Tab.ADDA }
    BackHandler(enabled = overlay != Overlay.NONE) {
        overlay = when (overlay) {
            Overlay.SHOULDERS, Overlay.SHELF -> guideBack
            Overlay.LIBRARY -> libraryBack
            Overlay.READER -> Overlay.READS
            Overlay.PREP_TOOL, Overlay.PLUS_INFO -> prepBack
            else -> Overlay.NONE
        }
    }
    val answer = { q: PracticeQuestion, right: Boolean ->
        val (r, t) = session[q.topic] ?: (0 to 0)
        session = session + (q.topic to ((r + if (right) 1 else 0) to (t + 1)))
        q.cardId?.let { recall.record(it, right, q.topic) }
        scope.launch { repo.recordAnswer(q, right) }
        if (right) prep.clearMiss(q.id) else prep.addMiss(PrepQ(q.id, q.topic, MockMcq(q.mcq.question, q.mcq.options, q.mcq.answerIndex, q.mcq.explanation)))
        misses = prep.misses()
        Unit
    }

    // Everything the app keeps on this phone. The server address stays, so the person can sign in again.
    val wipeLocal = {
        ProfileStore.clear(context)
        Metrics.forget()
        roadmap.forget()
        scope.launch { repo.deleteJournal() }
        pod.forget()
        rooms.forget()
        langRequests.clear()
        library.forget()
        mocks.forget(); activeMock = null; mockHistory = emptyList()
        prep.forget(); misses = emptyList()
        recall.forget()
        week.forget()
        staged.forget()
        Focus.forget(context)
        Nudge.set(context, null)
        chotu.newChat()
        profile = ProfileStore.load(context)
    }
    // Access switched off (from /me/status, any 403 account_suspended, or the pod socket closing with 4403).
    Auth.suspended?.let { support ->
        SuspendedScreen(support, onSignInAgain = { Auth.clearSuspended() },
            onDeleteLocal = { wipeLocal(); Auth.clearSuspended() }, onNeedToTalk = { gateTalk = true })
        if (gateTalk) NeedToTalkSheet(onDial, onDismiss = { gateTalk = false })
        return
    }

    Box(Modifier.fillMaxSize()) {
    when (overlay) {
        Overlay.CHAI -> ChaiScreen(
            brief, day,
            preferHindi = hindi,
            onClose = { overlay = Overlay.NONE },
            chotu = chotu,
            library = library,
            onOpenItem = openItem,
            yesterday = yesterdayQ,
            onYesterday = { q, right ->
                q.cardId?.let { recall.answeredYesterday(it, right, q.topic) }
                // A miss on yesterday's card brings it back in 3 days.
                if (!right) scope.launch { repo.recordAnswer(q.copy(isReview = false), false) }
                yesterdayQ = null
            },
            onExamAnswer = { id, right -> recall.record(id, right, brief.items.firstOrNull { it.id == id }?.topic ?: "") },
            onWhy = openWhy,
        )
        Overlay.CARDS -> cardsToRead?.let { b ->
            ChaiScreen(b, day, preferHindi = hindi, onClose = { overlay = Overlay.NONE }, archive = true, chotu = chotu, library = library, onOpenItem = openItem)
        } ?: run { overlay = Overlay.NONE }
        Overlay.PRELIMS -> PrelimsScreen(
            questions,
            onAnswer = answer,
            onFinished = { day.markDone(TaskId.PRELIMS); finishPractice() },
            onClose = { overlay = Overlay.NONE; session = emptyMap() },
        )
        Overlay.REMEMBER -> PrelimsScreen(
            monthly,
            onAnswer = answer,
            onFinished = { recall.finishedMonthly(); finishPractice() },
            onClose = { overlay = Overlay.NONE; if (monthly.isNotEmpty()) monthly = recall.monthlySet(archive, hindi) },
            title = "Remember these?",
        )
        Overlay.MAINS -> MainsScreen(
            mains,
            partTime = persona?.partTime == true,
            hindi = hindi,
            load = { repo.draft(mains.id) },
            save = { text -> scope.launch { repo.saveDraft(mains.id, text) } },
            onDone = { day.markDone(TaskId.MAINS) },
            onClose = { overlay = Overlay.NONE },
        )
        Overlay.ANSWER_STUDIO -> AnswerStudioScreen(
            Practice.studioQuestions(brief, hindi), community, answerLog, rooms, pod, persona, hindi,
            onOpenNeedToTalk = openNeedToTalk,
            onClose = { overlay = Overlay.NONE; arrived = null },
            banner = when (arrived) {
                Ritual.ANSWER_HOUR -> if (hindi) "आंसर आवर: रूम का आज का प्रश्न चुना हुआ है। तैयार हों तो टाइमर शुरू करें।" else "Answer hour: the room's question for today is picked. Start the timer when you're ready."
                Ritual.COMEBACK -> if (hindi) "वापसी मुबारक। बस एक 7 मिनट का उत्तर।" else "Welcome back. Just one 7-minute answer."
                else -> null
            },
            onAnswered = { if (arrived == Ritual.COMEBACK) ritualDone(Ritual.COMEBACK); ritualDone(Ritual.ANSWER_HOUR) },
        )
        Overlay.CLOSE_DAY -> CloseTheDayScreen(
            day, onDial, openNeedToTalk,
            onSave = { entry ->
                if (entry.mood == com.upscpods.app.data.Mood.HEAVY.name) prep.markCare()
                scope.launch { repo.saveJournal(entry) }; Metrics.ritualOnce("close_day"); Metrics.rateAfter("close_day")
            },
            onClose = { overlay = Overlay.NONE },
            onLampOff = if (library.lampOff() != null) ({ overlay = Overlay.LAMP }) else null,
            onWhy = { openWhy(Guide.WHY_CLOSE) },
            quote = { night -> library.quoteFor(if (night) "night" else "if-then") },
            onReadMore = { openShelf(it) },
        )
        Overlay.SHOULDERS -> ShouldersScreen(
            guideAnchor,
            onOpenBook = { openShelf(it) },
            onOpenShelf = { openShelf(null) },
            onClose = { overlay = guideBack },
        )
        Overlay.SHELF -> ShelfScreen(guideAnchor, onClose = { overlay = guideBack })
        Overlay.FOCUS -> FocusScreen(onClose = { overlay = Overlay.NONE })
        Overlay.MOCK -> activeMock?.let { m ->
            PrepSpace {
                MockPaperScreen(m, onChange = { activeMock = it; mocks.save(it) }, onSubmit = submitMock,
                    onLeave = { overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.MOCKS })
            }
        } ?: run { overlay = Overlay.NONE }
        Overlay.MOCK_RESULT -> {
            val rec = mockHistory.lastOrNull()
            val last = remember(mockHistory) { mocks.last() }
            if (rec != null && last != null) PrepSpace {
                MockResultScreen(rec, last, mockHistory, mocks.band(rec), resultWeek = result != null,
                    shareBand = { community.mockBand(rec.id, rec.pct)?.also { mocks.saveBand(rec, it) } },
                    onClose = { overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.MOCKS },
                    onSeePlus = if (plusMember == false && !plusQuiet) openPlusInfo else null)
            } else overlay = Overlay.NONE
        }
        Overlay.TOOL -> Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding()) { ShelfToolScreen(tool, staged, onClose = { overlay = Overlay.NONE }) }
        Overlay.LIBRARY -> library.items.firstOrNull { it.id == libraryItem }?.let { item ->
            LibraryScreen(item, library, hindi, onClose = { if (item.data["play"] != null) prep.markLearnt(item.id); overlay = libraryBack })
        } ?: run { overlay = Overlay.NONE }
        Overlay.LEARN -> LearnHubScreen(library, prep, hindi, plusMember != true, onOpen = openItem, onTool = openTool, onClose = { overlay = Overlay.NONE })
        Overlay.READS -> LongReadsScreen(prep.reads(library), prep, hindi, onOpen = { readId = it; overlay = Overlay.READER }, onClose = { overlay = Overlay.NONE })
        Overlay.READER -> prep.reads(library).firstOrNull { it.first.id == readId }?.let { (item, r) ->
            ReaderScreen(item, r, prep, hindi, onFocus = { mins -> Focus.start(context, mins, "Reading") }, onClose = { overlay = Overlay.READS })
        } ?: run { overlay = Overlay.READS }
        Overlay.PREP_TOOL -> {
            val back = { overlay = prepBack }
            when (prepTool) {
                PrepTool.WEEKLY -> WeeklyTestScreen(weekQs, plusGate, plusQuiet, prepAnswer, onSeePlus = openPlusInfo, onClose = back)
                PrepTool.COMPILE -> CompilationScreen(monthQs, plusGate, plusQuiet, onSeePlus = openPlusInfo, onClose = back)
                PrepTool.REVISE -> ReviseScreen(misses, plusGate, plusQuiet, prepAnswer, onSeePlus = openPlusInfo, onPrelims = { overlay = Overlay.PRELIMS }, onClose = back)
                PrepTool.INSIGHTS -> InsightsScreen(mockHistory, misses, plusGate, plusQuiet, onRevise = { openTool(PrepTool.REVISE) },
                    onMocks = { overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.MOCKS }, onSeePlus = openPlusInfo,
                    onOpenNode = { p, t -> syllabusPaper = p; syllabusFocus = t; overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.SYLLABUS }, onClose = back)
            }
        }
        // Reached from a preview's "See what Plus adds". In quiet times the pilot ask goes quiet; the page stays.
        Overlay.PLUS_INFO -> PlusInfoScreen(
            mocks.papers(library), weekQs, bankQs, misses, mockHistory, prep.pieces(library).size, prep.reads(library).size, plusWays(prep.pieces(library)),
            plusGate, plusQuiet, hindi, prepAnswer, onTool = openTool,
            onMocks = { overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.MOCKS }, onClose = { overlay = prepBack },
        )
        Overlay.CA -> CaPlayerScreen(
            ca, caWeek, caScene, plusGate, plusQuiet, hindi,
            onNode = { p, t -> syllabusPaper = p; syllabusFocus = t; overlay = Overlay.NONE; tab = Tab.PREP; prepSub = PrepSub.SYLLABUS },
            onSeePlus = openPlusInfo,
            onWeekDone = { ritualDone(Ritual.SUNDAY_CA) },
            onClose = { if (arrived == Ritual.SUNDAY_CA) { tab = Tab.PREP; prepSub = PrepSub.TODAY }; overlay = Overlay.NONE; arrived = null },
        )
        Overlay.LAMP -> library.lampOff()?.let { w ->
            LampOff(w, library, hindi && library.items.any { it.kind == "winddown" && it.hindi }, onClose = { overlay = Overlay.NONE })
        } ?: run { overlay = Overlay.NONE }
        Overlay.NONE -> Scaffold(
            topBar = {
                Column {
                val inMePage = tab == Tab.ME && mePage != MePage.HOME
                TopAppBar(
                    title = { Text(if (inMePage) mePage.title else tab.label) },
                    navigationIcon = { if (inMePage) TextButton(onClick = { mePage = MePage.HOME }) { Text("←") } },
                    actions = {
                        // Need to talk is always one tap away, on every tab.
                        TextButton(onClick = { needToTalk = true }) { Text("Need to talk?") }
                    },
                )
                config.banner?.let { a ->
                    AnnouncementBanner(a,
                        onOpenLink = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) },
                        onDismiss = { config.dismiss(a.id) })
                }
                }
            },
            bottomBar = {
                NavigationBar {
                    Tab.entries.forEach { t ->
                        NavigationBarItem(
                            selected = tab == t,
                            onClick = { tab = t },
                            alwaysShowLabel = true,
                            label = { Text(t.label) },
                            // New messages from others, in your rooms and your pod (sell-first plan W3).
                            icon = {
                                val n = if (t == Tab.POD) rooms.unreadTotal + (if (tab != Tab.POD) pod.unread else 0) else 0
                                if (n > 0) BadgedBox(badge = { Badge { Text(if (n > 99) "99+" else n.toString()) } }) { TabIcon(t.glyph, selected = tab == t) }
                                else TabIcon(t.glyph, selected = tab == t)
                            },
                        )
                    }
                }
            },
        ) { padding ->
            val m = Modifier.padding(padding)
            tabState.SaveableStateProvider(tab.name) {
            when (tab) {
                Tab.ADDA -> AddaTab(
                    persona, pod, community, result, brief, day, staged,
                    onOpenPod = { tab = Tab.POD },
                    onOpenChotu = { talk -> if (talk) chotu.mode = "talk"; tab = Tab.MASCOT },
                    onOpenChai = { overlay = Overlay.CHAI },
                    onOpenTask = { overlay = if (it == TaskId.PRELIMS) Overlay.PRELIMS else Overlay.MAINS },
                    onOpenPrep = { tab = Tab.PREP; prepSub = PrepSub.TODAY },
                    onOpenShelf = { tool = it; overlay = Overlay.TOOL },
                    onOpenNeedToTalk = openNeedToTalk,
                    onSwitchOffMine = if (config.resultNow == null && staged.myResultMode) ({ staged.setMyResultMode(false) }) else null,
                    onPodAnswers = { scope.launch { community.syncProfile(staged.synced()) } },
                    modifier = m,
                )
                Tab.POD -> if (showRooms || (pod.podId == null && config.podsOpen)) RoomsScreen(
                    rooms, persona, openNeedToTalk, onOpenSettings = { tab = Tab.ME; mePage = MePage.SETTINGS }, modifier = m, library = library,
                    onBackToPod = if (pod.podId != null) ({ showRooms = false }) else null,
                    resultDay = result,
                ) else PodTab(
                    pod, openNeedToTalk, onOpenSettings = { tab = Tab.ME; mePage = MePage.SETTINGS }, modifier = m, library = library,
                    top = {
                        TextButton(onClick = { showRooms = true }, modifier = Modifier.padding(horizontal = 8.dp)) {
                            Text(if (rooms.unreadTotal > 0) "Open rooms · ${rooms.unreadTotal} new" else "Open rooms")
                        }
                        // The three matching questions, asked together, once, when they help find a pod.
                        ProfileAskCard(staged, "pod", quiet = result != null || day.paused, onSynced = {
                            scope.launch { community.syncProfile(staged.synced()) }
                        })
                        StayOrMoveCard(pod, staged) { stay ->
                            scope.launch { community.choose(stay)?.let { s -> pod.updateSummary(s); s.podId?.let { pod.switchTo(it, persona) } } }
                        }
                    },
                    resultDay = result,
                )
                Tab.MASCOT -> MascotTab(
                    chotu, openNeedToTalk, m,
                    resultQuiet = result?.let { "It's a result week, so I'm staying quiet. Whatever happened, you're more than a roll number. Your pod and Need to talk are here." },
                    onRemember = { staged.addNote(it) },
                    onOpenPod = { tab = Tab.POD },
                    onOpenRoadmap = { tab = Tab.PREP; prepSub = PrepSub.PLAN },
                )
                Tab.PREP -> PrepSpace {
                    Column(m) {
                        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            PrepSub.entries.filter { it != PrepSub.MOCKS }.forEach { sub ->
                                FilterChip(selected = prepSub == sub || (sub == PrepSub.PRACTICE && prepSub == PrepSub.MOCKS), onClick = { prepSub = sub }, label = { Text(sub.label) })
                            }
                        }
                        if (prepSub == PrepSub.TODAY) SyllabusStrip { syllabusPaper = it; prepSub = PrepSub.SYLLABUS }
                        if (prepSub in setOf(PrepSub.PRACTICE, PrepSub.MOCKS)) Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(selected = prepSub == PrepSub.PRACTICE, onClick = { prepSub = PrepSub.PRACTICE }, label = { Text("Practice") })
                            FilterChip(selected = prepSub == PrepSub.MOCKS, onClick = { prepSub = PrepSub.MOCKS }, label = { Text("Mocks") })
                        }
                        // Members without Plus see one line about it on Today's 3 and Practice, never in quiet times.
                        if (prepSub in setOf(PrepSub.TODAY, PrepSub.PRACTICE) && plusMember == false && !plusQuiet) PlusBanner(hindi) { openPlusInfo() }
                        val inner = Modifier.weight(1f)
                        when (prepSub) {
                            PrepSub.SYLLABUS -> SyllabusTab(
                                inner, library, prep, hindi, plusGate, syllabusPaper,
                                onPaper = { syllabusPaper = it; syllabusFocus = null }, onOpenItem = openItem,
                                onOpenRead = { readId = it; overlay = Overlay.READER }, onSeePlus = openPlusInfo, focus = syllabusFocus,
                            )
                            PrepSub.TODAY -> TodayScreen(
                                brief, day, persona,
                                onOpenChai = { overlay = Overlay.CHAI },
                                onOpenCloseDay = { overlay = Overlay.CLOSE_DAY },
                                onOpenTask = { overlay = if (it == TaskId.PRELIMS) Overlay.PRELIMS else Overlay.MAINS },
                                onOpenPod = { tab = Tab.POD },
                                modifier = inner,
                                pod = pod,
                                mainsTopic = mains.topic,
                                onFiveMinutes = { fiveAt = System.currentTimeMillis() },
                                onWhy = { openWhy(Guide.WHY_TODAY) },
                                weekly = {
                                    // The week in scenes (W7), then the earlier weeks on its shelf.
                                    CaWeekCard(ca, plusGate, plusQuiet, hindi) { w, n -> caWeek = w; caScene = n; overlay = Overlay.CA }
                                    // The variety, shown off: today's topic in every format we have for it.
                                    SevenWays(library, prep, hindi, onOpen = openItem, onSeeAll = { overlay = Overlay.LEARN })
                                    // Week one: target year, Mains medium, working, one a day.
                                    ProfileAskCard(staged, "today", quiet = result != null || day.paused)
                                    // Monday: a fresh week (WOOP). Then the week's line, and once a week the mirror.
                                    val w = woop
                                    when {
                                        woopDue && !staged.firstDay -> WoopCard(
                                            quote = library.quoteFor("monday"), hindi = hindi,
                                            canShare = pod.status == PodStatus.ONLINE,
                                            onSave = { entry, share ->
                                                week.saveWoop(entry)
                                                ritualDone(Ritual.MONDAY_GOAL)
                                                if (share) pod.say("My wish for this week: ${entry.wish}")
                                                woop = entry; woopDue = false
                                            },
                                            onSkip = { week.skipWoop(); woopDue = false },
                                            onReadMore = { openShelf(it) },
                                        )
                                        w != null -> WoopLine(w)
                                    }
                                    val mm = mirror
                                    if (!woopDue && mm != null && LocalDate.now().dayOfWeek == DayOfWeek.MONDAY) {
                                        PlanningMirror(mm, day.weeklyTarget,
                                            onSize = { day.weeklyTarget = it; week.answerMirror(); mirror = null },
                                            onLeave = { week.answerMirror(); mirror = null })
                                    }
                                },
                            )
                            PrepSub.PRACTICE -> PracticeTab(
                                day, persona, mains, saved, archive,
                                onOpenPrelims = { overlay = Overlay.PRELIMS },
                                onOpenMains = { overlay = Overlay.MAINS },
                                onOpenStudio = { overlay = Overlay.ANSWER_STUDIO },
                                onOpenCards = { cardsToRead = it; overlay = Overlay.CARDS },
                                modifier = inner,
                                library = library,
                                onOpenItem = openItem,
                                friday = LocalDate.now().dayOfWeek == DayOfWeek.FRIDAY,
                                monthly = monthly.size,
                                onOpenMonthly = { overlay = Overlay.REMEMBER },
                                prepEntries = {
                                    val pieces = prep.pieces(library)
                                    PrepEntries(
                                        pieces = pieces.size, questions = pieces.sumOf { prep.sizeOf(it.first) }, reads = prep.reads(library).size,
                                        plusOn = plusMember != true, showPlusInfo = plusMember != true && !plusQuiet,
                                        onLearn = { overlay = Overlay.LEARN }, onReads = { overlay = Overlay.READS },
                                        onTool = openTool, onPlusInfo = openPlusInfo,
                                    )
                                },
                            )
                            PrepSub.MOCKS -> MockListTab(
                                papers = mocks.papers(library),
                                quick = remember(archive) { mocks.quick(archive, bank) },
                                active = activeMock,
                                history = mockHistory,
                                onStart = startMock,
                                onResume = { overlay = Overlay.MOCK },
                                onOpenResult = { overlay = Overlay.MOCK_RESULT },
                                modifier = inner,
                            )
                            PrepSub.PLAN -> Column(inner.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Text("My Plan", style = MaterialTheme.typography.titleLarge)
                                ProfileAskCard(staged, "plan", quiet = result != null || day.paused)
                                RoadmapSection(roadmap)
                                FlatCard {
                                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text("Your rhythm", style = MaterialTheme.typography.titleMedium)
                                        Rhythm(closedDays, weeks = 4)
                                    }
                                }
                                OutlinedButton(onClick = { overlay = Overlay.FOCUS }) { Text("Focus mode") }
                                mirror?.let { t ->
                                    PlanningMirror(t, day.weeklyTarget,
                                        onSize = { day.weeklyTarget = it; week.answerMirror(); mirror = null },
                                        onLeave = { week.answerMirror(); mirror = null })
                                }
                                KnowThePaper(remember(prepSub) { recall.weakTopics() }, library.quoteFor("know-yourself"), hindi) { openShelf(it) }
                                HonestNumbers()
                                PlanBBothWays()
                                HonestGuideLinks(onOpenShelf = { openShelf(null) }, onOpenShoulders = { openWhy("") })
                            }
                        }
                    }
                }
                Tab.ME -> MeTab(
                    persona, staged, community, langRequests, closedDays,
                    plusOn = config.plus,
                    adminResult = config.resultNow != null,
                    onOpenNeedToTalk = openNeedToTalk,
                    page = mePage,
                    onPage = { mePage = it },
                    onSignOut = if (authOptional) null else ({ pod.stop(); scope.launch { Auth.signOut() }; mePage = MePage.HOME }),
                    chotu = chotu,
                    modifier = m,
                ) { inner ->
                    MyPathTab(
                        day, persona, openNeedToTalk,
                        onRedoOnboarding = { staged.toured = false; touring = true; tab = Tab.ADDA; mePage = MePage.HOME; profile = profile.copy(onboarded = false) },
                        onDeleteData = {
                            // The server's copy goes first (pod membership, messages, consent record, the sign-in account),
                            // then the Firebase user, while the phone still has the member id and the token.
                            scope.launch {
                                if (!community.privacyDelete()) community.syncProfile(emptyMap(), clear = StagedProfile.SYNCED)
                                Auth.deleteFirebaseUser()?.let { android.widget.Toast.makeText(context, it, android.widget.Toast.LENGTH_LONG).show() }
                                wipeLocal()
                            }
                            Unit
                        },
                        onExportJournal = {
                            scope.launch {
                                val text = repo.exportJournal().ifBlank { "No entries yet." }
                                val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
                                context.startActivity(Intent.createChooser(send, "Export my journal"))
                            }
                        },
                        onDeleteJournal = { scope.launch { repo.deleteJournal() } },
                        serverUrl = pod.serverUrl,
                        onServerUrl = { url -> pod.stop(); pod.serverUrl = url; pod.start(persona); scope.launch { config.refresh(); library.refresh(); ca.refresh() } },
                        onOpenFocus = { overlay = Overlay.FOCUS },
                        modifier = inner,
                    )
                }
            }
            }
        }
    }

    // The five-minute pill floats over Today and the three tasks while it runs.
    val start = fiveAt
    if (start != null && (overlay in setOf(Overlay.CHAI, Overlay.PRELIMS, Overlay.MAINS) || (overlay == Overlay.NONE && tab == Tab.PREP && prepSub == PrepSub.TODAY))) {
        FiveMinutePill(
            start,
            onStop = { fiveAt = null; overlay = Overlay.NONE },
            onKeepGoing = { fiveAt = null },
            modifier = Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(bottom = 88.dp),
        )
    }
    StampToast(staged, Modifier.align(Alignment.TopCenter).statusBarsPadding().padding(top = 72.dp))
    // A nudge tapped with the app already open: the same screen a cold open from it gets.
    LaunchedEffect(nudged) {
        val r = nudged ?: return@LaunchedEffect
        arrived = r
        if (r == Ritual.SUNDAY_CA) { caWeek = null; caScene = 0 }
        overlay = when (r) {
            Ritual.CHAI -> Overlay.CHAI
            Ritual.ANSWER_HOUR, Ritual.COMEBACK -> Overlay.ANSWER_STUDIO
            Ritual.SUNDAY_CA -> Overlay.CA
            else -> Overlay.NONE
        }
        tab = when (r) { Ritual.QUIZ_NIGHT -> Tab.POD; Ritual.MONDAY_GOAL -> Tab.PREP; else -> Tab.ADDA }
        onNudged()
    }
    // The ritual's actions: Today's Chai read, every quiz question answered (the others are hooked where they happen).
    LaunchedEffect(TaskId.CHAI in day.done) { if (TaskId.CHAI in day.done) ritualDone(Ritual.CHAI) }
    LaunchedEffect(pod.quiz?.id, pod.quizMine.size) {
        val q = pod.quiz
        if (q != null && q.questions.isNotEmpty() && pod.quizMine.size >= q.questions.size) ritualDone(Ritual.QUIZ_NIGHT)
    }
    // One-tap rating after a key moment; never during a result week.
    if (result == null) RatingSheet(Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(bottom = 88.dp))
    if (touring && overlay == Overlay.NONE && result == null) ChotuTour(
        onStop = { stop -> tab = Tab.valueOf(stop.tab); if (tab == Tab.PREP) prepSub = stop.sub?.let { PrepSub.valueOf(it) } ?: PrepSub.TODAY },
        onFinish = { staged.toured = true; touring = false; tab = Tab.ADDA },
        price = plusPrice,
        hindi = hindi,
        onSeePlus = openPlusInfo,
    )
    }

    reward?.let { r ->
        AlertDialog(
            onDismissRequest = { reward = null },
            title = { Text(r.title(hindi)) },
            text = { ChotuSays(Rituals.rewardLine(r, hindi), ChotuMood.PROUD) },
            confirmButton = { Button(onClick = { reward = null }) { Text(if (hindi) "बढ़िया" else "Nice") } },
        )
    }
    if (mockUsedUp) {
        AlertDialog(
            onDismissRequest = { mockUsedUp = false },
            title = { Text("Your free full paper this month is used") },
            text = { Text("The quick mock is always free, and your allowance comes back next month.") },
            confirmButton = { Button(onClick = { mockUsedUp = false }) { Text("OK") } },
        )
    }
    if (needToTalk) NeedToTalkSheet(onDial, onDismiss = { needToTalk = false })
}
