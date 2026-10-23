package com.upscpods.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.upscpods.app.Brand
import com.upscpods.app.data.LanguageRequests
import com.upscpods.app.data.Auth
import androidx.compose.material3.AlertDialog
import com.upscpods.app.data.Community
import com.upscpods.app.data.Persona
import com.upscpods.app.data.PlusStatus
import com.upscpods.app.data.StagedProfile
import kotlinx.coroutines.launch
import java.time.LocalDate

/** Me's pages. The top bar shows the open page's title and a back arrow (see MainActivity). */
enum class MePage(val title: String) { HOME("Me"), PROFILE("Profile"), STAMPS("Stamp book"), RHYTHM("Rhythm"), PRIVACY("Privacy"), PLUS("Plus"), LANGUAGES("Request your language"), SETTINGS("My Path") }

/**
 * Me: Profile (each field with its source, where it's kept, and Delete), Stamp book, Rhythm (dots, no streaks),
 * Privacy, Plus and the old My Path settings.
 */
@Composable
fun MeTab(
    persona: Persona?,
    staged: StagedProfile,
    community: Community,
    langRequests: LanguageRequests,
    closedDays: List<LocalDate>,
    plusOn: Boolean,
    adminResult: Boolean,
    onOpenNeedToTalk: () -> Unit,
    /** The open page, held by the caller so the top bar can show its title and a back arrow. */
    page: MePage,
    onPage: (MePage) -> Unit,
    chotu: com.upscpods.app.data.Chotu,
    modifier: Modifier = Modifier,
    /** Sign out (null when sign-in isn't in use). Everything on the phone stays. */
    onSignOut: (() -> Unit)? = null,
    settings: @Composable (Modifier) -> Unit,
) {
    BackHandler(enabled = page != MePage.HOME) { onPage(MePage.HOME) }
    if (page == MePage.SETTINGS) {
        settings(modifier)
        return
    }
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        when (page) {
            MePage.HOME -> {
                persona?.name?.takeIf { it.isNotBlank() }?.let { Text("Hi, $it.", style = MaterialTheme.typography.bodyLarge) }
                MeRow("Profile", "What the app knows about you, and where it's kept") { onPage(MePage.PROFILE) }
                MeRow("Stamp book", "${staged.stamps.size} " + (if (staged.stamps.size == 1) "stamp" else "stamps") + ". None are ever lost") { onPage(MePage.STAMPS) }
                MeRow("Rhythm", "The days you closed, as dots. Not a streak") { onPage(MePage.RHYTHM) }
                MeRow("Privacy", "Smarter ${Brand.MASCOT_SHORT}, offline ${Brand.MASCOT_SHORT}, result-day mode, what leaves the phone") { onPage(MePage.PRIVACY) }
                if (plusOn) MeRow("Plus", "Your plan") { onPage(MePage.PLUS) }
                MeRow("Request your language", if (langRequests.asked.isEmpty()) "The app is in English, with Hindi where it's ready. Ask for yours" else "You asked for ${LanguageRequests.REQUESTABLE.filter { it.code in langRequests.asked }.joinToString(", ") { it.name }}") { onPage(MePage.LANGUAGES) }
                MeRow("My Path", "Reminders, pause, focus, journal, delete my data") { onPage(MePage.SETTINGS) }
                if (onSignOut != null) AccountCard(onSignOut, onDeleteAccount = { onPage(MePage.SETTINGS) }, server = community.serverUrl())
                TextButton(onClick = onOpenNeedToTalk) { Text("Need to talk? · किसी से बात करनी है?") }
            }
            MePage.PROFILE -> ProfilePage(staged, community)
            MePage.STAMPS -> StampsPage(staged)
            MePage.RHYTHM -> Rhythm(closedDays, weeks = 8)
            MePage.PRIVACY -> {
                PrivacyPage(staged, adminResult)
                OfflineChotuSettings(chotu)
            }
            MePage.PLUS -> PlusPage(community)
            MePage.LANGUAGES -> RequestLanguageCard(langRequests, community)
            MePage.SETTINGS -> Unit
        }
    }
}

