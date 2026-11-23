# Report K6: Long-video packaging (Topic in Twelve pilots)

Written 20 to 21 Nov 2026. Status: draft, for the owner's check before it goes live.

## Checks run before zipping

A code check ran over every file in this batch: every JSON parses; every text field has `en` and `hi`; ids are unique; every `answerIndex` points at an option; every source is an object with a URL and an opened date; on-screen lines are 42 characters or fewer and no Hindi line ends on a postposition; none of the words or claims the brief bans (section 0 rules 5 and 9, Track K "Never" list). Result: passed. The only hits were lines that say the app has no ranks, streaks or leaderboards, which were kept on purpose.

## What was made, and judgement calls

## What I made
- `youtube.json`: 6 items (Federalism, Monsoon, The Revolt of 1857, each as an English and a Hindi video). Each has a
  title (60 characters or fewer), a description (well under 5,000 characters) with the chapter list, 6 chapters
  with `start: null` and `startsFrom: "chapters.json"`, 12 tags, thumbnail text (4 words or fewer, with digits),
  sources as objects and `factsToCheck`.
- `preview.md`: each video as it will look on YouTube, with character counts.
- Chapters follow the fixed L structure: hook question; the idea as a story or map; 3 to keep; one past Prelims
  question, walked through; the usual mistake; 3 recall questions with a pause before each answer.
  No call-to-follow or next-episode line anywhere.

## Judgement calls
- **No existing scripts found.** `/mnt/project-files/aspiran-batches/v2/` does not exist, and
  `/mnt/project-files/aspiran-shorts/long/` is empty. No folder named l-pilot or topic-in-twelve, and no week 3001 or
  3002 folders. So the chapter titles are mine. If the final chapters.json words them differently, use the video's
  own wording and change en and hi together.
- **Past question not named.** No source file names the past question each pilot uses. Every description says
  "one past Prelims question, walked through", and each item has a factsToCheck entry: name it from chapters.json.
- **The other language field, kept simple.** The Hindi video's Hindi text is written natively. Its `en` fields are the
  English video's text, with one opening line saying the video is in Hindi. The English video's `hi` fields are the
  Hindi video's text, with a line saying the video is in English. Chapter titles are one en/hi pair per topic, shared by
  both videos. Titles differ between the two videos of a topic.
- **Chapter times.** In descriptions, each chapter line starts with `--:--`. The importer replaces it with the time from
  chapters.json, and the first chapter must be 0:00. YouTube makes chapters only when times are filled in.
- **weekId** is a hint: 3001-01 for English, 3002-01 for Hindi, as the L brief says.
- **Tone:** Federalism and Monsoon are NEUTRAL. 1857 is SERIOUS, so it has no emoji, and none of the six items uses one.
- **The usual mistakes chosen:** for Federalism, forgetting the Article 254(2) exception. For Monsoon, thinking the Tamil
  Nadu coast gets its main rain from the south-west monsoon. For 1857, thinking every town rose on the same day. All
  three are backed by the sources. Each must still be matched to the final script; this is flagged in factsToCheck.

## Sources
- Opened today (2026-11-20): Constitution of India, Article 1, "Union of States" (constitutionofindia.net). NCERT
  Class XI, *India: Physical Environment*, ch. 4 (archive.org ncert-kegy1, kegy104). From it: the two branches, the
  Arakan Hills, the westward turn along the Ganga plains, and why the Tamil Nadu coast stays dry.
- Taken from the shorts' sources, with their read dates: 059-union-state-concurrent (Articles 246, 248, 254),
  003-monsoons-journey (IMD 2020 normal dates: 1 June Kerala; 8 July, earlier 15 July) and 029-1857-in-eight-places
  (NCERT Theme 11, S. N. Sen).
- Not used: 053 (cyclones). It falls outside the monsoon video's scope, and one of its sources is Wikipedia. Also not
  used: 041 (accession). Federalism here is about the division of powers.

## Could not verify / to check
- The guided walk m4-walk-federalism is a draft, and all of its facts are marked as not re-checked: Articles 249 to 253,
  the Finance Commission, the 16th Finance Commission's 41%, the GST Council, and the Sarkaria and Punchhi Commissions.
  None of these is in the text. They are listed in factsToCheck.
- The Hindi NCERT title of Theme 11 ("विद्रोही और राज") was not opened today. It is listed in factsToCheck.

## Facts to check (7)

- The past UPSC question walked through in the Federalism video (year, paper and number) (youtube.json): No script or chapters.json for the pilot exists yet, and no source file names the question. The description describes it generically; name it from the video's chapters.json (or script) at import, and only then add the year to the description.
- Chapter start times and final chapter wording (youtube.json): Times come from the video's chapters.json (startsFrom). If the final chapter titles or the usual-mistake point differ from these, use the video's own and update en and hi together.
- Wider points in the guided walk m4-walk-federalism (Articles 249 to 253, Finance Commission, 16th Finance Commission share of 41 per cent, GST Council, Sarkaria and Punchhi Commissions) (youtube.json): The walk lists them all as not re-checked. They are kept out of this description; add any only after checking the primary text.
- The past UPSC question walked through in the Monsoon video (year, paper and number) (youtube.json): No script or chapters.json for the pilot exists yet, and no source file names the question. The description describes it generically; name it from the video's chapters.json (or script) at import, and only then add the year to the description.
- Whether the video's usual-mistake chapter is the Tamil Nadu point or another trap (for example the old 15 July date) (youtube.json): Chapter 5 is written from NCERT's own 'why Tamil Nadu stays dry' passage; swap it if the script uses a different mistake.
- The past UPSC question walked through in the 1857 video (year, paper and number) (youtube.json): No script or chapters.json for the pilot exists yet, and no source file names the question. The description describes it generically; name it from the video's chapters.json (or script) at import, and only then add the year to the description.
- Hindi title of NCERT Theme 11 in the Hindi edition ('विद्रोही और राज') (youtube.json): Taken as the usual Hindi rendering; the Hindi NCERT edition was not opened today. Match its exact wording before upload.
