from dsl import *
PP = ["prelims-gs", "mains-gs3"]

E(34, "measuring-jobs", "gs3-1", PP, "How long you look back changes the jobless rate", "Measuring unemployment: PLFS", "chart",
  ["Periodic Labour Force Survey (PLFS), National Statistics Office, concepts and definitions"],
  "A: Were you unemployed last week? Or last year? | B: The answer changes India's jobless rate.",
  [CH("Two ways to count", "The PLFS", [("Usual status", "Looks back 365 days", "Usual"), ("Current weekly status", "Looks back 7 days", "weekly")],
      "A: Usual status asks what you mostly did over the past year. | B: Current weekly status asks about just the past seven days."),
   TL("The survey", [(2017, "PLFS begins", "2017")],
      "A: The Periodic Labour Force Survey began in 2017. | B: It replaced the older five-yearly employment surveys of the N-S-S-O."),
   CH("Key ratios", "Learn the three", [("Labour force participation", "Working or looking for work", "participation"), ("Worker population ratio", "Actually working", "Worker"), ("Unemployment rate", "Looking, but not working", "Unemployment")],
      "A: Labour force participation counts those working or looking for work. | B: The unemployment rate is the share of that labour force without work.")],
  QZ("Current weekly status measures activity over:", ["The past day", "The past 7 days", "The past 30 days", "The past 365 days"], 1,
     "Right. A reference week of 7 days.", "A: Your turn. | B: What period does current weekly status cover?"))

E(35, "gst-council", "gs3-2", PP + ["mains-gs2"], "In the GST Council, neither side can win alone", "GST and the GST Council", "budget",
  ["Constitution (One Hundred and First Amendment) Act, 2016", "Constitution of India, Article 279A"],
  "A: GST replaced a tangle of central and state taxes. | B: And it created a council where neither side can win alone.",
  [TL("The road", [(2016, "101st Amendment", "2016"), (2017, "GST rolls out, 1 July", "2017")],
      "A: The hundred-and-first amendment came in 2016. | B: GST began on the first of July, 2017."),
   CH("The Council", "Article 279A", [("Chair", "The Union Finance Minister", "Chair"), ("Members", "State finance ministers", "Members")],
      "A: The Union Finance Minister chairs the GST Council. | B: Every state's finance minister sits on it."),
   ST("The vote", [(75, "%", "majority needed for a decision", "75")],
      "A: A decision needs a three-quarter majority of weighted votes. | B: The Centre's vote counts for one-third, the states' for two-thirds. So neither can pass anything alone.")],
  QZ("In the GST Council, the Centre's vote carries a weight of:", ["One-half", "One-third", "Two-thirds", "One-quarter"], 1,
     "Right. One-third; all the states together have two-thirds.", "A: Your turn. | B: How much does the Centre's vote weigh?"))

E(36, "msp", "gs3-3", PP, "MSP is announced for 22 crops", "Minimum Support Price, explained", "farm",
  ["Commission for Agricultural Costs and Prices (cacp.dacnet.nic.in)", "Union Budget 2018–19"],
  "A: Before sowing, the government announces a floor price for many crops. | B: That's the Minimum Support Price.",
  [ST("Coverage", [(22, "", "mandated crops", "22")],
      "A: MSP is announced for 22 mandated crops, | B: and a fair price for sugarcane is set separately."),
   CH("Who decides", "The process", [("CACP recommends", "Commission for Agricultural Costs and Prices", "recommends"), ("Cabinet decides", "Cabinet Committee on Economic Affairs", "Cabinet")],
      "A: The Commission for Agricultural Costs and Prices recommends it. | B: The Cabinet Committee on Economic Affairs decides."),
   QT("Since 2018–19", "MSP set at least 1.5 times the cost of production (A2 + FL).",
      "A: Since 2018–19, MSP has been set at least one and a half times paid-out costs plus family labour. | B: Farmer groups ask for a wider cost measure, C two.")],
  QZ("MSP is recommended by:", ["NITI Aayog", "CACP", "FCI", "NABARD"], 1,
     "Right. The Commission for Agricultural Costs and Prices.", "A: Your turn. | B: Who recommends MSP?"))

E(37, "reforms-1991", "gs3-4", PP, "A crisis in 1991 opened India's economy", "1991: liberalisation, privatisation, globalisation", "factory",
  ["Statement on Industrial Policy, 24 July 1991", "NCERT Class 11, Indian Economic Development, ch. 3"],
  "A: In 1991, India nearly ran out of foreign exchange. | B: What followed changed the economy for good.",
  [QT("The crisis", "Reserves fell to just a few weeks of imports. Gold was pledged abroad.",
      "A: Foreign exchange reserves fell to just a few weeks of imports. | B: India pledged gold abroad to borrow."),
   TL("The response", [(1991, "New Industrial Policy, 24 July", "1991")],
      "A: The new industrial policy came on the twenty-fourth of July, 1991, | B: the same day as the Union Budget."),
   CH("LPG", "Three changes", [("Liberalisation", "Most industrial licensing ended", "Liberalisation"), ("Privatisation", "A smaller role for the public sector", "Privatisation"), ("Globalisation", "Lower tariffs, more foreign investment", "Globalisation")],
      "A: Liberalisation ended licensing for most industries. Privatisation shrank the public sector. | B: And globalisation cut tariffs and opened the door to foreign investment.")],
  QZ("The 1991 crisis was mainly a:", ["Banking collapse", "Balance of payments crisis", "Stock market crash", "Food shortage"], 1,
     "Right. A balance of payments crisis.", "A: Your turn. | B: What kind of crisis was it?"))