/** Who's signed in, for this person only, Sign out, and the way to delete the account (My Path → Delete my data). */
@Composable
private fun AccountCard(onSignOut: () -> Unit, onDeleteAccount: () -> Unit, server: String) {
    var confirm by remember { mutableStateOf(false) }
    var changing by remember { mutableStateOf(false) }
    val isPassword = Auth.session?.provider == "password"
    FlatCard {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Account", style = MaterialTheme.typography.titleSmall)
            Text(Auth.session?.email?.let { "Signed in as $it" } ?: Auth.session?.label ?: "Signed in", style = MaterialTheme.typography.bodyMedium)
            Text(if (isPassword) "Only you see this. Your pod sees your nickname, never your username." else "Only you see this. Your pod sees your nickname, never your email.", style = MaterialTheme.typography.bodySmall)
            if (isPassword && changing) ChangePasswordForm(server, forced = false) { changing = false }
            Row {
                if (isPassword && !changing) TextButton(onClick = { changing = true }) { Text("Change password") }
                TextButton(onClick = { confirm = true }) { Text("Sign out") }
                TextButton(onClick = onDeleteAccount) { Text("Delete my account") }
            }
        }
    }
    if (confirm) AlertDialog(
        onDismissRequest = { confirm = false },
        title = { Text("Sign out?") },
        text = { Text("Everything saved on this phone stays here. Sign in again to use your pod and ${Brand.MASCOT_SHORT} online.") },
        confirmButton = { TextButton(onClick = { confirm = false; onSignOut() }) { Text("Sign out") } },
        dismissButton = { TextButton(onClick = { confirm = false }) { Text("Stay signed in") } },
    )
}

@Composable
private fun MeRow(title: String, sub: String, onClick: () -> Unit) {
    FlatCard {
        TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.fillMaxWidth()) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Text(sub, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}

private fun sourceLabel(s: String) = when (s) { "asked" -> "You answered"; "inferred" -> "The app's guess"; else -> "You told us" }

@Composable
private fun ProfilePage(staged: StagedProfile, community: Community) {
    val scope = rememberCoroutineScope()
    Text("Everything here stays on this phone, apart from the four pod-matching fields, which also go to the pod server. Delete any of them and it's gone from both.", style = MaterialTheme.typography.bodyMedium)
    if (staged.fields.isEmpty()) Text("Nothing yet. The app asks one small question at a time, when it helps.", style = MaterialTheme.typography.bodySmall)
    staged.fields.forEach { (key, f) ->
        FlatCard {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(StagedProfile.LABEL[key] ?: key, style = MaterialTheme.typography.labelLarge)
                    Text(StagedProfile.labelOf(key, f.value), style = MaterialTheme.typography.bodyLarge)
                    Text(sourceLabel(f.source) + " · " + if (key in StagedProfile.SYNCED) "on this phone and the pod server (for matching)" else "on this phone only",
                        style = MaterialTheme.typography.bodySmall)
                }
                TextButton(onClick = {
                    staged.delete(key)
                    if (key in StagedProfile.SYNCED) scope.launch { community.syncProfile(emptyMap(), clear = listOf(key)) }
                }) { Text("Delete") }
            }
        }
    }
    Text("${Brand.MASCOT_SHORT}'s notes (${staged.notes.size} of ${StagedProfile.MAX_NOTES})", style = MaterialTheme.typography.titleSmall)
    Text("Notes you chose to keep. ${Brand.MASCOT_SHORT} uses them only when Smarter ${Brand.MASCOT_SHORT} is on.", style = MaterialTheme.typography.bodySmall)
    staged.notes.forEach { n ->
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("• $n", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            TextButton(onClick = { staged.removeNote(n) }) { Text("Delete") }
        }
    }
}

