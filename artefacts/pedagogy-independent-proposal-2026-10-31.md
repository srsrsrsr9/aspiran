# How Aspiran should teach: an independent proposal

31 Oct 2026. Written without reading the session note or the handover, so it is not anchored to the other proposal.
The last section compares the two. Sources: the owner's docs (`docs/upsc-facts-picture.md`, `docs/upsc syllabus.html`,
the Science-Backed flyer), a light look at what the app already has (server, Android and content READMEs, the PYQ and
syllabus-note files, Answer Studio's rubric, the roadmap builder), and published learning research, cited by author
and year. Nothing here has been built or changed.

---

## The five decisions that matter most (one screen)

1. **Make the syllabus map the spine of the whole app.** Every question, Chai card, note, PYQ and answer hangs on a
   syllabus "node" (one line of the official syllabus). Each node shows one of three plain states: *Met* (read once),
   *Can recall* (passed a check a week or more later), *Can use* (wrote an answer or solved mixed PYQs on it). This
   replaces scores and streaks as the way people see progress, and it is honest, because "can recall" is only earned
   after a delay.

2. **Build one daily review queue that brings old material back on a widening schedule.** Not "missed questions
   return in 3 days" but every item, right or wrong, returning at growing gaps (about 1 day, 1 week, 3 weeks, 2 months)
   until it is recalled correctly on separate days. This "spaced retrieval" is the best-supported technique in learning
   research and the one most aspirants skip. Start each study day with it (10 to 20 minutes, works offline).

3. **Teach Mains answer writing from week two, as a loop, not as "write and get marks".** Decode the question in two
   minutes (skeleton only) many times a week; write a full answer by hand two or three times a week; **mark it
   yourself against the rubric before** Answer Studio does; then **rewrite one part**. Pods compare two answers and
   say which is stronger and why. Skeleton drills give many cheap repetitions; the self-marking and the rewrite are
   where the learning happens.

4. **Use current affairs to strengthen the static syllabus, not as a second syllabus.** Every Chai card names its node
   and asks about the underlying concept, not the headline fact. Each node keeps a small private "case file" of 2 to 4
   current examples the aspirant chose to keep, ready for Mains answers. News that ties to no node is not kept.

5. **Give the pod jobs that only people can do, and keep it out of the jobs that solo work does better.** Pods are for
   explaining to each other, comparing answers, admitting mistakes, mock interview boards and keeping each other going.
   They are not for reading together or recalling together (groups recall less than the same people alone). Rule of
   thumb for every pod ritual: **answer alone first, then discuss.**

Two standing rules I would ask the owner to look at again (details in section 9): "no timers" should become "no
timers by default, with pace shown afterwards and timed papers encouraged in the final months", and "Chotu never
responds to results" should allow Chotu to help read a mock result as data (what to fix), while still never
predicting ranks or judging the person.

---

## 1. What the exam actually rewards, and what that means for teaching

From the facts sheet:

- Prelims gives **zero** rank marks but gates everything. Cutoffs move. The job is to clear it with a safe margin,
  not to top it.
- Mains is 1,750 of the 2,025 marks: essay, four GS papers and two optional papers, all handwritten, 3 hours each.
  GS papers ask 20 questions in 3 hours, so roughly **7 to 8 minutes per answer**, including reading and planning.
- The interview is 275 marks (about 14 percent).
- The optional is about a quarter of the final marks and repeats its themes heavily across years.

The exam tests four different skills, and each needs a different kind of practice:

| Skill | Paper | What builds it |
|---|---|---|
| Recall and telling close options apart | Prelims GS | Spaced retrieval, mixed practice, explanations of why wrong options are wrong |
| Speed and accuracy above a pass mark | CSAT | Early diagnosis, then short regular practice on the weak part |
| Structured argument under a word limit | Mains GS, essay, optional | Worked examples, planning drills, writing by hand, feedback, rewriting |
| Judgement and presenting yourself | GS4, interview | Case discussion with others, mock boards, reflection |

Most apps and coaching are built for the first row and treat the rest as "write answers later". The flyer's own
illustrative story says it well: the aspirant who aced the wrong exam. **The app should be built around the third
row, because that is where the marks are**, while keeping the first row efficient.

---

## 2. The learning science this rests on, honestly

I list the findings I trust, how big the effects are, and where the evidence is thin or comes from very different
people (mostly university students in the US and Europe, studying for days or weeks, not adults studying for two
years in a high-stakes exam).

### Strong evidence

- **Retrieval practice (testing yourself instead of re-reading).** Roediger & Karpicke (2006) is the classic study.
  Meta-analyses find medium effects: Rowland (2014) about g = 0.5, Adesope, Trevisan & Sundararajan (2017) about
  g = 0.6. ("g" is a standard size of effect; 0.5 means the average tested learner beats roughly 70 percent of the
  untested group.) Dunlosky et al. (2013) rated practice testing and spaced practice the only two "high utility"
  techniques of ten; highlighting and re-reading came out "low". It also works in real classrooms (McDaniel et al.
  2011; Agarwal, Bain & Chamberlain 2012). Benefits carry over to new questions less strongly than to the same
  questions (Pan & Rickard 2018, about d = 0.4).
- **Spacing.** Cepeda et al. (2006) pooled hundreds of studies. Cepeda et al. (2008) found the best gap between study
  sessions grows with how long you need to remember: roughly 10 to 20 percent of the time until the test. For a
  test a year away, that means gaps of weeks to months, not days. Bahrick et al. (1993) showed spacing still mattered
  over several years. This is directly relevant to a 1 to 2 year journey.
- **Successive relearning** (retrieve until correct, then come back on later days and do it again). Rawson & Dunlosky
  (2011) and Rawson, Dunlosky & Sciartelli (2013) found large gains in real university courses. This is the rule I
  would use for the review queue.
- **Feedback.** Hattie & Timperley (2007) and Wisniewski, Zierer & Hattie (2020, about d = 0.5) show feedback helps on
  average, but Kluger & DeNisi (1996) found **about a third of feedback interventions made performance worse**,
  mostly when the feedback was about the person rather than the task. Feedback must say what to do next, about the
  work, never about the worker.
- **Worked examples** help beginners (Sweller & Cooper 1985) but stop helping, and can hurt, once someone is skilled:
  the "expertise reversal effect" (Kalyuga et al. 2003). Fading the support step by step works well (Renkl &
  Atkinson 2003). So model answers should be heavy early and fade.
- **Writing instruction.** Graham & Perin (2007, *Writing Next*) found teaching explicit planning and revising
  strategies had large effects on writing quality (about 0.8), while simply reading model texts had small ones
  (about 0.25). Good writing is taught by **planning and revising**, not by reading toppers' copies.
- **Implementation intentions** ("after X, I will do Y"): Gollwitzer & Sheeran (2006), about d = 0.65 on reaching
  goals. The app already uses this; keep it.

### Medium or mixed evidence

- **Interleaving** (mixing topics in one practice set). Rohrer & Taylor (2007) is the well-known study. The meta-
  analysis by Brunmair & Richter (2019) found a moderate overall effect (about g = 0.4) but **mostly for maths and
  visual categories**, and weak or even negative effects for word-based material. For UPSC, mixing is still right
  for Prelims mocks (the exam is mixed, so practice should be), but I would not oversell it for learning facts.
- **Pre-questions** (attempting questions before studying a topic). Richland, Kornell & Kao (2009) and Kornell, Hays &
  Bjork (2009) found trying and failing first helps later learning. Effects are real but best for the specific
  material asked. This supports "PYQs first, then read".
- **Self-explanation** (asking yourself why each step holds). Chi et al. (1994); meta-analysis by Bisra et al. (2018),
  about g = 0.55. Good for studying model answers.
- **Peer assessment.** Topping (1998); meta-analysis by Double, McLane & McCormick (2020), about g = 0.3. Learning to
  judge quality is itself a skill (Sadler 1989 called it the student's "concept of quality"; Tai et al. 2018 call it
  "evaluative judgement"). Comparing two pieces side by side is more reliable than marking one alone
  (Pollitt 2012, on comparative judgement).
- **Learning by explaining to others.** Expecting to teach and then teaching both help (Nestojko et al. 2014; Fiorella
  & Mayer 2013). Peer discussion after answering alone improves understanding (Crouch & Mazur 2001; Smith et al. 2009).
- **Confidence and the "hypercorrection" effect.** Mistakes made with high confidence are more likely to be fixed once
  corrected (Butterfield & Metcalfe 2001). Multiple-choice tests can also plant wrong answers unless feedback follows
  (Roediger & Marsh 2005). So: ask confidence, always explain, and make confident mistakes stand out.
- **Automated writing feedback.** Reviews find modest gains in the text being revised and weak evidence that skill
  carries to new writing (Stevenson & Phakiti 2014). AI feedback is a helper, not a teacher. Large language models'
  marking is not yet shown to be reliable against UPSC examiners; nobody has that data.

### Weak or negative evidence (things to avoid)

- **Learning styles** (visual or auditory learners): no good evidence (Pashler et al. 2008).
- **Leaderboards and badges**: a classroom study found they lowered motivation and exam scores (Hanus & Fox 2015).
  Rewarding people for something they would do anyway can reduce their own drive (Deci, Koestner & Ryan 1999).
- **Decorative extras** that are interesting but off-topic ("seductive details") tend to hurt learning (Rey 2012).
  Relevant to the playful card kinds: they help only if they make the person recall something.
- **Mindset messages** have very small average effects (Sisk et al. 2018); do not build features on them.
- **Groups recalling together** remember less than the same people recalling alone and pooling
  ("collaborative inhibition", Weldon & Bellinger 1997; Rajaram & Pereira-Pasarin 2010).

### Wellbeing and sustainable effort

- Ericsson, Krampe & Tesch-Römer (1993) found even elite performers sustain only about **4 hours a day of truly
  focused practice**. The "14 hours a day" culture is not supported; quality hours matter more.
- Sleep consolidates memory (Diekelmann & Born 2010).
- Writing about worries for 10 minutes before an exam improved scores in anxious students (Ramirez & Beilock 2011).
  Retrieval-practised memories hold up better under stress (Smith, Floerke & Thomas 2016): practising recall is also
  an anxiety protection.
- Motivation lasts when people feel competent, in control and connected (Ryan & Deci 2000). A pod covers connection;
  the node map covers competence; letting people set their own plan covers control.

### Gaps I want to name

- Almost no rigorous studies exist on UPSC aspirants, on adults over multi-year attempts, or on Hindi-medium adult
  learners. Everything above is borrowed.
- Learning in your first language helps comprehension at school level (summarised in UNESCO's 2016 policy paper
  "If you don't understand, how can you learn?"), but adult evidence is thin.
- Learning on phones in short bursts ("micro-learning") has enthusiasm but weak evidence. It suits review, not
  first learning of hard material.

---

## 3. The model: three loops

I propose the app runs three loops at different speeds. Everything else is in service of these.

### Loop A, daily: *Recall, Learn, Use* (2 to 8 hours, the person mostly alone)

1. **Recall first (10 to 20 minutes, phone, offline).** Today's review queue: a mix of old items due today from any
   subject. Free recall where possible ("say it from memory"), MCQ where the exam is MCQ. A confidence tick on each.
   The queue is capped (for example 40 items) and overflow rolls to tomorrow quietly; nothing "breaks".
2. **Learn (the main block, laptop or book).** One node at a time:
   - See what UPSC asked on this node (2 to 5 PYQs, attempt them cold, it is fine to get them wrong).
   - Read the source (NCERT, standard book, the app's syllabus note).
   - Close the book. Write a one-page "from memory" summary, then check and fix it.
   - The node becomes *Met*. Its key points enter the review queue automatically.
3. **Use (20 to 40 minutes).** One output on today's node: either a 2-minute skeleton for 3 PYQs, a full answer, or a
   mixed MCQ set. Never a day with only input.
4. **Chai (10 minutes).** Today's cards, each tied to a node, each ending with one concept question.
5. **Close the Day (2 minutes).** One thing I can say from memory, tomorrow's first step. Already built; keep it.

### Loop B, weekly: *Plan, Practise with others, Fix* (pod plus person)

- **Monday:** pick this week's nodes (the plan builder proposes, the person decides). WOOP and if-then plan (built).
- **Twice a week, Answer hour (pod):** everyone writes the same PYQ alone by hand, uploads, marks their own against the
  rubric, then the pod sees answers in pairs and says which is stronger and why. Then each person rewrites one part.
- **Friday, mixed check (individual first, then pod):** 15 to 20 mixed questions across the month's nodes, not just
  this week's news. Each person answers alone; then the pod sees which questions split the group and talks those
  through. The shared pod tally stays private to the pod and is never ranked against other pods.
- **Sunday, Fix:** the error log groups the week's mistakes by type (see section 6) and suggests one fix for next
  week. The person accepts, edits or skips it.

### Loop C, monthly: *Consolidate and recalibrate* (person, with a light app check)

- One half-day of **cumulative mixed testing** over everything Met so far. This is what turns *Met* into
  *Can recall*.
- **Compress:** for each node finished this month, a one-page personal note written from memory, then fixed.
  These one-pagers become the revision material for the final months.
- **Refresh case files:** keep the 2 to 4 best current examples per node; drop the rest.
- **Calibration check:** "Last month you marked 120 answers as sure; 104 were right." (Private.)
- **Plan check:** is the plan still realistic for the time to the exam? The plan builder re-sizes it.

---

## 4. The 1 to 2 year journey

The syllabus should be covered in **three passes** that get faster and more exam-like (a "spiral", Bruner 1960), not
one slow perfect pass followed by panic revision.

Timeline relative to Prelims day (P). Mains is about 3.5 months after P; interviews come months after Mains.

| Phase | When | Main aim | Daily shape |
|---|---|---|---|
| **0. Orientation** | 2 to 4 weeks | See the exam's shape; diagnose | Solve one full Prelims and one CSAT PYQ paper cold; read 2 years of Mains questions; try 3 Mains answers; explore the optional with PYQs, not with "what is popular" |
| **1. First pass (build)** | P minus 12 to P minus 5 months | Every GS node *Met*, optional half done | Loop A daily. Answer writing 2 to 3 times a week from week 2. CSAT 30 minutes, 3 times a week if the diagnostic was below 50 percent |
| **2. Second pass (integrate)** | P minus 5 to P minus 2 months | Nodes to *Can recall*; Mains-Prelims overlap | Faster re-study from one-pagers, mixed PYQs, sectional Prelims tests, 2 answers a week continue |
| **3. Prelims focus** | last 8 to 10 weeks | Clear with a margin | Full mocks (1 to 2 a week), error log, confidence and elimination work, current affairs consolidation. Answer writing paused to one skeleton a day |
| **4. Mains sprint** | P to Mains (about 15 weeks) | Write, write, write | Daily timed answers (by hand), weekly full papers, essay every week, GS4 case studies, optional answers. Pod Answer hour daily if the pod agrees |
| **5. Interview** | after Mains result | Know yourself and your DAF | DAF question bank (the DAF is the detailed form UPSC interviews from), pod mock boards, daily news discussion out loud |

Notes:
- **For a one-year starter**, compress phases 1 and 2 and accept a thinner optional before Prelims.
- **For repeaters**, start with phase 0 using their own last marksheet and answer copies: find the paper that cost the
  most marks and weight the plan to it. Do not restart from NCERTs.
- **For working aspirants**, use the same loops with fewer nodes per week; the plan builder should never quietly
  assume 8 hours a day.
- After Prelims result day, the app should offer a calm two-way path (cleared: Mains sprint; not cleared: rest week,
  then repeater phase 0 or Plan B). The Plan B screen already exists.

---

## 5. Who does what: app, pod, person

| The app does | The pod does | The person does alone |
|---|---|---|
| Keeps the syllabus map and each node's state | Explains to each other ("teach it back") | Reads sources, slowly |
| Schedules the review queue | Compares answers in pairs and says why | Writes answers by hand |
| Shows PYQs per node before study | Shares mistakes ("my best mistake this week") | Writes one-pagers from memory |
| Gives MCQ explanations, including why wrong options are wrong | Runs mock interview boards later | Self-marks before seeing AI feedback |
| Gives rubric feedback on answers (AI, labelled) | Keeps each other going; notices someone quiet | Decides the weekly plan |
| Ties each Chai card to a node | Discusses split questions after Friday's check | Chooses what goes in each case file |
| Shows progress as map states, never as rank | Agrees its own Answer hour times | Rests |

Pod rules that come from the research:
- **Alone first, then together** for every recall or answering activity.
- **Compare, don't grade.** Peers pick the stronger of two answers and give one reason; they don't give marks.
  Comparison is more reliable and less hurtful.
- Pod members are human. AI pod friends (if kept) should never enter answer comparisons as if they were peers.

---

## 6. How each part is learned

### Mains answer writing (the biggest single area)

The 4 stages, each with a screen:

1. **Decode** (screen: "Skeleton drill"). A PYQ appears. In 2 minutes the person writes: the directive word and what
   it demands, a one-line introduction, 4 to 6 dimension headings, a one-line conclusion. Then sees an editor's
   skeleton and marks what they missed. Cheap, fast, many reps (10 a week is easy). This trains planning, which
   *Writing Next* found to be the biggest lever.
2. **Study a worked answer** (screen: "Take apart"). A strong answer with 3 to 4 prompts to explain to yourself:
   "why does this heading come first?", "what does this example prove?". Used heavily in months 1 to 3, then
   faded: later the person sees only a partial skeleton, then nothing.
3. **Write** (screen: Answer Studio, already built). By hand on paper, because the exam is handwritten and handwriting
   speed is a real limit. Photograph and upload. Opt-in count-up clock.
4. **Mark, then rewrite** (screen: Answer Studio result, changed):
   - First the person rates their own answer on the five rubric areas (directive, structure, content, examples,
     conclusion: already Answer Studio's rubric).
   - Then the AI bands appear next to the person's own, so the gap between the two is what they look at.
     Over months, that gap shrinking is the real skill: judging your own work.
   - Then **one rewrite**: the person rewrites only the weakest part (usually the introduction or one body section)
     in 5 minutes. Feedback without action is mostly wasted.
   - "Then and now": after 2 months on a node, the first and latest answers sit side by side.

Volume target (suggestion, editable): first pass about 3 full answers and 10 skeletons a week; Mains sprint about
10 to 15 full answers a week. Quality of feedback and rewrite matters more than count.

**Essay:** practise outlines more than full essays (one full essay a fortnight, two outlines a week). Outline screen:
brainstorm dimensions (social, political, economic, ethical, historical, global), pick a thesis, order 6 to 8
paragraphs, choose an opening and closing. Pods compare outlines, which takes 5 minutes instead of 30.

**GS4 ethics:** case studies are learned by discussion. Pod "case circle": everyone writes options and stakeholders
alone in 10 minutes, then compares. Thinkers and terms go into the review queue like any fact. The existing ethics
dilemma engine (no right answer) fits here.

### Prelims GS

- PYQs per node first; then source; then MCQs with **explanations for every option**.
- Confidence tick on every question (the mock already has "Not sure"; extend it to all practice). Review shows
  **confident mistakes first** (hypercorrection).
- Error types, chosen by the person in one tap after a wrong answer: *didn't know*, *knew but confused two things*,
  *misread the statement*, *eliminated wrongly*, *guessed*. The Sunday Fix uses these. (Knowing it's "misreading"
  rather than "not studying enough" changes what you do next week.)
- Guessing: the mock already shows whether guesses beat break-even under negative marking. Teach this explicitly
  once, with the person's own data, rather than generic advice.
- Full mocks in phase 3, not earlier than sectional tests; full mocks earlier mostly measure, they don't teach.

### CSAT

- A **diagnostic in week one**. CSAT is qualifying, but failing it ends the year, and comprehension can be harder for
  Hindi-medium aspirants (the English-to-Hindi translations of passages are known to be awkward). Those above about
  60 percent need only monthly check-ins; those below get a short regular practice block.
- Comprehension passages with "which line supports this answer?" prompts. Numeracy as short daily sets with worked
  solutions.

### Current affairs tied to the static syllabus

Each Chai card carries (and mostly already does, through chips and takeaways):
- **Its node(s)**, shown as a small tag ("GS3 · Inflation").
- **The concept question**, not the headline question. Not "who chaired the panel?" but "what does this change mean
  for how the RBI targets inflation?". The news is the hook; the concept is what is tested (the facts sheet: "static
  meets current").
- A **"Keep for Mains"** button that saves one line into that node's case file ("Example: [event], shows [point]").
- The node's review items absorb the card's question, so it returns on the same spaced schedule as static material.

Monthly: the case file asks the person to keep at most 4 examples per node. Old examples stay valid for years;
not everything needs to be fresh. This turns 365 days of news into roughly 200 to 400 usable examples instead of a
pile of monthly magazines.

What the app should not do: a separate, endless current-affairs feed. Chai stays bounded (it already "ends").

### Optional

Optional repeats heavily, so: PYQ-first per optional node from day one, answers from month two, a full optional
paper every month in phase 2. The app likely cannot write content for 40-plus optionals; the right move is to give
the **same tools** (node map, review queue, Answer Studio, skeletons) and let the person or pod bring material.
Pods built around the same optional are worth matching for.

### Interview

From the Mains result onward: a DAF screen where the person lists their hometown, education, job and hobbies, and the
app builds a question bank around each (editors' templates, not AI guesses about the person). Pod mock boards: three
members ask, one answers, 20 minutes, then each asker gives one strength and one thing to work on. Recording is
optional and stays on the phone.

### Hindi medium and low-end phones

- **Every node has an English-Hindi term list** (for example "राजकोषीय घाटा / fiscal deficit"). Hindi aspirants
  meet English sources and need both; English aspirants writing in Hindi need the reverse.
- Answer Studio must be tested on Hindi handwriting before it is offered for Hindi answers. If the model reads
  Devanagari badly, say so on screen rather than giving poor feedback.
- The review queue, Chai, notes and PYQs must work offline and download small. Pictures and sound are already skipped
  in data saver. Answer upload can wait for Wi-Fi.

---

## 7. Progress without scores or streaks

The aim: people should be able to see they are getting better, against their own past, never against each other
(comparing a person with their own past is sometimes called "ipsative" assessment).

| What is shown | Where | Why |
|---|---|---|
| **The syllabus map**: each node *Not started*, *Met*, *Can recall*, *Can use*, by colour and word, no percentages | My Path, main screen | Competence you can see; "can recall" needs a delayed check, so it can't be faked by re-reading |
| **"Then and now" answers**: first and latest answer on the same kind of question | Answer Studio | The most motivating evidence of writing growth |
| **Self-marking gap**: how close your self-marks are to the rubric over time | Answer Studio, monthly | Shows the skill of judging your own work |
| **Mistake types shrinking**: "misread the statement: 9 in September, 3 in October" | Sunday Fix | Shows which habits changed |
| **Calibration**: "When you were sure, you were right 87 times in 100" | Practice, monthly | Teaches you when to trust yourself, crucial with negative marking |
| **Prelims mock range** (private) next to a cutoff band | Mocks (already built as a range) | People need to know if they are safe; hiding it would hurt decisions |
| **Case file count per node** | Node page | Shows readiness for Mains examples |

Never shown: hours studied as a target or comparison, days in a row, ranks, percentiles against others, any number
in the pod, predicted rank or selection chance.

---

## 8. What the app should deliberately not do

- No leaderboards, rank, streaks, badges for volume, or "toppers studied 14 hours" content.
- **Chotu should not write answers before the person tries.** It can give a skeleton after an attempt. Generating
  your own answer first is what builds memory (Slamecka & Graf 1978; Bertsch et al. 2007).
- No endless news feed or monthly 300-page compilations. Bounded and node-tied only.
- No "learning style" options.
- No full mocks every week in the first year; they measure more than they teach.
- No AI-made study material shown as checked (already a rule; keep it).
- No predicted rank or "you will clear" messages.
- No playful card kinds without a recall step in them; decoration alone does not teach.
- No group reading or group recall before individual effort.
- No notifications that chase; the one-nudge rule is right.

---

## 9. Standing rules that may work against learning (the owner decides)

| Rule | My view | Suggested change |
|---|---|---|
| **No timers** | Good default for anxiety. But Mains is about 7 to 8 minutes per answer, and pacing is a trainable skill that the exam punishes hard. Never practising under time costs marks. | Keep timers off by default. Show pace **after** an answer or paper ("you took 11 minutes; the exam allows about 8"). In phases 3 and 4, suggest timed papers, opt-in. The count-up mock timer is already a good compromise. |
| **No public scores** | Agree fully. | Make explicit that **private** scores and ranges stay. Prelims calibration needs them. |
| **Chotu never responds to ranks or results** | Right for ranks and for feelings. But reading a mock result for "what should I fix?" is a core study conversation, and banning it sends people to coaching forums. | Allow Chotu to discuss a result as data (topics, mistake types, next steps). Still never predict a rank, never comment on worth, never respond to how the person feels about it (send to the crisis path or a human as now). |
| **Every piece ends** | Agree; bounded sessions are healthy. | The review queue should end each day too, but quietly roll over what is left rather than dropping it. |
| **Content is a draft until English and Hindi editors approve** | Right for accuracy. But spaced retrieval needs thousands of items, and editor time will be the bottleneck. | Let people make **their own private cards** (no approval, never shared). Keep everything shared or AI-made behind approval. |
| **Tasks show minutes, not output** (Today's 3) | Good for starting. But learning is measured by outputs. | Keep minutes to start; at Close the Day ask what was produced (a one-pager, an answer, a review). |
| **Sound off, reduced motion, tragic-tone rules, quiet hours** | No conflict with learning. | Keep. |

---

## 10. Features ranked by impact and effort

Effort is my rough guess from what already exists (PYQ files carry node tags; syllabus notes carry nodes; Recall
already brings items back; Answer Studio has a rubric; mocks have a "Not sure" tick; the roadmap builder has a
syllabus map).

| # | Feature (screen) | Impact | Effort | Notes |
|---|---|---|---|---|
| 1 | **Answer Studio: self-mark first, then AI bands side by side, then one rewrite** | High | Low | Changes to an existing screen |
| 2 | **Skeleton drill** (2-minute decode of a PYQ, compare with editor's skeleton) | High | Low | Needs skeletons per PYQ; editors or AI drafts checked by editors |
| 3 | **Confidence tick on all practice; confident mistakes reviewed first** | Medium-high | Low | Extends the mock's "Not sure" |
| 4 | **Mistake type tap + Sunday Fix suggestion** | High | Low-medium | Sunday review already exists in My Routine |
| 5 | **Unified review queue with widening gaps and relearning** | Very high | Medium | Replace the fixed 3-day and 25-40-day rules with one scheduler (Lindsey et al. 2014 showed a personalised scheduler beat fixed ones in a real course) |
| 6 | **Syllabus map with Met / Can recall / Can use** | Very high | Medium | Needs all GS nodes mapped (Polity is detailed; others are whole-subject) |
| 7 | **PYQs first on each node page** | High | Low-medium | PYQ file already tagged by node; needs more years and Prelims papers |
| 8 | **Chai: node tag, concept question, "Keep for Mains" into a case file** | High | Medium | Chips exist; case file is new |
| 9 | **Pod Answer hour with pair comparison** | High | Medium | Needs moderation and a simple "which is stronger, one reason" screen |
| 10 | **Friday mixed check: alone first, then split questions discussed** | Medium | Low | Change to Quiz Night |
| 11 | **CSAT diagnostic in onboarding week** | Medium-high | Low | One paper; routes the plan |
| 12 | **Phase-aware plan** (three passes, time to exam, repeater start) | Medium-high | Medium | Roadmap builder exists |
| 13 | **"From memory" one-pager per node** | Medium | Low | Long reads already ask "say it from memory" |
| 14 | **English-Hindi term list per node** | Medium | Medium | Editor work |
| 15 | **Essay outline and GS4 case circle screens** | Medium | Low-medium | |
| 16 | **Private personal cards** | Medium | Low | |
| 17 | **Interview: DAF question bank and pod mock board** | Medium (only for a few) | Medium | Build after the Mains loop works |

Suggested order: 1 to 4 first (cheap, fast), then 5 and 6 together (the spine), then 7, 8, 11, then pods (9, 10).

---

## 11. How to know if it is working

Without scores in public, the team still needs evidence:
- Do people who use the review queue do better on delayed checks than those who don't? (Compare within the app, opt-in.)
- Does the self-marking gap shrink over 3 months?
- Do rewritten answers band higher than first drafts, and do *later new* answers band higher (transfer)?
- Do Prelims mock ranges rise across phases?
- Long term: an opt-in "how did your attempt go" survey after each result, with consent, to learn which loops
  actually helped. Without this, all of the above stays borrowed evidence.
- And a wellbeing check: does the share of Heavy days fall or rise after a feature ships?

---

## 12. Comparing with the session note's "Proposed syllabus spine"

*Written after the sections above were finished.* The note's bullet proposes six parts: backward design with the
spine weighted by marks; PYQ-first per node; private revisit dates; a mixed Today's 3; an error log from mocks; and
dissecting a strong answer before writing in Answer Studio.

**Where we agree.** The two proposals arrived at the same core independently: a syllabus spine of nodes, PYQs before
reading, spaced revisits shown privately with no streaks, an error log, and worked examples before writing. That
agreement is some reassurance that these are the right foundations.

**Where I disagree or would adjust.**
- **Weighting by marks.** Right for Mains-heavy planning, but Prelims gives zero marks and still gates everything, and
  CSAT is qualifying. A pure marks weighting would underweight both. Weight by marks *and* by risk of failing a gate,
  and weight within a paper by PYQ frequency, not just paper marks.
- **Mixed Today's 3 as the interleaving step.** Mixing the *day's tasks* is not what the interleaving research tested;
  it mixed *practice questions* within one session, and the benefit is clearest for maths-like material (Brunmair &
  Richter 2019). Switching subjects through a day can also cost focus. I would put the mixing in the review queue
  and the Friday check, and keep the main learning block on one node.
- **"Revisit dates".** A date alone invites re-reading, which is weak. The revisit should be a *recall* (answer
  first, then look), repeated until correct on separate days (successive relearning).
- **Dissecting a strong answer.** Good for beginners, but research says it stops helping as skill grows (expertise
  reversal) and that planning and revising matter more than reading models (Graham & Perin 2007). Fade it over the
  first months, and add self-marking and one rewrite after feedback.
- **Error log "from mocks".** Mocks come late. The log should start from the first day's practice, with mistake types
  the person taps, so the Sunday Fix works from month one.

**What the spine misses.**
- The **three node states** (Met, Can recall, Can use) as the way progress is shown without scores.
- **Current affairs tied to nodes** with a per-node case file for Mains examples.
- **The pod's role** in learning: alone first, then together; pair comparison of answers; teach-back; mock boards.
- **Skeleton drills** for high-volume, low-cost answer practice.
- **Confidence ticks and calibration**, which matter a lot under negative marking.
- **A CSAT diagnostic** in the first week.
- **Phases across the year** (three passes, a Prelims focus, a Mains sprint, interview) and different starts for
  repeaters and working aspirants.
- **Hindi-medium specifics** (term lists, checking Answer Studio on Devanagari handwriting).
- The **rule tensions** in section 9 (timers, Chotu and results, private cards).
- **A way to check it works** (section 11).
