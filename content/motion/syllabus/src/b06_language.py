from dsl import *
LA, EN = ["mains-lang"], ["mains-english"]
SRC = ["UPSC CSE notice: Mains qualifying papers (Paper A, Indian language; Paper B, English)"]

E(50, "lang-comprehension", "lang-1", LA, "The language paper is qualifying, but it can sink you", "Paper A: comprehension", "book", SRC,
  "A: The Indian language paper doesn't count in your rank. | B: But fail it, and your other Mains papers aren't marked.",
  [ST("The paper", [(300, "", "marks", "300"), (25, "%", "needed to qualify", "25")],
      "A: It carries 300 marks. | B: You need 25 percent to qualify."),
   CH("Comprehension", "How to read", [("Read the questions first", "Then the passage", "questions"), ("Answer in your own words", "Don't copy whole lines", "own")],
      "A: Read the questions before the passage. | B: Then answer in your own words, not by copying whole lines."),
   QT("Who's exempt", "Some candidates, including those from certain north-eastern states and Sikkim, are exempt.",
      "A: Some candidates are exempt, | B: including those from certain north-eastern states and Sikkim. Check the notice.")],
  QZ("To qualify in the language paper you need:", ["10%", "25%", "33%", "40%"], 1,
     "Right. 25%.", "A: Your turn. | B: What do you need to qualify?"))

E(51, "lang-precis", "lang-2", LA, "A précis keeps the meaning in a third of the words", "Paper A: précis writing", "pen", SRC,
  "A: A précis is a shorter version of a passage. | B: Usually about a third of its length.",
  [CH("The steps", "Writing a précis", [("Read twice", "Find the central idea", "twice"), ("Cut examples and repetition", "Keep the argument", "Cut"), ("Write in your own words", "Count the words", "own")],
      "A: Read it twice, and find the central idea. Cut the examples and repetition. | B: Then write it in your own words, and count."),
   ST("Length", [(33, "%", "of the original length", "third")],
      "A: Aim for about one-third of the original. | B: The paper usually states the exact limit."),
   QT("Don't add", "No opinions, no new facts. Only what the author said.",
      "A: Never add your own opinion. | B: A précis only says what the author said, shorter.")],
  QZ("A précis should usually be about:", ["Half the original", "One-third of the original", "The same length", "Twice as long"], 1,
     "Right. About a third.", "A: Your turn. | B: How long should a précis be?"))

E(52, "lang-usage", "lang-3", LA, "Usage questions reward daily reading", "Paper A: usage and vocabulary", "book", SRC,
  "A: Usage and vocabulary questions test what you read every day. | B: Idioms, synonyms, and correct forms.",
  [CH("What comes up", "Typical tasks", [("Idioms and proverbs", "Use them in sentences", "Idioms"), ("Synonyms and antonyms", "", "Synonyms"), ("Correcting sentences", "Grammar and word order", "Correcting")],
      "A: Idioms and proverbs, synonyms and antonyms, | B: and correcting sentences."),
   QT("A daily habit", "Read one editorial in your language every day.",
      "A: The best preparation is simple. | B: Read one editorial in your chosen language, every day."),
   CH("Practise", "Two weeks before", [("Solve two past papers", "Under time", "past")],
      "A: Two weeks before Mains, | B: solve two past papers, against the clock.")],
  QZ("What's the most useful daily habit for the usage section?", ["Memorising a dictionary", "Reading every day", "Skipping it", "Learning grammar rules only"], 1,
     "Right. Regular reading builds usage naturally.", "A: Your turn. | B: What's the best daily habit?"),
  note="Method piece.")

E(53, "lang-short-essay", "lang-4", LA, "Keep the language-paper essay simple", "Paper A: the short essay", "pen", SRC,
  "A: The language paper has a short essay. | B: Here, clear beats clever.",
  [CH("A simple plan", "Three parts", [("Intro", "What the topic means", "Intro"), ("Two or three points", "One paragraph each", "points"), ("Close", "One line", "Close")],
      "A: Say what the topic means. Make two or three points, one paragraph each. | B: Close in a line."),
   QT("Use words you're sure of", "A small, correct vocabulary beats a large, shaky one.",
      "A: Use words you're sure of. | B: A small, correct vocabulary beats a big, shaky one."),
   CH("Check", "Last two minutes", [("Spelling and word count", "", "Spelling")],
      "A: Save two minutes at the end | B: to check spelling and the word count.")],
  QZ("In the language-paper essay, the safest approach is:", ["Fancy words", "Clear, simple, correct writing", "Very long sentences", "Bullet points only"], 1,
     "Right. Clear and correct is what qualifies.", "A: Your turn. | B: What's the safest approach?"),
  note="Method piece.")

E(54, "translate-into", "lang-5", LA, "Translate the meaning, not the words", "Translation: English into your language", "book", SRC,
  "A: Word-for-word translation sounds strange. | B: Translate the meaning instead.",
  [CH("How", "Three steps", [("Read the whole sentence", "Get its meaning", "whole"), ("Write it as a native speaker would", "Natural word order", "native"), ("Check nothing is lost", "Numbers, names, negatives", "lost")],
      "A: Read the whole sentence first. Write it the way a native speaker would. | B: Then check nothing is lost: numbers, names, and negatives."),
   QT("Idioms", "Find the matching idiom, or say it plainly.",
      "A: If there's an idiom, find a matching one. | B: If there isn't, just say the meaning plainly."),
   CH("Practise with", "Free material", [("Government press releases", "Many come in both languages", "press")],
      "A: Government press releases often come in two languages. | B: Compare them to practise.")],
  QZ("The best translation is:", ["Word for word", "True to meaning, natural", "Shorter than the original", "In formal English"], 1,
     "Right. Meaning first, in natural language.", "A: Your turn. | B: What's the best translation?"),
  note="Method piece. 'Many PIB releases are bilingual' is general; check before approval.")