@Composable
private fun StampsPage(staged: StagedProfile) {
    Text("Stamps mark things you did. They're never lost, never compared, and nobody else sees them.", style = MaterialTheme.typography.bodyMedium)
    StagedProfile.FAMILIES.forEach { (fam, title) ->
        val mine = staged.stamps.keys.filter { StagedProfile.stampInfo(it)?.family == fam }
        val all = if (fam == "mastery") mine else StagedProfile.STAMPS.filterValues { it.family == fam }.keys.toList()
        Text(title, style = MaterialTheme.typography.titleSmall)
        if (all.isEmpty()) Text("80% or more in a topic, on three different days, earns a mastery stamp.", style = MaterialTheme.typography.bodySmall)
        all.forEach { id ->
            val info = StagedProfile.stampInfo(id) ?: return@forEach
            val on = staged.stamps[id]
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(if (on != null) "◉" else "○", color = if (on != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)
                Column {
                    Text(info.title, style = MaterialTheme.typography.bodyLarge)
                    Text(if (on != null) "${info.why} · $on" else info.why, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

/** Rhythm: which days you closed, week by week. Dots, never a count of days in a row. */
@Composable
fun Rhythm(closedDays: List<LocalDate>, weeks: Int = 4) {
    val closed = closedDays.toSet()
    val today = LocalDate.now()
    val start = StagedProfile.mondayOf(today).minusWeeks((weeks - 1).toLong())
    Row(Modifier.semantics { contentDescription = "Days you closed in the last $weeks weeks" }, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        repeat(weeks) { w ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                repeat(7) { d ->
                    val day = start.plusDays((w * 7 + d).toLong())
                    Box(
                        Modifier.size(14.dp).background(
                            when {
                                day in closed -> MaterialTheme.colorScheme.primary
                                day.isAfter(today) -> MaterialTheme.colorScheme.surface
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            },
                            CircleShape,
                        ),
                    )
                }
            }
        }
    }
    Text("Each column is a week. Gaps are normal; this isn't a streak.", style = MaterialTheme.typography.bodySmall)
}

@Composable
private fun PrivacyPage(staged: StagedProfile, adminResult: Boolean) {
    var smarter by remember { mutableStateOf(staged.smarterChotu) }
    FlatCard {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Smarter ${Brand.MASCOT_SHORT}", style = MaterialTheme.typography.titleSmall)
                    Text("Sends your saved notes with questions to the online ${Brand.MASCOT_SHORT}, so it remembers what you asked it to. Off by default. On-phone ${Brand.MASCOT_SHORT} never sends anything.", style = MaterialTheme.typography.bodySmall)
                }
                Switch(checked = smarter, onCheckedChange = { smarter = it; staged.smarterChotu = it })
            }
        }
    }
    FlatCard {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Result-day mode", style = MaterialTheme.typography.titleSmall)
            Text("For three days: no wins posts, no offers, ${Brand.MASCOT_SHORT} stays quiet, and the Adda is calm. It turns on by itself on UPSC result days.", style = MaterialTheme.typography.bodySmall)
            when {
                adminResult -> Text("It's on now for everyone: it's a result day.", style = MaterialTheme.typography.bodySmall)
                staged.myResultMode -> TextButton(onClick = { staged.setMyResultMode(false) }) { Text("Switch it off") }
                else -> TextButton(onClick = { staged.setMyResultMode(true) }) { Text("Switch it on for 3 days") }
            }
        }
    }
    Text("What leaves this phone", style = MaterialTheme.typography.titleSmall)
    listOf(
        "Your sign-in (phone number or Google email), only to sign you in. Your pod never sees it, and it never goes to ${Brand.MASCOT_SHORT} or any AI service.",
        "Pod messages you send, to your pod.",
        "Four matching fields (stage, attempts, language, study time), to find your pod.",
        "Questions to the online ${Brand.MASCOT_SHORT}, sent to an outside AI service (Google, Groq or NVIDIA) to write the reply. We don't save them, but that service may keep them for a while under its own terms, so leave out anything personal.",
        "An answer you send to Answer Studio (the photo or the text), to the same kind of AI service to mark it. We don't keep the photo.",
        "A reply you report: that reply and your reason. Not the chat.",
        "How many practice questions you answered, added to the season counter with no name.",
    ).forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
    Text("What never leaves", style = MaterialTheme.typography.titleSmall)
    listOf("Close the Day, mood and journal", "Your nickname on the online ${Brand.MASCOT_SHORT}", "Anything that looks like distress: that's checked on the phone first")
        .forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
    Text("Download or delete everything from Me → My Path.", style = MaterialTheme.typography.bodySmall)
}

@Composable
private fun PlusPage(community: Community) {
    var status by remember { mutableStateOf<PlusStatus?>(null) }
    LaunchedEffect(Unit) { status = community.plusStatus() }
    // Google Play's payments policy: no price, no payment wording and no pointer to the website here.
    Text("Plus adds the weekly Chai test, the monthly compilation, revise my misses, mock insights and every mock paper. Everything in the Adda, your pod and the Free Shelf stays free.", style = MaterialTheme.typography.bodyMedium)
    status?.let { Text(if (it.plan != null) "You have Plus on this account." else "This account doesn't have Plus. Prep → What Plus adds shows what's inside.", style = MaterialTheme.typography.bodySmall) }
}

/** A small "New stamp" line, shown once wherever the member is. */
@Composable
fun StampToast(staged: StagedProfile, modifier: Modifier = Modifier) {
    val msg = staged.newStamp ?: return
    LaunchedEffect(msg) { kotlinx.coroutines.delay(3500); staged.newStamp = null }
    Box(modifier.background(MaterialTheme.colorScheme.inverseSurface, MaterialTheme.shapes.medium).padding(horizontal = 16.dp, vertical = 10.dp)) {
        Text(msg, color = MaterialTheme.colorScheme.inverseOnSurface)
    }
}
