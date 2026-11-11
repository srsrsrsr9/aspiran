from dsl import *
P = ["mains-gs4"]

E(42, "intent-means-ends", "gs4-1", P, "Law is the floor, ethics is the ceiling", "Ethics: intention, means and consequences", "scales",
  ["UPSC CSE syllabus, GS Paper IV", "Lexicon / standard GS4 texts on ethics and human interface"],
  "A: Is something right just because it's legal? | B: Ethics asks a bigger question than the law does.",
  [QT("A useful line", "Law sets the minimum. Ethics asks what is right beyond it.",
      "A: Law tells you the minimum you must do. | B: Ethics asks what is right, even where the law is silent."),
   CH("Judging an action", "Look at three things", [("Intention", "Why was it done?", "Intention"), ("Means", "How was it done?", "Means"), ("Consequences", "What did it lead to?", "Consequences")],
      "A: Look at the intention behind an act, and the means used. | B: And at its consequences, for everyone affected."),
   QT("Gandhi on means", "\"The means may be likened to a seed, the end to a tree.\"",
      "A: Gandhi held that good ends never justify bad means. | B: He said the means are like a seed, and the end, the tree.", by="M. K. Gandhi, Hind Swaraj (1909)")],
  QZ("Which statement best describes the link between law and ethics?", ["They are identical", "Law is ethics' minimum", "Ethics is always written down", "Law always overrides ethics"], 1,
     "Right. Law is often called the minimum of ethics.", "A: Your turn. | B: How are law and ethics linked?"))

E(43, "foundational-values", "gs4-2", P, "The GS4 syllabus lists the values it wants to see", "Foundational values for civil service", "lamp",
  ["UPSC CSE syllabus, GS Paper IV ('foundational values for civil service')", "Second Administrative Reforms Commission, 4th Report, 'Ethics in Governance'"],
  "A: GS4 tells you exactly which values it is looking for. | B: They're written into the syllabus.",
  [CH("The list", "From the syllabus", [("Integrity · Impartiality · Non-partisanship", "", "Integrity"), ("Objectivity · Dedication to public service", "", "Objectivity"), ("Empathy, tolerance, compassion", "Towards the weaker sections", "Empathy")],
      "A: Integrity, impartiality, non-partisanship. Objectivity, and dedication to public service. | B: And empathy, tolerance and compassion towards the weaker sections."),
   QT("Impartial vs non-partisan", "Impartial: fair to every citizen. Non-partisan: neutral between political parties.",
      "A: Impartiality means being fair to every citizen. | B: Non-partisanship means staying neutral between parties, whoever is in power."),
   CH("In your answers", "Show, don't list", [("Name the value", "Then show it in an action", "Name")],
      "A: Don't just name a value. | B: Show what it looks like in a decision, in one line.")],
  QZ("A civil servant serves every government equally, whichever party is in power. This is:", ["Empathy", "Non-partisanship", "Objectivity", "Tolerance"], 1,
     "Right. Non-partisanship.", "A: Your turn. | B: Which value is this?"))

E(44, "emotional-intelligence", "gs4-3", P, "Emotional intelligence has five parts", "Emotional intelligence: Goleman's model", "people",
  ["Daniel Goleman, Emotional Intelligence (1995)"],
  "A: Two officers know the rules equally well. | B: Why does one handle a crisis better? Often, emotional intelligence.",
  [TL("The idea", [(1995, "Goleman's book", "1995")],
      "A: The term was popularised by the psychologist Daniel Goleman, | B: in his 1995 book, Emotional Intelligence."),
   CH("Five components", "Goleman's model", [("Self-awareness · Self-regulation", "Know and manage yourself", "Self"), ("Motivation", "Drive from within", "Motivation"), ("Empathy · Social skills", "Read and handle others", "Empathy")],
      "A: Self-awareness and self-regulation: knowing and managing your own emotions. Motivation from within. | B: Then empathy, and social skills: reading and handling others."),
   QT("In administration", "A calm officer lowers the temperature of a crowd.",
      "A: In a tense crowd, or a hard meeting, | B: a calm officer lowers the temperature. That's E-I at work.")],
  QZ("Which is NOT one of Goleman's five components?", ["Empathy", "Self-regulation", "IQ", "Social skills"], 2,
     "Right. IQ is a separate measure; EI's five are self-awareness, self-regulation, motivation, empathy, social skills.", "A: Your turn. | B: Which one is not a component?"))

E(45, "seven-social-sins", "gs4-4", P, "Gandhi listed seven social sins", "Gandhi's seven social sins", "lamp",
  ["M. K. Gandhi, Young India, 22 October 1925"],
  "A: In 1925, Gandhi published a list of seven social sins. | B: Each one is a thing without its conscience.",
  [CH("The seven", "Young India, 1925", [("Wealth without work · Pleasure without conscience", "", "Wealth"), ("Knowledge without character · Commerce without morality", "", "Knowledge"), ("Science without humanity · Religion without sacrifice", "Politics without principle", "Science")],
      "A: Wealth without work. Pleasure without conscience. Knowledge without character. Commerce without morality. | B: Science without humanity. Religion without sacrifice. And politics without principle."),
   QT("For your answers", "Pair a sin with a modern case: commerce without morality, and a financial fraud.",
      "A: They make strong openers in GS4 and essays. | B: Pair one with a modern case. Commerce without morality, and a corporate fraud."),
   CH("Other thinkers to know", "Quick links", [("Kant", "Treat people as ends, never only as means", "Kant"), ("Aristotle", "Virtue as the golden mean", "Aristotle")],
      "A: Kant: treat people as ends, never only as means. | B: Aristotle: virtue is the mean between extremes.")],
  QZ("Which is one of Gandhi's seven social sins?", ["Wealth without work", "Power without votes", "Trade without tariffs", "Speech without silence"], 0,
     "Right. Wealth without work.", "A: Your turn. | B: Which one is on the list?"))

