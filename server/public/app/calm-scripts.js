// Calm now: the exercises built into the app, so they work offline and before any library item is
// approved. English and Hindi come from the content team's calm-script samples (calm-slow-breath-3-min,
// calm-grounding-5-4-3-2-1). Telugu is a draft for the pilot and needs a native speaker's check.
// Approved calm-script@1 items from the library are added after these.

const SETTLE = { en: "Sit or lie down comfortably. If it feels right, close your eyes.", hi: "आराम से बैठिए या लेट जाइए। अगर अच्छा लगे, तो आँखें बंद कर लीजिए।", te: "సౌకర్యంగా కూర్చోండి లేదా పడుకోండి. మీకు బాగుంటే, కళ్ళు మూసుకోండి." };
const KEEP = { en: "Keep breathing: in for 4, out for 6. Let the breath be easy, without forcing.", hi: "साँस जारी रखिए: लगभग 4 सेकंड अंदर, 6 सेकंड बाहर। बिना ज़ोर लगाए, आराम से।", te: "శ్వాస కొనసాగించండి: 4 సెకన్లు లోపలికి, 6 సెకన్లు బయటికి. బలవంతం లేకుండా, సులువుగా." };
const RETURN = { en: "Let your breathing return to its own pace. Notice how you feel, if you wish.", hi: "अब साँस को अपनी स्वाभाविक गति पर लौटने दीजिए। चाहें तो देखिए कि आप कैसा महसूस कर रहे हैं।", te: "ఇప్పుడు శ్వాసను దాని సహజ వేగానికి రానివ్వండి. మీకు ఇష్టమైతే, మీరు ఎలా ఉన్నారో గమనించండి." };
const say = (v) => ({ en: { say: v.en }, hi: { say: v.hi }, te: { say: v.te } });

/** Slow breath, 4 in and 6 out, for `minutes`. */
function slowBreath(minutes) {
  const total = minutes * 60, middle = total - 12 - 18;
  const beats = [{ seconds: 12, ...say(SETTLE) }];
  for (let left = middle; left > 0; left -= 30) beats.push({ seconds: Math.min(30, left), ...say(KEEP) });
  beats.push({ seconds: 18, ...say(RETURN) });
  const n = { 1: ["One minute", "एक मिनट", "ఒక నిమిషం"], 3: ["Three minutes", "तीन मिनट", "మూడు నిమిషాలు"], 5: ["Five minutes", "पाँच मिनट", "ఐదు నిమిషాలు"] }[minutes];
  return {
    id: `slow-breath-${minutes}`, kind: "slow-breath", minutes, pace: { inhale: 4, hold: 0, exhale: 6 },
    title: { en: `${n[0]} of slow breath`, hi: `${n[1]} की धीमी साँस`, te: `${n[2]} నెమ్మదిగా శ్వాస` },
    beats,
  };
}

const DOUBLE_SIGH = {
  id: "double-sigh-1", kind: "double-sigh", minutes: 1, pace: { inhale: 3, hold: 0, exhale: 6 },
  title: { en: "One minute of double sighs", hi: "एक मिनट की दोहरी साँस", te: "ఒక నిమిషం డబుల్ నిట్టూర్పు" },
  beats: [
    { seconds: 9, ...say({ en: "Breathe in through your nose, then take one more short breath in on top.", hi: "नाक से साँस अंदर लीजिए, फिर ऊपर से एक और छोटी साँस लीजिए।", te: "ముక్కుతో శ్వాస లోపలికి తీసుకోండి, తర్వాత పైన మరో చిన్న శ్వాస తీసుకోండి." }) },
    { seconds: 45, ...say({ en: "Now a long, slow breath out through your mouth. Repeat at your own pace.", hi: "अब मुँह से लंबी, धीमी साँस बाहर छोड़िए। अपनी गति से दोहराइए।", te: "ఇప్పుడు నోటితో పొడవైన, నెమ్మదైన శ్వాస బయటికి వదలండి. మీ వేగంలో మళ్ళీ చేయండి." }) },
    { seconds: 6, ...say(RETURN) },
  ],
};

const GROUNDING = {
  id: "grounding-5-4-3-2-1", kind: "grounding", minutes: 3, pace: null,
  title: { en: "Five, four, three, two, one", hi: "पाँच, चार, तीन, दो, एक", te: "ఐదు, నాలుగు, మూడు, రెండు, ఒకటి" },
  beats: [
    { seconds: 15, ...say({ en: "Sit comfortably. Let your eyes rest on the room around you.", hi: "आराम से बैठिए। अगर अच्छा लगे, तो अपनी नज़र आसपास के कमरे पर टिका दीजिए।", te: "సౌకర్యంగా కూర్చోండి. మీ చుట్టూ ఉన్న గదిపై కళ్ళను విశ్రాంతిగా ఉంచండి." }) },
    { seconds: 30, ...say({ en: "Notice five things you can see.", hi: "अब पाँच चीज़ें देखिए जो आपको दिख रही हैं। उन्हें धीरे-धीरे मन में गिनिए।", te: "మీకు కనిపిస్తున్న ఐదు వస్తువులను గమనించండి." }) },
    { seconds: 30, ...say({ en: "Notice four things you can feel or touch, like your chair or the floor.", hi: "अब चार चीज़ें महसूस कीजिए या छुइए, जैसे कुर्सी या फर्श जो आपको छू रहा है।", te: "మీరు తాకగలిగే లేదా అనుభవించగలిగే నాలుగు వస్తువులను గమనించండి, కుర్చీ లేదా నేల లాంటివి." }) },
    { seconds: 30, ...say({ en: "Notice three things you can hear, near and far.", hi: "अब तीन आवाज़ें सुनिए, पास की भी और दूर की भी।", te: "దగ్గర నుంచి, దూరం నుంచి మీకు వినిపించే మూడు శబ్దాలను గమనించండి." }) },
    { seconds: 25, ...say({ en: "Notice two things you can smell. If little comes through, that is fine.", hi: "अब दो गंध महसूस कीजिए। अगर ज़्यादा गंध न आए, तो यह भी ठीक है।", te: "మీకు తెలిసే రెండు వాసనలను గమనించండి. పెద్దగా ఏమీ తెలియకపోయినా పర్వాలేదు." }) },
    { seconds: 20, ...say({ en: "Notice one thing you can taste, or the taste already in your mouth.", hi: "अब एक स्वाद पर ध्यान दीजिए, या मुँह में जो स्वाद पहले से है।", te: "ఒక రుచిని గమనించండి, లేదా నోటిలో ఇప్పటికే ఉన్న రుచిని." }) },
    { seconds: 30, ...say({ en: "Come back to the room slowly. There are no wrong answers.", hi: "अब धीरे-धीरे अपना ध्यान कमरे में वापस लाइए। कोई गलत जवाब नहीं होता।", te: "నెమ్మదిగా గదిలోకి తిరిగి రండి. ఇక్కడ తప్పు సమాధానాలు ఉండవు." }) },
  ],
};

export const CALM_BUILTIN = [slowBreath(1), slowBreath(3), slowBreath(5), DOUBLE_SIGH, GROUNDING];
