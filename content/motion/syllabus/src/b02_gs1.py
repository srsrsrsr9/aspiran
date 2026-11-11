from dsl import *
P = ["mains-gs1"]

E(14, "nagara-dravida", "gs1-1", ["prelims-gs"] + P, "North and south Indian temples tell you apart by the tower", "Nagara and Dravida: two temple styles", "temple",
  ["NCERT Class 11, An Introduction to Indian Art, ch. 6 'Temple Architecture and Sculpture'"],
  "A: Look at the tower, and you can tell where a temple comes from. | B: Curved in the north. Stepped like a pyramid in the south.",
  [CH("Nagara", "North India", [("Shikhara", "A curving tower over the sanctum", "Shikhara"), ("Usually no boundary wall", "Built on a raised platform", "platform")],
      "A: Nagara temples have a curving tower called the shikhara. | B: They usually sit on a raised platform, often without big boundary walls."),
   CH("Dravida", "South India", [("Vimana", "A stepped, pyramid-like tower", "vimana"), ("Gopuram", "Tall gateways in a walled compound", "gopuram")],
      "A: Dravida temples have a stepped tower called the vimana. | B: And a walled compound entered through tall gateways called gopurams."),
   QT("An example of each", "Kandariya Mahadeva, Khajuraho: Nagara. Brihadeeswarar, Thanjavur: Dravida.",
      "A: The Kandariya Mahadeva temple at Khajuraho is Nagara. | B: The Brihadeeswarar temple at Thanjavur, built under Rajaraja Chola, is Dravida.")],
  QZ("A gopuram is:", ["The sanctum of a temple", "A Dravida gateway tower", "A Nagara curved tower", "A pillared hall"], 1,
     "Right. Gopurams are the gateway towers of Dravida temple compounds.", "A: Your turn. | B: What is a gopuram?"),
  note="Vesara (mixed) style left out for length.")

E(15, "plassey-buxar", "gs1-2", ["prelims-gs"] + P, "Plassey won a battle, Buxar won the revenue", "1757 to 1765: how the Company took Bengal", "scroll",
  ["NCERT Class 8, Our Pasts III, ch. 2 'From Trade to Territory'", "Spectrum / Bipan Chandra, Modern India"],
  "A: The East India Company came to trade. | B: In eight years, it was collecting Bengal's taxes.",
  [TL("Three steps", [(1757, "Plassey", "1757"), (1764, "Buxar", "1764"), (1765, "Diwani of Bengal", "1765")],
      "A: In 1757, at Plassey, Robert Clive defeated Siraj-ud-Daulah. | B: In 1764, at Buxar, the Company beat three rulers together. In 1765, it won the Diwani."),
   QT("Plassey", "Won less by fighting than by betrayal: Mir Jafar held back his troops.",
      "A: Plassey was won by a deal more than a fight. | B: Mir Jafar, the Nawab's commander, held back his troops, and became Nawab."),
   CH("Buxar's result", "Treaty of Allahabad, 1765", [("Diwani", "The right to collect revenue in Bengal, Bihar and Orissa", "Diwani")],
      "A: After Buxar, the Mughal emperor Shah Alam the second granted the Diwani. | B: The right to collect revenue in Bengal, Bihar and Orissa.")],
  QZ("The Battle of Buxar (1764) was fought against:", ["Siraj-ud-Daulah alone", "Three allied Indian rulers", "Tipu Sultan", "The Marathas"], 1,
     "Right. Mir Qasim, Shuja-ud-Daulah of Awadh and Mughal emperor Shah Alam II fought together and lost.", "A: Your turn. | B: Who fought the Company at Buxar?"))

E(16, "gandhi-mass-movements", "gs1-3", ["prelims-gs"] + P, "Three mass movements, roughly ten years apart", "Gandhi's three big movements", "lamp",
  ["NCERT Class 10, India and the Contemporary World II, ch. 2 'Nationalism in India'", "Bipan Chandra, India's Struggle for Independence"],
  "A: Gandhi led three nationwide movements against British rule. | B: They came roughly a decade apart.",
  [TL("The three", [(1920, "Non-Cooperation", "1920"), (1930, "Civil Disobedience", "1930"), (1942, "Quit India", "1942")],
      "A: Non-Cooperation began in 1920. Civil Disobedience in 1930. | B: And Quit India in 1942."),
   CH("What ended or sparked them", "One line each", [("Chauri Chaura, 1922", "Violence; Gandhi calls off Non-Cooperation", "Chauri"), ("Dandi, 1930", "The Salt March starts Civil Disobedience", "Dandi"), ("8 August 1942", "Do or Die: Quit India", "August")],
      "A: After violence at Chauri Chaura in 1922, Gandhi called off Non-Cooperation. | B: The Salt March to Dandi began Civil Disobedience. And on the eighth of August 1942 came Do or Die."),
   QT("For Mains", "Each movement drew in groups the last one had missed.",
      "A: In G-S-one answers, show how each one widened the base. | B: Peasants, women, workers, and students, in growing numbers.")],
  QZ("Why did Gandhi call off the Non-Cooperation Movement?", ["The Simon Commission", "The Chauri Chaura incident", "The Gandhi–Irwin Pact", "The Second World War"], 1,
     "Right. The violence at Chauri Chaura in February 1922.", "A: Your turn. | B: Why was Non-Cooperation called off?"))