E(38, "chandrayaan-3", "gs3-5", PP, "India landed near the Moon's south pole first", "Chandrayaan-3: 23 August 2023", "rocket",
  ["ISRO (isro.gov.in), Chandrayaan-3 mission pages"],
  "A: On the twenty-third of August 2023, India landed on the Moon. | B: Near its south pole, where no one had landed before.",
  [TL("India's Moon missions", [(2008, "Chandrayaan-1", "2008"), (2019, "Chandrayaan-2", "2019"), (2023, "Chandrayaan-3 lands", "2023")],
      "A: Chandrayaan-1 in 2008 helped find signs of water on the Moon. | B: Chandrayaan-2's lander crashed in 2019. Chandrayaan-3 landed in 2023."),
   CH("The pieces", "Chandrayaan-3", [("Vikram", "The lander", "Vikram"), ("Pragyan", "The rover", "Pragyan")],
      "A: The lander was called Vikram. | B: And the rover, Pragyan."),
   ST("India's place", [(4, "th", "country to soft-land on the Moon", "fourth")],
      "A: India became the fourth country to soft-land on the Moon, | B: and the twenty-third of August is now National Space Day.")],
  QZ("Chandrayaan-3's rover was called:", ["Vikram", "Pragyan", "Aditya", "Gaganyaan"], 1,
     "Right. Pragyan was the rover; Vikram the lander.", "A: Your turn. | B: What was the rover called?"))

E(39, "eia", "gs3-6", PP, "Big projects must be judged before they're built", "Environmental Impact Assessment", "forest",
  ["EIA Notification, 2006, under the Environment (Protection) Act, 1986", "MoEFCC (parivesh.nic.in)"],
  "A: Before a dam, a mine or a highway is built, | B: its effect on the environment must be assessed. That's E-I-A.",
  [CH("The rule", "EIA Notification, 2006", [("Category A", "Cleared by the Centre (MoEFCC)", "Category"), ("Category B", "Cleared by state authorities (SEIAA)", "B")],
      "A: Category A projects are cleared by the Union environment ministry. | B: Category B projects by state-level authorities."),
   CH("The four stages", "In order", [("Screening · Scoping", "Does it need a full study? What should it cover?", "Screening"), ("Public consultation · Appraisal", "Hear the people; experts review", "Public")],
      "A: Screening and scoping decide what must be studied. | B: Then public consultation, and an expert appraisal."),
   QT("The law behind it", "The Environment (Protection) Act, 1986, passed after the Bhopal gas tragedy.",
      "A: The notification comes under the Environment Protection Act of 1986, | B: passed after the Bhopal gas tragedy.")],
  QZ("The EIA Notification, 2006 was issued under:", ["The Forest Conservation Act", "Environment (Protection) Act", "The Wildlife Protection Act", "The Water Act"], 1,
     "Right. The Environment (Protection) Act, 1986.", "A: Your turn. | B: Under which law?"))

E(40, "cyclone-names", "gs3-7", PP + ["mains-gs1"], "Thirteen countries take turns naming cyclones", "Who names cyclones?", "disaster",
  ["India Meteorological Department, RSMC New Delhi: list of tropical cyclone names (2020)"],
  "A: Biparjoy, Mocha, Tauktae. | B: Who picks the names of cyclones in our region?",
  [ST("The list", [(13, "", "countries", "13"), (169, "", "names, released in 2020", "169")],
      "A: Thirteen countries around the north Indian Ocean contribute names. | B: In 2020, a new list of 169 names was released, thirteen from each."),
   QT("Who keeps it", "IMD's Regional Specialised Meteorological Centre, New Delhi.",
      "A: India's weather department runs the regional centre in New Delhi | B: that names cyclones in this basin."),
   CH("The rules", "A good name is", [("Short and easy to say", "Not offensive", "Short"), ("Used once", "Names are not reused", "once")],
      "A: Names must be short, neutral and easy to say. | B: And each name is used only once.")],
  QZ("Cyclones in the north Indian Ocean are named from a list kept by:", ["NASA", "IMD's RSMC New Delhi", "NDMA", "The UN Secretary-General"], 1,
     "Right. IMD's Regional Specialised Meteorological Centre, New Delhi.", "A: Your turn. | B: Who keeps the list?"))

E(41, "money-laundering", "gs3-8", PP, "Dirty money is washed in three steps", "Money laundering and the PMLA", "shield",
  ["Prevention of Money-laundering Act, 2002", "Financial Action Task Force (fatf-gafi.org)"],
  "A: How does illegal money become clean? | B: In three steps.",
  [CH("The three stages", "Laundering", [("Placement", "Cash enters the system", "Placement"), ("Layering", "Many transfers hide the trail", "Layering"), ("Integration", "It returns as clean money", "Integration")],
      "A: Placement puts the cash into the system. Layering hides the trail. | B: Integration brings it back, looking legal."),
   TL("India's law", [(2002, "PMLA passed", "2002"), (2005, "In force", "2005")],
      "A: The Prevention of Money Laundering Act was passed in 2002, | B: and came into force in 2005. The Enforcement Directorate investigates under it."),
   CH("The global watchdog", "FATF", [("Set up in 1989", "By the G7", "1989"), ("India a member since 2010", "Grey and black lists", "member")],
      "A: The Financial Action Task Force was set up by the G7 in 1989. | B: India became a member in 2010.")],
  QZ("Which stage hides the money's origin through many transactions?", ["Placement", "Layering", "Integration", "Structuring"], 1,
     "Right. Layering.", "A: Your turn. | B: Which stage hides the trail?"))

out()