E(55, "translate-from", "lang-6", LA, "Translating into English: short sentences win", "Translation: your language into English", "book", SRC,
  "A: Now the other direction: from your language into English. | B: Long sentences are the trap.",
  [CH("Tips", "Into English", [("Split long sentences", "Indian languages often chain clauses", "Split"), ("Keep tenses steady", "One time frame", "tenses"), ("Plain words", "Not literal idioms", "Plain")],
      "A: Split long sentences into shorter ones. Keep your tenses steady. | B: And use plain words, not literal idioms."),
   QT("Read it aloud in your head", "If it sounds odd in English, rewrite it.",
      "A: Read your English in your head. | B: If it sounds odd, rewrite it."),
   CH("Check", "Before moving on", [("Subject and verb agree", "Articles: a, an, the", "Subject")],
      "A: Check that subjects and verbs agree, | B: and that your articles are right.")],
  QZ("When translating a long sentence into English, you should usually:", ["Keep it as one sentence", "Split it into short ones", "Leave out clauses", "Add your opinion"], 1,
     "Right. Shorter sentences read naturally in English.", "A: Your turn. | B: What should you do with long sentences?"),
  note="Method piece.")

E(56, "english-comprehension", "english-1", EN, "Paper B is English, and it's qualifying too", "Paper B: English comprehension", "book", SRC,
  "A: Paper B tests English, also at 25 percent to qualify. | B: Comprehension is the first section.",
  [ST("The paper", [(300, "", "marks", "300"), (25, "%", "to qualify", "25")],
      "A: Three hundred marks, | B: and 25 percent to qualify."),
   CH("Comprehension", "Answer well", [("Find the sentence that answers", "Then rephrase it", "sentence"), ("Keep it short", "Two or three lines", "short")],
      "A: Find the line in the passage that answers the question, then rephrase it. | B: Keep answers to two or three lines."),
   QT("Don't over-prepare", "Steady reading is enough for most candidates.",
      "A: Most candidates don't need special coaching for it. | B: Steady reading and two practice papers are enough.")],
  QZ("Paper B (English) is:", ["Counted in the merit list", "Qualifying at 25%", "Optional", "Only for some states"], 1,
     "Right. Qualifying at 25%.", "A: Your turn. | B: What is Paper B?"))

E(57, "english-precis", "english-2", EN, "A good précis has a title and one idea", "Paper B: précis", "pen", SRC,
  "A: The English précis has the same rules as the language paper. | B: About a third of the length, in your own words.",
  [CH("Rules", "Précis", [("One-third length", "Unless told otherwise", "third"), ("Third person, past tense", "Reported speech", "Third"), ("A short title", "If asked", "title")],
      "A: About one-third the length. Write in the third person, and in reported speech. | B: Add a short title if asked."),
   QT("Cut", "Examples, repetition, and decoration go first.",
      "A: Examples, repetition, and decoration go first. | B: The argument stays."),
   CH("Count", "Word count", [("Write the count at the end", "If the paper asks", "count")],
      "A: Write the word count at the end | B: if the paper asks for it.")],
  QZ("Which should you usually remove in a précis?", ["The main argument", "Examples and repetition", "The conclusion", "Key facts"], 1,
     "Right. Examples and repetition.", "A: Your turn. | B: What goes first?"),
  note="Method piece.")

E(58, "english-usage", "english-3", EN, "Most English errors are the same ten", "Paper B: usage and vocabulary", "book", SRC,
  "A: Paper B's usage section keeps testing the same few things. | B: Learn them once.",
  [CH("Common errors", "Watch for", [("Subject–verb agreement", "\"One of the boys is…\"", "agreement"), ("Articles", "a, an, the", "Articles"), ("Prepositions", "\"Different from\", \"senior to\"", "Prepositions")],
      "A: Subject–verb agreement. One of the boys is, not are. Articles. | B: And prepositions: different from, senior to."),
   QT("A test", "\"Each of the students has a book.\" Each takes a singular verb.",
      "A: Each of the students has a book. | B: Each takes a singular verb."),
   CH("Vocabulary", "Build it", [("Learn words in sentences", "Not lists", "sentences")],
      "A: Learn new words inside sentences, | B: not from lists.")],
  QZ("Choose the correct sentence:", ["One of my friends live here.", "One of my friends lives here.", "One of my friend lives here.", "One of my friend live here."], 1,
     "Right. 'One of my friends lives…': the subject is 'one'.", "A: Your turn. | B: Which sentence is correct?"))

E(59, "english-short-essay", "english-4", EN, "Paper B's essay rewards clarity", "Paper B: the short essay", "pen", SRC,
  "A: The English paper's essay isn't the Essay paper. | B: It wants clear, correct English, not deep arguments.",
  [CH("Plan", "Simple shape", [("Introduce the topic", "Two lines", "Introduce"), ("Three points", "One paragraph each", "Three"), ("Conclude", "Two lines", "Conclude")],
      "A: Introduce the topic in two lines. Three points, one paragraph each. | B: Two lines to conclude."),
   QT("Keep sentences short", "Fifteen to twenty words is plenty.",
      "A: Keep sentences short, | B: fifteen to twenty words is plenty."),
   CH("Check", "Before you finish", [("Tenses, articles, spelling", "", "Tenses")],
      "A: Check tenses, articles | B: and spelling.")],
  QZ("Paper B's essay mainly tests:", ["Depth of argument", "Clear and correct English", "Statistics", "Quotations"], 1,
     "Right. Clear, correct English.", "A: Your turn. | B: What does it test?"),
  note="Method piece.")

out()