E(17, "linguistic-states", "gs1-4", ["prelims-gs"] + P + ["mains-gs2"], "A fast unto death redrew India's map", "Linguistic states: from Andhra to 1956", "village",
  ["NCERT Class 12, Politics in India since Independence, ch. 1", "States Reorganisation Act, 1956"],
  "A: In 1952, a man fasted for a Telugu-speaking state, and died. | B: Within four years, India's map was redrawn by language.",
  [TL("How it happened", [(1952, "Potti Sriramulu dies", "1952"), (1953, "Andhra State formed", "1953"), (1956, "States Reorganisation Act", "1956")],
      "A: Potti Sriramulu died after a 56-day fast in December 1952. | B: Andhra State was formed in 1953. And the States Reorganisation Act followed in 1956."),
   ST("The 1956 map", [(14, "", "states", "14"), (6, "", "union territories", "6")],
      "A: Based on the Fazl Ali Commission's report, | B: the Act created 14 states and 6 union territories."),
   QT("The worry, and the result", "Many feared language would divide India. It mostly made the union stronger.",
      "A: Leaders feared language states would break the country. | B: For Mains, argue that they largely did the opposite.")],
  QZ("Who chaired the States Reorganisation Commission?", ["V. P. Menon", "Fazl Ali", "K. M. Panikkar", "H. N. Kunzru"], 1,
     "Right. Fazl Ali chaired it; Panikkar and Kunzru were members.", "A: Your turn. | B: Who chaired the commission?"))

E(18, "french-revolution", "gs1-5", P, "1789 gave the world three words", "The French Revolution: liberty, equality, fraternity", "scroll",
  ["NCERT Class 9, India and the Contemporary World I, ch. 1 'The French Revolution'"],
  "A: Three words from 1789 are still on French coins. | B: Liberty, equality, fraternity.",
  [TL("Key moments", [(1789, "Fall of the Bastille, 14 July", "1789"), (1793, "Louis XVI executed", "1793"), (1804, "Napoleon crowned emperor", "1804")],
      "A: On the fourteenth of July 1789, crowds stormed the Bastille. | B: The king was executed in 1793. And by 1804, Napoleon had crowned himself emperor."),
   CH("The causes", "Why France broke", [("Debt and taxes", "The Third Estate paid; clergy and nobles mostly didn't", "Debt"), ("New ideas", "Rousseau, Montesquieu, Locke", "ideas")],
      "A: The state was in debt, and ordinary people carried the taxes. | B: Thinkers like Rousseau and Montesquieu had questioned the right of kings to rule."),
   QT("For Mains", "The Declaration of the Rights of Man and Citizen, 1789",
      "A: Its Declaration of the Rights of Man shaped later constitutions. | B: Including ideas you will find in our own Preamble.")],
  QZ("Which event is taken as the start of the French Revolution?", ["Napoleon's coronation", "The storming of the Bastille", "The Battle of Waterloo", "The Reign of Terror"], 1,
     "Right. The fall of the Bastille, 14 July 1789.", "A: Your turn. | B: Which event started it?"))

E(19, "urbanisation", "gs1-6", ["prelims-gs"] + P, "A town in the census can be a village on paper", "Urbanisation: who counts as urban?", "people",
  ["Census of India 2011, Provisional Population Totals, Urban Agglomerations and Cities"],
  "A: Is a place a town or a village? | B: The census has its own test, and it's stricter than you think.",
  [ST("Census 2011", [(31.1, "%", "of Indians lived in urban areas", "31")],
      "A: In 2011, 31.1 percent of Indians lived in urban areas. | B: Up from about 27.8 percent in 2001."),
   CH("All three needed", "The test", [("5,000+ people", "Population", "5,000"), ("75% of men in non-farm work", "Main male workers", "75"), ("400 per sq km", "Density", "400")],
      "A: At least five thousand people. At least 75 percent of working men outside farming. | B: And a density of at least 400 people per square kilometre."),
   QT("For Mains", "Census towns are urban in character but often governed as villages.",
      "A: Many census towns are still run by panchayats. | B: That gap shows up in water, sanitation and planning.")],
  QZ("Which is NOT a criterion for a census town?", ["Population of at least 5,000", "75% men in non-farm work", "A municipal corporation", "Density of 400 per sq km"], 2,
     "Right. Census towns have no urban local body; that is what separates them from statutory towns.", "A: Your turn. | B: Which is not a criterion?"))