E(46, "nolan-principles", "gs4-5", P, "Seven principles of public life, from Britain to your answer sheet", "The Nolan Principles", "scales",
  ["Committee on Standards in Public Life (UK), First Report, 1995"],
  "A: In 1995, a British committee wrote seven principles for anyone in public office. | B: They're a favourite in GS4.",
  [TL("Where from", [(1995, "Nolan Committee report", "1995")],
      "A: They came from the Committee on Standards in Public Life, | B: chaired by Lord Nolan, in 1995."),
   CH("The seven", "Principles of public life", [("Selflessness · Integrity · Objectivity", "", "Selflessness"), ("Accountability · Openness", "", "Accountability"), ("Honesty · Leadership", "", "Honesty")],
      "A: Selflessness, integrity, objectivity. Accountability and openness. | B: Honesty, and leadership."),
   QT("Probity", "Probity is integrity you can see: in the files, the money and the decisions.",
      "A: Probity means integrity that shows. | B: In the files, the money, and the decisions.")],
  QZ("The Nolan Principles were first set out in:", ["1979", "1995", "2005", "2010"], 1,
     "Right. 1995.", "A: Your turn. | B: When were they set out?"))

E(47, "case-study-method", "gs4-6", P, "A GS4 case study has a shape", "Case studies: a four-step answer", "pen",
  ["UPSC CSE syllabus, GS Paper IV (Section B, case studies)"],
  "A: GS4 case studies have no single right answer. | B: But a good answer has a clear shape.",
  [CH("Four steps", "The shape", [("1. Stakeholders", "Who is affected?", "Stakeholders"), ("2. Dilemmas", "Which values clash?", "Dilemmas"), ("3. Options", "Two or three, with pros and cons", "Options"), ("4. Your course", "Choose, justify, act", "course")],
      "A: List the stakeholders, and the values that clash. | B: Weigh two or three options. Then choose one, and justify it."),
   QT("Stay inside the rules", "The best option is ethical, legal and practical.",
      "A: Your choice should be ethical, legal and practical. | B: Heroic but illegal is not a good answer."),
   CH("Common mistakes", "Avoid", [("Passing the buck", "\"Inform seniors\" alone", "Passing"), ("Preaching", "Values without actions", "Preaching")],
      "A: Don't just inform your seniors and stop. | B: And don't preach. Show what you would actually do.")],
  QZ("In a GS4 case study, the best final option is usually:", ["The most heroic", "Ethical, legal and practical", "Whatever seniors say", "The quickest"], 1,
     "Right. It must hold up ethically, legally and in practice.", "A: Your turn. | B: What should the final option be?"),
  note="Method piece.")

E(48, "essay-paper", "essay-1", ["mains-essay"], "Two essays, one from each section", "The Essay paper: two in three hours", "pen",
  ["UPSC CSE notice: Mains Essay paper"],
  "A: The Essay paper carries 250 marks. | B: And it's the paper most people practise least.",
  [ST("The paper", [(2, "", "essays, one from each section", "2"), (250, "", "marks in three hours", "250")],
      "A: You write 2 essays, one from each of two sections. | B: For 250 marks, in three hours."),
   CH("A dependable structure", "Plan before you write", [("Opening", "A story, a fact or a question", "Opening"), ("Body", "Many angles: social, economic, political, ethical", "Body"), ("Conclusion", "A balanced, forward-looking close", "Conclusion")],
      "A: Open with a story, a fact, or a question. Then cover many angles. | B: And close on a balanced, forward-looking note."),
   QT("Planning time", "Spend the first 20 to 30 minutes of each essay planning.",
      "A: Spend the first twenty to thirty minutes planning each one. | B: A planned essay rarely loses its way.")],
  QZ("How many essays do you write in the Essay paper?", ["One", "Two", "Three", "Four"], 1,
     "Right. Two, one from each section.", "A: Your turn. | B: How many essays?"),
  note="Check the section format against the latest UPSC notice.")

E(49, "answer-word-limits", "essay-2", ["mains-gs1", "mains-gs2", "mains-gs3", "mains-gs4"], "150 words for 10 marks, 250 for 15", "Mains answers: structure and word limits", "pen",
  ["UPSC Mains question papers (GS I to IV)"],
  "A: A Mains answer has to fit a word limit. | B: And the limit tells you how deep to go.",
  [ST("Word limits", [(150, " words", "for a 10-mark question", "150"), (250, " words", "for a 15-mark question", "250")],
      "A: A ten-mark question asks for about 150 words. | B: A fifteen-marker, about 250."),
   CH("The shape", "Intro, body, conclusion", [("Intro", "Two lines: define or set context", "Intro"), ("Body", "Points under headings, with examples", "Body"), ("Conclusion", "A way forward", "Conclusion")],
      "A: Two lines of introduction. A body of clear points, with examples. | B: And a short way forward to close."),
   QT("Read the directive", "Discuss, examine, critically analyse: each asks for something different.",
      "A: Read the directive word first. | B: Discuss, examine, critically analyse. Each wants a different answer.")],
  QZ("About how many words does a 15-mark GS answer ask for?", ["100", "150", "250", "400"], 2,
     "Right. About 250 words.", "A: Your turn. | B: How many words for fifteen marks?"))

out()
