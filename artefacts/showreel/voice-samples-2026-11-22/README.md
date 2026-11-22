# Showreel voice samples (22 Nov 2026)

Every sample says the same two lines (the pod line, then the GST vote), in English and Hindi, trimmed and joined
the way the tour will play them.

| File | Voice | Notes |
|---|---|---|
| `1-sumeet-*.mp3` | **Sumeet** (ElevenLabs), confident Indian narrator | **Recommended.** The smoothest of all: no pause over 0.3 s in either language. Steady, grown-up, warm. |
| `2-jeetu-*.mp3` | **Jeetu** (Fish Audio, our older-teacher voice) | Older and calmer. Using him also makes the tour's narrator Jeetu, the in-app coach. |
| `3-chotu-older-*.mp3` | **Chotu** (Fish Audio), slowed down | Fish Audio can only change his speed, not his age, so he still sounds young. Here for comparison. |
| `4-bhargav-retuned-*.mp3` | **Bhargav** (today's voice) with the new lines and calmer settings | Shows how much of the fix comes from the script and settings alone. |
| `0-before-bhargav-pods-en.mp3` | Today's live clip | The "before", with the long pauses. |

## What caused the pauses and the robotic patches
1. **Choppy lines.** The script was written in fragments ("Short. Sharp." "Your pod." "Ever."). The voice stops for
   0.6 to 0.9 seconds after each full stop; 19 clips had pauses like that. Every line is now whole, flowing sentences.
2. **Each clip recorded blind.** Every clip was made with no idea of the line before or after it, so the tone reset at
   each one. Now each clip is given its neighbours (ElevenLabs only), so the tone carries across.
3. **An excitable setting.** "Style" was high (0.35), which makes a voice bouncy and younger. Now 0.15, with more
   stability (0.5 from 0.4).
4. **Dead air between clips.** Silence at clip ends plus a quarter-second wait in the player. Clips are now trimmed
   (0.05 s kept at the start, 0.08 s at the end, no pause inside over 0.35 s) and the player waits 0.12 s.
5. **"Your turn" waits.** The tour waited 2.4 to 2.6 seconds for a tap on the first question and the Governor's
   desk. Now 1.9 seconds.
6. **Numbers and short forms.** All are written out the way a person says them ("G S T", "G S two", "three thousand,
   nine hundred and ninety-nine rupees", "अनुच्छेद दो सौ"); English words in the Hindi lines are written in Devanagari for the voice.
7. **A younger script.** "Boss!", "whoosh!", "Look at them go!" are gone; the lines still sell, in a grown-up voice.

## Please listen for
"Aspiran" in the pod line. The automatic checker hears "Aspirant" with every voice, which is probably the checker
guessing a word it knows. A human ear decides.

After you pick, every line is re-recorded in that voice in English and Hindi, checked, and deployed.