E(20, "coriolis", "gs1-7", ["prelims-gs"] + P, "Cyclones can't form right on the equator", "The Coriolis effect bends the winds", "globe",
  ["NCERT Class 11, Fundamentals of Physical Geography, ch. 10 'Atmospheric Circulation and Weather Systems'"],
  "A: Why do cyclones spin anticlockwise in the north, | B: and clockwise in the south?",
  [CH("The Coriolis force", "Because the Earth rotates", [("Northern hemisphere", "Winds bend to the right", "Northern"), ("Southern hemisphere", "Winds bend to the left", "Southern")],
      "A: The Earth's rotation deflects moving air. | B: To the right in the northern hemisphere, and to the left in the southern."),
   QT("At the equator", "The Coriolis force is zero at the equator, and greatest at the poles.",
      "A: At the equator, the force is zero. | B: That's why tropical cyclones rarely form within about 5 degrees of it."),
   CH("Where it shows up", "Exam links", [("Trade winds and westerlies", "Their direction", "Trade"), ("Cyclones", "Their spin", "Cyclones")],
      "A: It explains the direction of the trade winds and westerlies, | B: and the spin of cyclones.")],
  QZ("The Coriolis force is greatest at:", ["The equator", "The tropics", "The poles", "30° latitude"], 2,
     "Right. Zero at the equator, maximum at the poles.", "A: Your turn. | B: Where is it greatest?"))

E(21, "industry-location", "gs1-8", ["prelims-gs"] + P, "Heavy raw materials pull factories towards them", "Why industries sit where they do", "factory",
  ["NCERT Class 10, Contemporary India II, ch. 6 'Manufacturing Industries'", "NCERT Class 12, India: People and Economy, ch. 8"],
  "A: Why are so many steel plants in the Chota Nagpur region? | B: Because iron ore and coal are heavy, and they're nearby.",
  [CH("What decides location", "The pulls", [("Raw material", "Heavy or perishable inputs", "Raw"), ("Market", "Bulky or fragile outputs", "Market"), ("Power, labour, transport", "And government policy", "Power")],
      "A: Raw materials, markets, power, labour and transport all pull. | B: Whichever costs most to move usually wins."),
   QT("Weight-losing inputs", "Iron and steel, and sugar, locate near their raw materials.",
      "A: Iron ore and coal lose weight when made into steel. | B: Sugarcane loses weight and spoils fast. So mills sit near the cane."),
   TL("An example", [(1907, "TISCO founded, Jamshedpur", "1907")],
      "A: Tata Iron and Steel Company was set up in 1907 at Jamshedpur. | B: Close to iron ore, coal, and water from the Subarnarekha.")],
  QZ("Sugar mills are usually located near cane fields because sugarcane:", ["Is light", "Loses weight, spoils fast", "Needs a port", "Is imported"], 1,
     "Right. Cane is bulky, loses weight in processing and its sucrose drops after cutting.", "A: Your turn. | B: Why near the fields?"))

E(22, "tsunami-2004", "gs1-9", ["prelims-gs"] + P + ["mains-gs3"], "After 2004, India built a tsunami warning centre", "Tsunamis: the 2004 lesson", "disaster",
  ["INCOIS, Indian Tsunami Early Warning Centre (incois.gov.in)", "NCERT Class 11, ch. on natural hazards"],
  "A: On the twenty-sixth of December 2004, a great earthquake struck off Sumatra. | B: Hours later, waves reached India's coasts with no warning.",
  [ST("The quake", [(9.1, "", "magnitude, off Sumatra", "9")],
      "A: It was of magnitude 9.1, | B: one of the largest ever recorded."),
   QT("What a tsunami is", "A series of waves caused when the sea floor suddenly moves.",
      "A: A tsunami is a series of waves set off when the sea floor suddenly moves. | B: In deep water it's low and fast. Near the coast it piles up."),
   TL("India's answer", [(2007, "Warning centre at INCOIS, Hyderabad", "2007")],
      "A: In 2007, India set up its tsunami early warning centre at INCOIS, in Hyderabad. | B: It now serves the whole Indian Ocean region.")],
  QZ("India's Tsunami Early Warning Centre is run by:", ["IMD", "INCOIS", "ISRO", "NDMA"], 1,
     "Right. The Indian National Centre for Ocean Information Services, Hyderabad.", "A: Your turn. | B: Who runs India's tsunami warning centre?"),
  tone="SERIOUS", note="Check magnitude (9.1, USGS) and the centre's year (2007). Kept factual; no casualty figures.")

out()
