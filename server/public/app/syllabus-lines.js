// Every topic of the common papers, broken into the lines of UPSC's own syllabus (CSE notification), so the creeper
// (vine.js) can draw one leaf per line. Short forms of UPSC's wording; where UPSC gives one broad line (Prelims, CSAT,
// Essay), the parts it names. Optional and qualifying papers need none: their topics are already the leaves.
// Keys are node ids from syllabus.js. The Android copy is data/SyllabusLines.kt; keep the two in step.

export const LINES = {
  "pre-1": ["National affairs", "International affairs", "Schemes and policies in the news", "Reports and indices", "Places in the news", "Science and environment in the news"],
  "pre-2": ["Ancient India", "Medieval India", "Art and culture", "British expansion, 1757–1857", "The Revolt of 1857", "Early nationalism and the Congress", "The Gandhian movements", "Towards freedom and Partition"],
  "pre-3": ["Physical geography of India", "Social geography of India", "Economic geography of India", "Physical geography of the world", "Social geography of the world", "Economic geography of the world", "Maps and places"],
  "pre-4": ["The Constitution", "The political system", "Panchayati Raj", "Public policy", "Rights issues", "Courts and the judiciary", "Constitutional and other bodies"],
  "pre-5": ["Sustainable development", "Poverty", "Inclusion", "Demographics", "Social sector initiatives", "Money and banking", "Budget and fiscal policy", "The external sector"],
  "pre-6": ["Ecology basics", "Biodiversity", "Protected areas", "Climate change", "Pollution", "Environmental laws and treaties"],
  "pre-7": ["Physics in everyday life", "Chemistry in everyday life", "Biology and health", "Space and defence technology", "Computers and IT", "Biotechnology"],

  "csat-1": ["Reading a passage", "The main idea", "Inference", "Assumptions and tone"],
  "csat-2": ["Syllogisms", "Statements and conclusions", "Arrangements", "Blood relations", "Directions", "Coding and decoding"],
  "csat-3": ["Reading a situation", "Choosing a course of action", "Setting priorities"],
  "csat-4": ["Series and patterns", "Clocks and calendars", "Puzzles", "Visual reasoning"],
  "csat-5": ["Numbers and their relations", "Percentages and ratios", "Time, speed and work", "Averages and mixtures", "Charts, graphs and tables", "Data sufficiency"],
  "csat-6": ["Listening and responding", "Situations at work", "Dealing with the public"],

  "gs1-1": ["Art forms, ancient to modern", "Literature", "Architecture", "Sculpture", "Painting", "Music and dance", "Religion and philosophy"],
  "gs1-2": ["India from the mid-18th century", "British expansion", "Economic impact of colonial rule", "Social and religious reform", "Significant events", "Personalities", "Issues of the period"],
  "gs1-3": ["Stages of the freedom struggle", "Contributors from different parts of India", "Revolutionary movements", "Peasant and tribal movements", "Women in the struggle", "Independence and Partition"],
  "gs1-4": ["Integration of princely states", "Linguistic reorganisation of states", "Planning and the early economy", "Land reforms", "Wars and foreign policy", "Reorganisation within the country"],
  "gs1-5": ["The Industrial Revolution", "The world wars", "Redrawing of national boundaries", "Colonisation", "Decolonisation", "Communism, capitalism and socialism"],
  "gs1-6": ["Salient features of Indian society", "Diversity of India", "Role of women and women's organisations", "Population and its issues", "Poverty and development", "Urbanisation: problems and remedies", "Effects of globalisation", "Social empowerment", "Communalism", "Regionalism", "Secularism"],
  "gs1-7": ["Salient features of world physical geography", "Geomorphology", "Climatology", "Oceanography", "Distribution of key natural resources", "Changes in critical geographical features"],
  "gs1-8": ["Natural resources across the world", "Resources of South Asia and India", "Location of primary industries", "Location of secondary industries", "Location of tertiary industries"],
  "gs1-9": ["Earthquakes", "Tsunamis", "Volcanic activity", "Cyclones", "Geographical features and where they are", "Changes in features, flora and fauna"],

  "gs2-1": ["Historical underpinnings", "Evolution of the Constitution", "Features", "Amendments", "Significant provisions", "Basic structure", "Comparison with other constitutions"],
  "gs2-2": ["Functions of the Union and the States", "Challenges of the federal structure", "Devolution to local levels", "Separation of powers", "Dispute redressal", "Inter-state relations"],
  "gs2-3": ["Structure", "Functioning", "Conduct of business", "Powers and privileges", "Issues that arise"],
  "gs2-4": ["The executive: structure and functioning", "The judiciary: structure and functioning", "Ministries and departments", "Pressure groups and associations", "Formal and informal associations"],
  "gs2-5": ["Appointment to constitutional posts", "The Representation of the People Act", "Elections", "Electoral reforms", "The Election Commission"],
  "gs2-6": ["Constitutional bodies", "Statutory bodies", "Regulatory bodies", "Quasi-judicial bodies"],
  "gs2-7": ["Government policies and interventions", "NGOs, SHGs and the development sector", "Transparency and accountability", "E-governance", "Citizens' charters", "Role of the civil services"],
  "gs2-8": ["Schemes for vulnerable sections", "Laws and institutions protecting them", "Health", "Education", "Human resources", "Poverty and hunger"],
  "gs2-9": ["Relations with neighbours", "Bilateral agreements", "Regional groupings"],
  "gs2-10": ["Bilateral, regional and global groupings", "Agreements involving India", "International institutions and fora", "Their structure and mandate"],
  "gs2-11": ["Policies of developed and developing countries", "The Indian diaspora"],

  "gs3-1": ["Planning", "Mobilisation of resources", "Growth and development", "Employment", "Inclusive growth"],
  "gs3-2": ["The Budget", "Taxation", "Deficits and debt", "Centre–State finances"],
  "gs3-3": ["Major crops and cropping patterns", "Irrigation", "Storage, transport and marketing", "E-technology for farmers", "Farm subsidies and MSP", "PDS and buffer stocks", "Food security", "Technology missions", "Animal rearing", "Food processing", "Land reforms"],
  "gs3-4": ["Effects of liberalisation", "Industrial policy", "Energy", "Ports, roads and airports", "Railways", "Investment models"],
  "gs3-5": ["Science in everyday life", "Indians in science and technology", "Indigenisation of technology", "Space", "IT and computers", "Robotics", "Nanotechnology", "Biotechnology", "Intellectual property rights"],
  "gs3-6": ["Conservation", "Pollution and degradation", "Environmental impact assessment"],
  "gs3-7": ["Kinds of disasters", "Preparedness", "Response and recovery", "The 2005 Act and NDMA", "The Sendai Framework", "Early warning"],
  "gs3-8": ["Spread of extremism", "External state and non-state actors", "Communication networks", "Media and social networks", "Cyber security", "Money laundering", "Border areas", "Organised crime and terrorism", "Security forces and their mandate"],

  "gs4-1": ["Essence of ethics", "Determinants and consequences", "Dimensions of ethics", "Ethics in private and public life", "Lessons from great leaders and reformers", "Family, society and education"],
  "gs4-2": ["Attitude: content and function", "Attitude and behaviour", "Moral and political attitudes", "Social influence and persuasion", "Integrity", "Impartiality and non-partisanship", "Objectivity", "Dedication to public service", "Empathy, tolerance and compassion"],
  "gs4-3": ["What emotional intelligence is", "Its use in administration"],
  "gs4-4": ["Moral thinkers of India", "Moral thinkers of the world"],
  "gs4-5": ["Ethics in public administration", "Ethical dilemmas", "Laws, rules and conscience", "Accountability", "Ethics in international relations", "Corporate governance", "Probity: the philosophical basis", "Information sharing and RTI", "Codes of ethics and conduct", "Citizens' charters", "Work culture", "Quality of service delivery", "Use of public funds", "Challenges of corruption"],
  "gs4-6": ["Reading the case", "The people involved", "The options", "Choosing and justifying"],

  "essay-1": ["Philosophical themes", "Society", "Economy", "Polity", "Science and environment"],
  "essay-2": ["A clear thesis", "Structure", "Opening and close", "Examples", "The other side"],
};

/** The leaves of one paper as [{ node, line }]. A paper without lines (optional, qualifying) gives one leaf per topic. */
export function leavesOf(paper, nodeId) {
  return paper.topics.map((name, i) => {
    const node = nodeId(paper, i);
    return { node, name, lines: LINES[node] ?? null };
  });
}

/** How many leaves the whole syllabus has for these papers. */
export const leafCount = (papers, nodeId) => papers.reduce((n, p) => n + p.topics.reduce((m, _, i) => m + (LINES[nodeId(p, i)]?.length ?? 1), 0), 0);
