/* UPSC Pods content templates: shared library.
 * Plain script with no dependencies. It runs in Node (require) and in the browser (window.PodsTemplates).
 *
 *   fillSchema(schema, config)   the part of a pack schema the writer (a person or a model) fills in
 *   apiSchema(schema)            the fill schema with keywords structured outputs can't take removed
 *   assemble(type, fill, config) fill + config defaults + per-type hooks -> a full pack
 *   validate(pack, schema, opts) schema check + house rules -> { errors: [], warnings: [] }
 *   LANGS                        the languages the app knows, with script, word-length factor and status
 *   englishStrings(pack)         every English string a translator must handle
 *   buildTranslationPrompt(...)  the prompt and output schema for translating a pack into another language
 *   makeTranslation(...)         a translator's reply -> a translation file
 *   validateTranslation(...)     checks a translation file against its pack -> { errors, warnings }
 *   applyTranslation(pack, tr)   the pack with that language laid in beside English and Hindi
 */
(function (root) {
  "use strict";

  var DEVANAGARI = /[ऀ-ॿ]/;
  // Every language the app can show. A pack is written in English and Hindi; any other language arrives as a
  // translation file (upsc-pods/translation@1) made from the checked English. Add a language here and in
  // templates/languages/, nowhere else.
  var LANGS = {
    en: { name: "English", native: "English", script: null, scriptName: "Latin", wordFactor: 1, status: "launch", inPack: true },
    hi: { name: "Hindi", native: "हिन्दी", script: /[\u0900-\u097F]/, scriptName: "Devanagari", wordFactor: 1.35, status: "launch", inPack: true,
      fixed: { sources: "संपादक के स्रोत नोट्स", spineOpeners: ["हर दिन", "एक दिन", "इसी वजह से", "आख़िरकार", "और तब से"] } },
    te: { name: "Telugu", native: "తెలుగు", script: /[\u0C00-\u0C7F]/, scriptName: "Telugu", wordFactor: 1.1, status: "pilot",
      fixed: { sources: "ఎడిటర్ సోర్స్ నోట్స్", spineOpeners: ["ప్రతిరోజూ", "ఒకరోజు", "దాని వల్ల", "చివరికి", "అప్పటి నుంచి"] } },
    mr: { name: "Marathi", native: "मराठी", script: /[\u0900-\u097F]/, scriptName: "Devanagari", wordFactor: 1.25, status: "planned" },
    ta: { name: "Tamil", native: "தமிழ்", script: /[\u0B80-\u0BFF]/, scriptName: "Tamil", wordFactor: 1.1, status: "planned" },
    bn: { name: "Bengali", native: "বাংলা", script: /[\u0980-\u09FF]/, scriptName: "Bengali", wordFactor: 1.2, status: "planned" },
    kn: { name: "Kannada", native: "ಕನ್ನಡ", script: /[\u0C80-\u0CFF]/, scriptName: "Kannada", wordFactor: 1.1, status: "planned" },
    // Added 12 Oct 2026 at the founder's request. Planned only, no translations yet; native names need a native-speaker check.
    ml: { name: "Malayalam", native: "മലയാളം", script: /[ഀ-ൿ]/, scriptName: "Malayalam", wordFactor: 1.15, status: "planned" },
    gu: { name: "Gujarati", native: "ગુજરાતી", script: /[઀-૿]/, scriptName: "Gujarati", wordFactor: 1.15, status: "planned" },
    or: { name: "Odia", native: "ଓଡ଼ିଆ", script: /[଀-୿]/, scriptName: "Odia", wordFactor: 1.2, status: "planned" }
  };
  var INDIC = /[\u0900-\u0DFF]/;
  function scriptOf(v) { for (var k in LANGS) if (LANGS[k].script && LANGS[k].script.test(v)) return LANGS[k].scriptName; return null; }
  // Fields written fresh in each language rather than translated: a mnemonic only works in its own words.
  var WRITE_FRESH = /\.(mnemonic|key)$|\.memoryHook$/;
  // Two registers. Content (facts, statements, options, questions, passages) is in the standard written language.
  // Talk to the reader (explanations, tips, nudges, instructions, prompts to reflect) is colloquial, the way a senior
  // would say it over chai. The prompts tell writers and translators which register each field takes.
  var CHAT_KEYS = /^(why|note|say|takeaway|steps|fix|tip|intro|close|howToUse|tryThis|readIt|useIt|starter|after|listenFor|dontCopy|borrow|greeting|signoff|tease|reflect|caption|prompt|examAngle|matters|correction|explain|hint|nudge|end|endKicker)$/;
  var CHAT_BY_TYPE = { "routine-card": /^question$/, "strategy-corner": /^(question|idea)$/, "repeater-journey": /^question$/, "story-spine": /^(why|topic)$/, "book-chai": /^(idea|why)$/ };
  function registerOf(path, type) {
    var segs = parsePath(path).filter(function (x) { return typeof x === "string" && !LANGS[x]; }), k = segs[segs.length - 1];
    return CHAT_KEYS.test(k) || (CHAT_BY_TYPE[type] && CHAT_BY_TYPE[type].test(k)) ? "chat" : "content";
  }
  // Fields kept as they are in every language: an acronym is the acronym aspirants will see in the paper.
  var KEEP_AS_IS = /\.(acronym|letter)$/;
  // Types about one language (the qualifying papers) are never translated; make a new pack in the other language.
  var NO_TRANSLATION = { "precis": 1, "translate-it": 1, "usage-fix": 1 };
  var EMOJI = /\p{Extended_Pictographic}/u;
  var BANNED = [
    [/\bcount ?down\b/i, "no countdowns"], [/\bstreaks?\b/i, "no streaks"], [/\bleaderboard/i, "no leaderboards"],
    [/\bhurry\b/i, "no urgency"], [/\blast chance\b/i, "no urgency"], [/\bonly \d+ (left|seats)/i, "no scarcity"],
    [/\bguarantee[sd]?\s+(an?\s+)?(selection|success|results?|rank|marks|to (clear|crack|pass))/i, "no promises of results"], [/\b100 ?% (sure|selection|guaranteed)/i, "no promises of results"],
    [/\btopper secret/i, "no hype"], [/\bmust[- ]watch\b/i, "no hype"]
  ];

  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function words(s) { s = String(s).trim(); return s ? s.split(/\s+/).length : 0; }
  function typeOf(v) { return v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v; }

  // ---- Fill schema: drop everything marked "x-from": "config" ----
  function fillSchema(schema, config) {
    var s = clone(schema);
    var sc = schema.properties && schema.properties.schema;
    if (sc && sc.const) s["x-type"] = sc.const;   // lets validate() apply per-type house rules to a fill
    (function strip(n) {
      if (!isObj(n)) return;
      if (n.properties) {
        Object.keys(n.properties).forEach(function (k) {
          if (n.properties[k]["x-from"] === "config") {
            delete n.properties[k];
            if (n.required) n.required = n.required.filter(function (r) { return r !== k; });
          } else strip(n.properties[k]);
        });
      }
      if (n.items) strip(n.items);
      ["anyOf", "oneOf", "allOf"].forEach(function (k) { if (n[k]) n[k].forEach(strip); });
    })(s);
    (function req(n) {
      if (!isObj(n)) return;
      if (n["x-fillRequired"]) n.required = n["x-fillRequired"].slice();
      Object.keys(n).forEach(function (k) { if (isObj(n[k])) req(n[k]); });
    })(s);
    delete s.$schema; delete s.$id;
    // Choices that come from config, such as map anchors, become enums the writer must pick from.
    (function enums(n) {
      if (!isObj(n)) return;
      if (n["x-enumFromConfig"] && config) {
        var v = get(config, n["x-enumFromConfig"]);
        if (isObj(v)) v = Object.keys(v);
        if (Array.isArray(v) && v.length) n.enum = v.slice();
      }
      Object.keys(n).forEach(function (k) { if (isObj(n[k])) enums(n[k]); else if (Array.isArray(n[k])) n[k].forEach(enums); });
    })(s);
    // Recipes fix how many scenes, tiles and so on there are. Pin those lengths in the fill schema.
    if (config && config.defaults) (function pin(n, d) {
      if (!isObj(n) || d === undefined) return;
      if (n.type === "array" && Array.isArray(d) && d.length && config.fixedLengths !== false) { n.minItems = d.length; n.maxItems = d.length; pin(n.items, d[0]); return; }
      if (n.properties && isObj(d)) Object.keys(n.properties).forEach(function (k) { pin(n.properties[k], d[k]); });
    })(s, config.defaults);
    return s;
  }

  // ---- API schema: structured outputs take a subset of JSON Schema. Limits stay in validate(). ----
  var DROP = ["minLength", "maxLength", "minItems", "maxItems", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "pattern", "$schema", "$id", "title", "examples", "default"];
  function apiSchema(schema) {
    return (function walk(n) {
      if (Array.isArray(n)) return n.map(walk);
      if (!isObj(n)) return n;
      var o = {};
      if (n.properties) {   // property names are data, not keywords: never drop a field called "title"
        var props = {}; Object.keys(n.properties).forEach(function (k) { props[k] = walk(n.properties[k]); });
        n = Object.assign({}, n); n.properties = props; o.properties = props;
      }
      Object.keys(n).forEach(function (k) {
        if (k === "properties" || DROP.indexOf(k) >= 0 || k.indexOf("x-") === 0) return;
        o[k] = walk(n[k]);
      });
      if (Array.isArray(o.type)) { var t = o.type; delete o.type; var rest = clone(o); o = { anyOf: t.map(function (tt) { var b = clone(rest); b.type = tt; if (tt !== "object") { delete b.properties; delete b.required; delete b.additionalProperties; } if (tt !== "array") delete b.items; if (tt === "null") return { type: "null" }; return b; }) }; if (n.description) o.description = n.description; }
      if (o.type === "object" && o.additionalProperties === undefined) o.additionalProperties = false;
      if (o.description && n["x-maxWords"]) o.description += " (at most " + n["x-maxWords"] + " words)";
      else if (n["x-maxWords"]) o.description = "At most " + n["x-maxWords"] + " words.";
      return o;
    })(schema);
  }

  // ---- Assemble: config defaults under the fill, then per-type hooks ----
  function get(o, path) { return String(path).split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function merge(base, over) {
    if (over === undefined) return clone(base);
    if (Array.isArray(base) && Array.isArray(over)) {
      var n = Math.max(base.length, over.length), out = [];
      for (var i = 0; i < n; i++) out.push(i < over.length ? merge(base.length ? base[Math.min(i, base.length - 1)] : undefined, over[i]) : clone(base[i]));
      return over.length ? out.slice(0, over.length) : out;
    }
    if (isObj(base) && isObj(over)) {
      var o = clone(base);
      Object.keys(over).forEach(function (k) { o[k] = merge(base[k], over[k]); });
      return o;
    }
    return clone(over);
  }

  function niceAxis(vals, ref) {
    var all = vals.concat(ref == null ? [] : [ref]), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), span = (hi - lo) || Math.abs(hi) || 1;
    var step = Math.pow(10, Math.floor(Math.log10(span))); if (span / step < 3) step /= 2;
    var a = Math.floor((lo - span * 0.25) / step) * step, b = Math.ceil((hi + span * 0.1) / step) * step;
    if (lo >= 0 && a < 0) a = 0;
    return [a, b];
  }


  // Coded options for "which of the statements given above is/are correct?"
  function codeOptions(truth, seed) {
    var n = truth.length, C = []; truth.forEach(function (t, i) { if (t) C.push(i + 1); });
    var key = function (s) { return s.join(","); };
    if (n === 2) {
      var two = [[1], [2], [1, 2], []];
      return { en: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"], hi: ["केवल 1", "केवल 2", "1 और 2 दोनों", "न तो 1, न ही 2"], answer: two.map(key).indexOf(key(C)) };
    }
    var all = []; for (var m = 1; m < (1 << n); m++) { var s = []; for (var b = 0; b < n; b++) if (m & (1 << b)) s.push(b + 1); all.push(s); }
    if (!C.length) all.push([]);
    var diff = function (a, b) { var d = 0; for (var i = 1; i <= n; i++) if ((a.indexOf(i) >= 0) !== (b.indexOf(i) >= 0)) d++; return d; };
    var order = function (a, b) { return a.length - b.length || key(a).localeCompare(key(b)); };
    var pick = all.filter(function (s) { return key(s) !== key(C); }).sort(function (a, b) { return diff(a, C) - diff(b, C) || order(a, b); }).slice(0, 3).concat([C]).sort(order);
    var r = (seed || 0) % 4; pick = pick.slice(r).concat(pick.slice(0, r));   // so the right code is not always in the same place
    var join = function (s, and) { return s.length === 1 ? String(s[0]) : s.slice(0, -1).join(", ") + " " + and + " " + s[s.length - 1]; };
    var en = pick.map(function (s) { return !s.length ? "None of them" : s.length === n ? join(s, "and") : s.length === 1 ? s[0] + " only" : join(s, "and") + " only"; });
    var hi = pick.map(function (s) { return !s.length ? "इनमें से कोई नहीं" : s.length === n ? join(s, "और") : "केवल " + join(s, "और"); });
    return { en: en, hi: hi, answer: pick.map(key).indexOf(key(C)) };
  }

  var HOOKS = {
    "chai-pack": function (p, c) {
      if (!p.date) p.date = c.date || new Date().toISOString().slice(0, 10);
      (p.cards || []).forEach(function (card) {
        card.shareable = card.tone !== "TRAGIC";
        if (card.tone !== "LIGHT") { if (card.en) card.en.chotuJoke = null; if (card.hi) card.hi.chotuJoke = null; }
        if (!card.shareCard && card.id) card.shareCard = { en: "share/" + card.id + ".en.png", hi: "share/" + card.id + ".hi.png" };
        if (card.pyq === undefined) card.pyq = null;
        if (!card.pyqLabel && c.pyqLabel) card.pyqLabel = clone(c.pyqLabel);
        if (!card.review) card.review = clone(c.perCardReview);
        if (card.illustration === undefined) card.illustration = null;
      });
    },
    "explainer": function (p) {
      if (p.scenes) { p.scenes.forEach(function (s, i) { s.index = i; }); p.totalSeconds = p.scenes.reduce(function (a, s) { return a + (s.seconds || 0); }, 0); }
    },
    "reel": function (p, c) {
      var cards = (c.cardIds || []).map(function (id) { return { kind: "card", seconds: c.cardSeconds || 16, cardId: id, showTakeawayAtSeconds: 6, uses: ["illustration", "lensChips[0..1]", "headline", "takeaway"] }; });
      if (p.intro && p.outro) {
        p.segments = [{ kind: "intro", seconds: c.introSeconds || 4, text: p.intro }].concat(cards, [{ kind: "outro", seconds: c.outroSeconds || 6, text: p.outro }]);
        delete p.intro; delete p.outro;
      }
    },
    "map-card": function (p, c) {
      var A = c.anchors || {};
      (p.pins || []).forEach(function (pin) { var a = A[pin.id]; if (a) { pin.x = a.x; pin.y = a.y; } });
      if (p.find && p.find.targetAnchor && A[p.find.targetAnchor]) { var t = A[p.find.targetAnchor]; p.find.target = { shape: "ellipse", cx: t.x, cy: t.y, rx: t.rx || 24, ry: t.ry || 18 }; }
      if (p.find) delete p.find.targetAnchor;
    },
    "number-card": function (p) {
      var ch = p.chart; if (!ch || !ch.bars) return;
      if (ch.axisStart == null || ch.axisEnd == null) { var ax = niceAxis(ch.bars.map(function (b) { return b.v; }), ch.reference); ch.axisStart = ax[0]; ch.axisEnd = ax[1]; }
      if (!ch.bars.some(function (b) { return b.hero; })) { var best = ch.bars.filter(function (b) { return b.v === p.value; })[0]; if (best) best.hero = true; }
    },
    "radio": function (p, c) {
      var n = (p.stations || []).length, F = c.freqs || [];
      (p.stations || []).forEach(function (st, i) { st.freq = F[i] != null ? F[i] : Math.round((88 + (i + 1) * 20 / (n + 1)) * 10) / 10; });
    },
    "statement-code": function (p) { var st = (p.en && p.en.stem) || "", h = 0; for (var i = 0; i < st.length; i++) h = (h * 31 + st.charCodeAt(i)) % 9973; var o = codeOptions(p.truth || [], h); p.options = { en: o.en, hi: o.hi }; p.answer = o.answer; },
    "pairs-count": function (p) {
      var n = (p.pairs || []).length, c = (p.pairs || []).filter(function (x) { return x.correct; }).length;
      var en = n === 4 ? ["Only one pair", "Only two pairs", "Only three pairs", "All four pairs"] : ["Only one pair", "Only two pairs", "All three pairs", "None of the pairs"];
      var hi = n === 4 ? ["केवल एक युग्म", "केवल दो युग्म", "केवल तीन युग्म", "सभी चार युग्म"] : ["केवल एक युग्म", "केवल दो युग्म", "सभी तीन युग्म", "कोई भी युग्म नहीं"];
      p.options = { en: en, hi: hi }; p.answer = c === 0 ? (n === 4 ? -1 : 3) : c - 1;
    },
    "should-i-guess": function (p, c) {
      var m = c.marking || (p.marking || {}), R = m.right != null ? m.right : 2, X = m.wrong != null ? m.wrong : 0.66;
      (p.rounds || []).forEach(function (r) {
        var n = r.optionsLeft, ev = Math.round((R / n - X * (n - 1) / n) * 100) / 100;
        r.ev = ev; r.verdict = ev >= 0.1 ? "guess" : ev <= -0.1 ? "skip" : "even";
        var sum = R + " × 1/" + n + " − " + X + " × " + (n - 1) + "/" + n + " = " + (ev > 0 ? "+" : "") + ev;
        r.computed = r.verdict === "even"
          ? { en: "With " + n + " options left, a guess is worth about zero on average (" + sum + "). Rule out one more before you decide.", hi: n + " विकल्प बचे हों तो अंदाज़े का औसत मूल्य लगभग शून्य है (" + sum + ")। तय करने से पहले एक और विकल्प हटाइए।" }
          : { en: "With " + n + " options left, a guess is worth about " + (ev > 0 ? "+" : "") + ev + " marks on average (" + sum + "), so it " + (ev > 0 ? "pays" : "costs") + " over many questions.", hi: n + " विकल्प बचे हों तो अंदाज़े का औसत मूल्य लगभग " + (ev > 0 ? "+" : "") + ev + " अंक है (" + sum + "), इसलिए कई प्रश्नों में यह " + (ev > 0 ? "फ़ायदा देता है" : "नुकसान करता है") + "।" };
      });
    },
    "then-now": function (p) {
      (p.metrics || []).forEach(function (m) { if (m.max == null) m.max = niceAxis([m.from, m.to], null)[1]; });
    }
  };

  function assemble(type, fill, config) {
    config = config || {};
    var pack = merge(config.defaults || {}, fill);
    if (config.schemaId) pack.schema = config.schemaId;
    if (config.review) pack.review = clone(config.review);
    if (pack.tone === "TRAGIC" && pack.mood) { pack.mood.sfx = false; pack.mood.bed = null; }
    if (pack.quoteId && config.quotes) {   // quote text always comes from the bank, never from the writer
      var q = config.quotes.filter(function (x) { return x.id === pack.quoteId; })[0];
      if (q) pack.quote = { id: q.id, kind: q.kind, text: q.text, hi: q.hi, author: q.author, source: q.source, chapter: q.chapter, edition: q.edition, verified: !!q.verifiedBy, portrait: q.portrait };
    }
    if (HOOKS[type]) HOOKS[type](pack, config);
    return pack;
  }

  // ---- Validate ----
  function validateSchema(v, s, path, out) {
    if (!s || s === true) return;
    if (s.anyOf) { var ok = s.anyOf.some(function (alt) { var e = []; validateSchema(v, alt, path, { errors: e, warnings: [] }); return !e.length; }); if (!ok) out.errors.push(path + ": does not match any allowed shape"); return; }
    if (s.type) {
      var t = typeOf(v), want = Array.isArray(s.type) ? s.type : [s.type];
      var fits = want.some(function (w) { return w === t || (w === "number" && t === "integer"); });
      if (!fits) { out.errors.push(path + ": should be " + want.join(" or ") + ", got " + t); return; }
    }
    if (s.const !== undefined && v !== s.const) out.errors.push(path + ": must be " + JSON.stringify(s.const));
    if (s.enum && s.enum.indexOf(v) < 0) out.errors.push(path + ": must be one of " + s.enum.join(", ") + " (got " + JSON.stringify(v) + ")");
    if (typeof v === "string") {
      if (s.minLength != null && v.length < s.minLength) out.errors.push(path + ": is empty");
      if (s.maxLength != null && v.length > s.maxLength) out.errors.push(path + ": " + v.length + " characters, limit " + s.maxLength);
      if (s.pattern && !new RegExp(s.pattern).test(v)) out.errors.push(path + ": does not match " + s.pattern);
      if (s["x-maxWords"] != null && words(v) > s["x-maxWords"]) out.errors.push(path + ": " + words(v) + " words, limit " + s["x-maxWords"]);
      if (s["x-minWords"] != null && words(v) < s["x-minWords"]) out.warnings.push(path + ": only " + words(v) + " words, aim for " + s["x-minWords"] + "+");
    }
    if (typeof v === "number") {
      if (s.minimum != null && v < s.minimum) out.errors.push(path + ": below " + s.minimum);
      if (s.maximum != null && v > s.maximum) out.errors.push(path + ": above " + s.maximum);
    }
    if (Array.isArray(v)) {
      if (s.minItems != null && v.length < s.minItems) out.errors.push(path + ": " + v.length + " items, need at least " + s.minItems);
      if (s.maxItems != null && v.length > s.maxItems) out.errors.push(path + ": " + v.length + " items, at most " + s.maxItems);
      if (s.items) v.forEach(function (x, i) { validateSchema(x, s.items, path + "[" + i + "]", out); });
    }
    if (isObj(v)) {
      (s.required || []).forEach(function (k) { if (!(k in v)) out.errors.push(path + ": missing " + k); });
      if (s.properties) Object.keys(v).forEach(function (k) {
        if (s.properties[k]) validateSchema(v[k], s.properties[k], path + "." + k, out);
        else if (s.additionalProperties === false) out.errors.push(path + ": unexpected field " + k);
      });
    }
  }

  // House rules that hold for every type.
  function houseRules(pack, out, opts) {
    (function walk(v, path, tone, lang) {
      if (isObj(v)) {
        var t = v.tone || tone;
        if (v.en !== undefined) Object.keys(v).forEach(function (l) { if (l !== "en" && LANGS[l] && v[l] !== null && v[l] !== undefined) parity(v.en, v[l], path, out, l); });
        if (t && t !== "LIGHT" && typeof v.chotuJoke === "string") out.errors.push(path + ".chotuJoke: only LIGHT cards get a joke");
        if (t === "TRAGIC") { if (v.shareable === true) out.errors.push(path + ": TRAGIC content cannot be shareable"); if (v.mood && (v.mood.sfx || v.mood.bed)) out.errors.push(path + ".mood: TRAGIC content gets no music or sound effects"); }
        Object.keys(v).forEach(function (k) { walk(v[k], path + "." + k, t, LANGS[k] ? k : lang); });
      } else if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]", tone, lang); });
      else if (typeof v === "string" && !/(^|\.)(schema|id|date|cardId|file|path|illustration|base|theme|kind|status|verdict|paper|tone|shape|staticLink)$/.test(path) && !/(\.png|\.svg|\.ogg|\.json)$/.test(v)) {
        scriptCheck(v, path, lang, out, opts);
        if (lang) BANNED.forEach(function (b) { if (b[0].test(v)) out.errors.push(path + ": " + b[1] + " (\"" + v.match(b[0])[0] + "\")"); });
        if (tone && tone !== "LIGHT" && lang && EMOJI.test(v)) out.errors.push(path + ": emoji only on LIGHT content");
      }
    })(pack, "$", pack.tone, null);
    if (pack.review && pack.review.status && opts.generated && pack.review.status !== "draft") out.errors.push("$.review.status: generated packs start as draft");
    if (pack.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(pack.id)) out.errors.push("$.id: use lowercase-with-hyphens");
    if (opts.source && !pack.selfContained) grounding(pack, opts.source, out);
    (function src(v, path) {
      if (isObj(v)) Object.keys(v).forEach(function (k) { if ((k === "sources" || k === "source") && isObj(v[k]) && /Editor's source notes/.test(v[k].en || "")) out.warnings.push(path + "." + k + ": the editor needs to name the source"); else src(v[k], path + "." + k); }); })(pack, "$");
  }

  // Each language must be in its own script, and English in none of the Indian ones.
  function scriptCheck(v, path, lang, out, opts) {
    if (!lang) return;
    var L = LANGS[lang];
    if (lang === "en") {
      var sn = scriptOf(v);
      if (sn && !(opts && opts.key === "translate-it" && /\.note\.en$/.test(path))) out.errors.push(path + ": English field contains " + sn);
      return;
    }
    if (new RegExp("\\.(mnemonic|acronym|letter|key)\\." + lang + "$|\\." + lang + "\\.(book|acronym|letter|key)$").test(path)) return;
    if (v.length > 3 && !L.script.test(v) && /[a-z]{4}/i.test(v)) out.errors.push(path + ": " + L.name + " field has no " + L.scriptName + " text");
    var other = INDIC.test(v.replace(new RegExp(L.script.source, "g"), ""));
    if (other) out.errors.push(path + ": " + L.name + " field contains " + scriptOf(v.replace(new RegExp(L.script.source, "g"), "")) + " text");
  }

  // Every language must say the same thing as the English: same list lengths, same keys, same answers.
  function parity(en, hi, path, out, l) {
    l = l || "hi";
    if (Array.isArray(en) && Array.isArray(hi)) { if (en.length !== hi.length) out.errors.push(path + ": en has " + en.length + " items, " + l + " has " + hi.length); return; }
    if (isObj(en) && isObj(hi)) {
      var ke = Object.keys(en).sort().join(","), kh = Object.keys(hi).sort().join(",");
      if (ke !== kh) out.errors.push(path + ": en and " + l + " have different fields");
      Object.keys(en).forEach(function (k) {
        if (typeof en[k] === "number" || typeof en[k] === "boolean") { if (hi[k] !== en[k]) out.errors.push(path + "." + k + ": en is " + en[k] + ", " + l + " is " + hi[k]); }
        else if (Array.isArray(en[k]) && Array.isArray(hi[k]) && en[k].length !== hi[k].length) out.errors.push(path + "." + k + ": en has " + en[k].length + " items, " + l + " has " + hi[k].length);
      });
    }
  }

  // Small models invent numbers. Every number in the English text should appear in the source.
  function grounding(pack, source, out) {
    var src = String(source).replace(/,(?=\d{3})/g, "");
    var seen = {};
    (function walk(v, path, lang) {
      if (isObj(v) && typeof v.answerExpr === "string") return;   // worked numbers; the answerExpr check covers them
      if (isObj(v)) Object.keys(v).forEach(function (k) { if (k === "review" || k === "provenance" || k === "canvas" || k === "sfx" || k === "mood" || k === "computed" || k === "quote" || k === "marking") return;
        if (typeof v[k] === "number" && /^(v|value|from|to|year|reference)$/.test(k)) checkNum(String(v[k]), path + "." + k);
        walk(v[k], path + "." + k, k === "en" ? "en" : k === "hi" ? "hi" : lang); });
      else if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]", lang); });
      else if (typeof v === "string" && lang === "en") {
        (v.replace(/,(?=\d{3})/g, "").match(/\d+(\.\d+)?/g) || []).forEach(function (n) { checkNum(n, path); });
      }
    })(pack, "$", null);
    function checkNum(n, path) {
      if (n.length < 2 && +n < 10) return;   // small counts like "two" or "3 points" are fine
      if (seen[n]) return; seen[n] = true;
      if (!new RegExp("(^|[^\\d.])" + n.replace(".", "\\.") + "(?![\\d])").test(src)) out.warnings.push(path + ": the number " + n + " is not in the source text. Check it");
    }
  }


  // Rules a schema cannot say, per type. Keyed by the type part of pack.schema.
  var RULES = {
    "trap-spotter": function (p, err) { (p.questions || []).forEach(function (q, i) { (q.traps || []).forEach(function (t, j) { if ((j === q.answerIndex) !== (t === "none")) err("$.questions[" + i + "].traps[" + j + "]: the right option is \"none\" and every wrong option names a trap"); }); }); },
    "how-many-correct": function (p, err) { (p.items || []).forEach(function (q, i) { if (q.en && q.truth && q.truth.length !== q.en.statements.length) err("$.items[" + i + "].truth: needs one true/false per statement"); }); },
    "timeline-shuffle": function (p, err) { var y = (p.items || []).map(function (x) { return x.year; }); for (var i = 1; i < y.length; i++) if (y[i] < y[i - 1]) err("$.items: list events oldest first (" + y[i - 1] + " comes before " + y[i] + ")"); },
    "rank-it": function (p, err) { var v = (p.items || []).map(function (x) { return x.value; }); for (var i = 1; i < v.length; i++) if (v[i] > v[i - 1]) err("$.items: list items largest first"); },
    "bucket-sort": function (p, err) { var n = p.buckets && p.buckets.en ? p.buckets.en.length : 0; (p.items || []).forEach(function (x, i) { if (x.bucket >= n) err("$.items[" + i + "].bucket: there are only " + n + " buckets"); }); },
    "fill-the-gap": function (p, err) {
      var a = p.answers || [];
      ["en", "hi"].forEach(function (l) { var s = p[l]; if (!s) return;
        var m = (s.text.match(/\[\[(\d+)\]\]/g) || []).map(function (x) { return +x.slice(2, -2); });
        if (m.length !== a.length) err("$." + l + ".text: " + m.length + " gaps but " + a.length + " answers");
        m.forEach(function (g, i) { if (g !== i + 1) err("$." + l + ".text: number the gaps [[1]], [[2]] ... in order"); });
        a.forEach(function (k, i) { if (k >= (s.bank || []).length) err("$.answers[" + i + "]: no word " + k + " in the " + l + " bank"); });
      });
    },
    "csat-quant": function (p, err) { (p.problems || []).forEach(function (q, i) { exprCheck(q, p.en ? null : q, "$.problems[" + i + "]", err); }); },
    "data-interpretation": function (p, err) { (p.questions || []).forEach(function (q, i) { exprCheck(q, null, "$.questions[" + i + "]", err); }); },
    "csat-passage": function (p, err, opts) { verbatim(p.passage && p.passage.en, opts.source, "$.passage.en", err); },
    "precis": function (p, err, opts) {
      verbatim(p.passage, opts.source, "$.passage", err);
      var a = words(p.passage || ""), b = words(p.precis || "");
      if (a && (b > Math.ceil(a / 3 * 1.25) || b < Math.floor(a / 3 * 0.6))) err("$.precis: " + b + " words; aim for about one-third of the passage's " + a + " (" + Math.round(a / 3) + ")");
      if (p.language === "hi" && !DEVANAGARI.test(p.precis || "")) err("$.precis: a Hindi précis should be in Devanagari");
      if (p.language === "en" && DEVANAGARI.test(p.precis || "")) err("$.precis: an English précis should not contain Devanagari");
    },
    "pairs-count": function (p, err) { if (p.answer === -1) err("$.pairs: with four pairs, at least one must be correct (the options run from one to four)"); },
    "story-spine": function (p, err) {
      var O = (p.spineOpeners) || { en: ["Every day", "One day", "Because of that", "Until finally", "And ever since"], hi: ["हर दिन", "एक दिन", "इसी वजह से", "आख़िरकार", "और तब से"] };
      ["en", "hi"].forEach(function (l) { ((p[l] && p[l].spine) || []).forEach(function (line, i) { if (O[l][i] && line.indexOf(O[l][i]) !== 0) err("$." + l + ".spine[" + i + "]: start with \"" + O[l][i] + "\""); }); });
    },
    "strategy-corner": function (p, err) { noBattle(p, err); quoteOk(p, err); },
    "kautilya-lens": function (p, err) { noBattle(p, err); quoteOk(p, err); },
    "repeater-journey": function (p, err) { if (p.composite === false && !(p.consent && p.consent.given === true)) err("$.consent: a real member's story needs their written consent"); },
    "narrated-classic": function (p, err, opts) {
      if (opts.source && p.passage && p.passage.en) { var norm = function (x) { return String(x).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim(); }; if (norm(opts.source).indexOf(norm(p.passage.en)) < 0) err("$.passage.en: must be copied exactly from the source text"); }
    }
  };

  function verbatim(text, source, path, err) { if (!source || !text) return; var norm = function (x) { return String(x).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim(); }; if (norm(source).indexOf(norm(text)) < 0) err(path + ": must be copied exactly from the source text"); }
  // Calm scripts make no health claims, and their steps add up to the time they promise.
  var HEALTH_CLAIM = /\b(cures?|heal(s|ing)?|treat(s|ment)?|therap(y|eutic)|clinical(ly)?|proven|brain ?waves?|disorder|medicine|diagnos)/i;
  RULES["calm-script"] = function (p, err) {
    (function walk(v, path) { if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]"); }); else if (isObj(v)) Object.keys(v).forEach(function (k) { if (k !== "support" && k !== "bed") walk(v[k], path + "." + k); }); else if (typeof v === "string" && /\.en(\.|$)/.test(path) && HEALTH_CLAIM.test(v)) err(path + ": no health claims (\"" + v.match(HEALTH_CLAIM)[0] + "\")"); })(p, "$");
    var total = (p.beats || []).reduce(function (a, b) { return a + (b.seconds || 0); }, 0), want = (p.minutes || 0) * 60;
    if (want && Math.abs(total - want) > want * 0.2) err("$.beats: the steps add up to " + total + " seconds, but the script promises " + p.minutes + " minute(s)");
    var breath = p.kind === "slow-breath" || p.kind === "sigh";
    if (breath && !p.pace) err("$.pace: needed for " + p.kind);
    if (!breath && p.pace) err("$.pace: only for slow-breath and sigh; use null");
    if (p.kind === "slow-breath" && p.pace) { var c = p.pace.inhale + p.pace.hold + p.pace.exhale; if (c < 8 || c > 12) err("$.pace: one breath takes " + c + " seconds; slow breathing is 8 to 12 (5 to 7 a minute)"); }
  };
  // A routine card quotes only what its source says word for word.
  RULES["routine-card"] = function (p, err, opts) {
    if (!opts || !opts.source) return;
    var src = String(opts.source).replace(/\s+/g, " ");
    (function walk(v, path) { if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]"); }); else if (isObj(v)) Object.keys(v).forEach(function (k) { if (k !== "review" && k !== "sources") walk(v[k], path + "." + k); });
      else if (typeof v === "string" && /\.en(\.|\[|$)/.test(path)) (v.match(/["\u201c]([^"\u201d]{12,})["\u201d]/g) || []).forEach(function (q) { var inner = q.slice(1, -1).trim(); if (src.indexOf(inner) < 0) err(path + ": the quote " + q + " is not word for word in the source"); }); })(p, "$");
  };

  // The Hidden Why: focus points on the 360x640 drawing, a last frame that names the idea, and a source.
  RULES["hidden-why"] = function (p, err) {
    var fr = p.frames || [];
    fr.forEach(function (f, i) {
      var z = f.focus || [];
      if (z.length === 3 && (z[0] < 0 || z[0] > 360 || z[1] < 0 || z[1] > 640)) err("$.frames[" + i + "].focus: x must be 0 to 360 and y 0 to 640");
      if (z.length === 3 && (z[2] < 1 || z[2] > 2.5)) err("$.frames[" + i + "].focus: zoom must be 1 to 2.5");
    });
    var last = fr.length ? String(fr[fr.length - 1].en || "").toLowerCase() : "", name = String((p.named && p.named.en) || "").split(/[:(]/)[0].trim().toLowerCase();
    var key = name.split(/\s+/).filter(function (w) { return w.length > 3; });
    if (last && key.length && !key.some(function (w) { return last.indexOf(w.replace(/'s$/, "")) >= 0; })) err("$.frames: the last frame should name the idea (\"" + name + "\")");
    if (!(p.sources || []).length) err("$.sources: name at least one study, record or law");
  };

  // answerExpr is plain arithmetic; work it out and compare with the number in the right option.
  function exprCheck(q, _, path, err) {
    if (!q.answerExpr) return;
    if (!/^[0-9+\-*/(). ]+$/.test(q.answerExpr)) { err(path + ".answerExpr: digits and + - * / ( ) only"); return; }
    var v; try { v = Function("return (" + q.answerExpr + ")")(); } catch (e) { err(path + ".answerExpr: cannot be worked out"); return; }
    var opt = q.en && q.en.options ? q.en.options[q.answer] : null, m = opt ? String(opt).replace(/,(?=\d{3})/g, "").match(/-?\d+(\.\d+)?/) : null;
    if (!m) { err(path + ": the right option has no number to check"); return; }
    var want = parseFloat(m[0]), dp = (m[0].split(".")[1] || "").length, tol = Math.max(0.5 * Math.pow(10, -dp), Math.abs(want) * 0.005);
    if (Math.abs(v - want) > tol) err(path + ": answerExpr gives " + (Math.round(v * 1000) / 1000) + " but the right option says " + opt);
  }
  var BATTLE = /\b(enem(y|ies)|battle|war|wars|fight|defeat|crush|kill)\b/i;
  function noBattle(p, err) { ["en"].forEach(function (l) { var s = p[l]; if (!s) return; Object.keys(s).forEach(function (k) { if (typeof s[k] === "string" && BATTLE.test(s[k])) err("$." + l + "." + k + ": no battle language aimed at people (\"" + s[k].match(BATTLE)[0] + "\")"); }); }); }
  function quoteOk(p, err) { if (p.quote === undefined) return; if (!p.quote || !p.quote.text) err("$.quoteId: not found in the quote bank"); }


  function validate(pack, schema, opts) {
    opts = opts || {};
    var out = { errors: [], warnings: [] };
    validateSchema(pack, schema, "$", out);
    var tid = function (x) { return String(x || "").replace(/^upsc-pods\//, "").replace(/@\d+$/, ""); };
    houseRules(pack, out, Object.assign({}, opts, { key: tid(typeof pack.schema === "string" ? pack.schema : schema && schema["x-type"]) }));
    var key = typeof pack.schema === "string" ? tid(pack.schema) : "";
    if (RULES[key]) RULES[key](pack, function (m) { out.errors.push(m); }, opts);
    return out;
  }

  // ---- Translations: any language beyond the pack's English and Hindi ----
  // A translation file holds one string per English string, keyed by the English string's path, with the English
  // it was made from. If the English later changes, the string is stale and must be translated again.
  //   { schema: "upsc-pods/translation@1", lang: "te", pack: { id, schema }, strings: { "$.title.en": { en, text } }, review }
  var SKIP_KEY = /^(review|provenance|quote|computed|marking|tags|sfx|mood|canvas|consent|audio|narrator)$/;
  var CODE_PATH = /(^|\.)(schema|id|date|cardId|file|path|illustration|base|theme|kind|status|verdict|paper|tone|shape|staticLink|quoteId|answerExpr|unit_code)$/;
  function parsePath(p) { var segs = [], re = /\.([^.[\]]+)|\[(\d+)\]/g, m; while ((m = re.exec(p))) segs.push(m[1] !== undefined ? m[1] : +m[2]); return segs; }
  function getAt(o, segs) { for (var i = 0; i < segs.length; i++) { if (o == null) return undefined; o = o[segs[i]]; } return o; }
  function typeKey(pack) { return String(pack.schema || "").replace(/^upsc-pods\//, "").replace(/@\d+$/, ""); }

  // Every English string a translator must handle, in reading order.
  function englishStrings(pack) {
    var list = [];
    (function walk(v, path, inEn) {
      if (Array.isArray(v)) v.forEach(function (x, i) { walk(x, path + "[" + i + "]", inEn); });
      else if (isObj(v)) Object.keys(v).forEach(function (k) {
        if (SKIP_KEY.test(k) || (LANGS[k] && k !== "en")) return;
        walk(v[k], path + "." + k, inEn || k === "en");
      });
      else if (inEn && typeof v === "string" && v.trim() && !CODE_PATH.test(path.replace(/\[\d+\]$/, ""))) { var bare = path.replace(/\[\d+\]$/, "").replace(/\.en(?=\.|\[|$)/, ""); list.push({ path: path, en: v, native: WRITE_FRESH.test(bare), keep: KEEP_AS_IS.test(bare), register: registerOf(path, typeKey(pack)) }); }
    })(pack, "$", false);
    return list;
  }

  // The word limit for one translated string: the schema's English limit times the language's factor.
  function limitFor(schema, path, lang) {
    if (!schema) return null;
    var s = schema, segs = parsePath(path);
    for (var i = 0; i < segs.length && s; i++) {
      if (typeof segs[i] === "number") s = s.items; else s = s.properties && s.properties[segs[i]];
    }
    return s && s["x-maxWords"] ? Math.ceil(s["x-maxWords"] * LANGS[lang].wordFactor) : null;
  }

  // The pack with the translation laid in beside the English: every { en, hi } object gains a { lang } sibling.
  // Strings the file lacks, or whose English has changed, stay in English and are listed in pack._untranslated.
  function applyTranslation(pack, tr) {
    var out = clone(pack), lang = tr.lang, missing = [];
    englishStrings(pack).forEach(function (s) {
      var segs = parsePath(s.path), at = segs.lastIndexOf("en");
      var holder = getAt(out, segs.slice(0, at));
      if (!isObj(holder)) return;
      if (holder[lang] === undefined || holder[lang] === null) holder[lang] = clone(holder.en);
      var e = tr.strings && tr.strings[s.path];
      if (!e || e.en !== s.en || typeof e.text !== "string") { missing.push(s.path); return; }
      var rest = segs.slice(at + 1);
      if (!rest.length) holder[lang] = e.text; else { var c = holder[lang]; for (var i = 0; i < rest.length - 1; i++) c = c[rest[i]]; c[rest[rest.length - 1]] = e.text; }
    });
    if (missing.length) out._untranslated = missing;
    out.languages = (pack.languages || ["en", "hi"]).concat(out.languages && out.languages.indexOf(lang) >= 0 ? [] : [lang]).filter(function (x, i, a) { return a.indexOf(x) === i; });
    return out;
  }

  // Checks a translation file against its pack (and the pack's schema, for word limits).
  function validateTranslation(pack, tr, schema, opts) {
    opts = opts || {};
    var out = { errors: [], warnings: [] }, lang = tr.lang, L = LANGS[lang];
    if (tr.schema !== "upsc-pods/translation@1") out.errors.push("$.schema: should be upsc-pods/translation@1");
    if (!L || lang === "en") { out.errors.push("$.lang: unknown language " + lang + " (known: " + Object.keys(LANGS).join(", ") + ")"); return out; }
    if (L.inPack) out.warnings.push("$.lang: " + L.name + " is written inside the pack itself; a translation file is only needed for other languages");
    if (!tr.pack || tr.pack.id !== pack.id) out.errors.push("$.pack.id: should be " + pack.id);
    if (NO_TRANSLATION[typeKey(pack)]) out.errors.push(typeKey(pack) + " is about one language and is not translated; write a new pack in " + L.name + " instead");
    if (!tr.review || !tr.review.status) out.errors.push("$.review.status: required");
    else if (opts.generated && tr.review.status !== "draft") out.errors.push("$.review.status: generated translations start as draft");
    var want = englishStrings(pack), seen = {};
    want.forEach(function (s) {
      seen[s.path] = 1;
      var e = tr.strings && tr.strings[s.path], p = "$.strings[\"" + s.path + "\"]";
      if (!e || typeof e.text !== "string" || !e.text.trim()) { out.errors.push(p + ": missing"); return; }
      if (e.en !== s.en) { out.errors.push(p + ": the English has changed since this was translated; translate it again"); return; }
      var t = e.text;
      scriptCheck(t, s.path.replace(/\.en(?=\.|\[|$)/, "." + lang), lang, out, opts);
      var lim = limitFor(schema, s.path, lang);
      if (lim && words(t) > lim) out.errors.push(p + ": " + words(t) + " words, limit " + lim);
      if (!lim && words(t) > Math.ceil(words(s.en) * L.wordFactor * 1.5) + 3) out.warnings.push(p + ": much longer than the English; check it still fits the screen");
      (s.en.replace(/,(?=\d{3})/g, "").match(/\d+(\.\d+)?/g) || []).forEach(function (n) { if (t.replace(/,(?=\d{3})/g, "").indexOf(n) < 0) out.warnings.push(p + ": the number " + n + " from the English is missing"); });
      if (s.native && t === s.en) out.errors.push(p + ": a memory aid must be written fresh in " + L.name + ", not copied");
      if (pack.tone && pack.tone !== "LIGHT" && EMOJI.test(t)) out.errors.push(p + ": emoji only on LIGHT content");
      if (L.fixed && L.fixed.sources && s.en === "Editor's source notes" && t !== L.fixed.sources) out.errors.push(p + ": use exactly \"" + L.fixed.sources + "\"");
    });
    Object.keys(tr.strings || {}).forEach(function (k) { if (!seen[k]) out.errors.push("$.strings[\"" + k + "\"]: not an English string in the pack"); });
    // The merged pack must still pass parity and script rules.
    var merged = applyTranslation(pack, tr), h = { errors: [], warnings: [] };
    houseRules(merged, h, { key: typeKey(pack) });
    h.errors.forEach(function (e) { if (out.errors.indexOf(e) < 0 && new RegExp("\\." + lang + "\\b| " + lang + " ").test(e)) out.errors.push(e); });
    if (typeKey(pack) === "story-spine" && L.fixed && L.fixed.spineOpeners) (merged[lang] && merged[lang].spine || []).forEach(function (line, i) { if (line.indexOf(L.fixed.spineOpeners[i]) !== 0) out.errors.push("$." + lang + ".spine[" + i + "]: should start with \"" + L.fixed.spineOpeners[i] + "\""); });
    return out;
  }

  // The prompt for a translator (a person or a model). The language's style note goes in the system prompt.
  function buildTranslationPrompt(pack, lang, systemText, styleNote, schema) {
    var L = LANGS[lang], items = {};
    englishStrings(pack).forEach(function (s) { var x = { en: s.en, register: s.register }; if (s.keep) x.keepAsIs = true; var lim = limitFor(schema, s.path, lang); if (lim) x.maxWords = lim; if (s.native) x.writeFresh = true; items[s.path] = x; });
    var system = systemText.replace(/\{\{LANGUAGE\}\}/g, L.name).replace(/\{\{NATIVE\}\}/g, L.native) + "\n\n---\n\n" + styleNote;
    var user = "Piece: " + (pack.title && pack.title.en || pack.id) + " (type " + typeKey(pack) + ", tone " + (pack.tone || "NEUTRAL") + ")\n\n" +
      "Translate each string into " + L.name + ". Keys are paths; keep every key exactly.\n\n<strings>\n" + JSON.stringify(items, null, 1) + "\n</strings>\n\nReturn only a JSON object mapping each key to its " + L.name + " text.";
    var props = {}; Object.keys(items).forEach(function (k) { props[k] = { type: "string" }; });
    return { system: system, user: user, schema: { type: "object", additionalProperties: false, required: Object.keys(items), properties: props } };
  }

  // Wraps a translator's reply (path -> text) into a translation file.
  function makeTranslation(pack, lang, reply, provenance) {
    var strings = {};
    englishStrings(pack).forEach(function (s) { if (typeof reply[s.path] === "string") strings[s.path] = { en: s.en, text: reply[s.path] }; });
    return { schema: "upsc-pods/translation@1", lang: lang, pack: { id: pack.id, schema: pack.schema }, strings: strings, provenance: provenance || null,
      review: { status: "draft", checkedBy: null, checkedOn: null, note: "Needs a " + LANGS[lang].name + " editor before it is shown." } };
  }

  // ---- Prompt: shared system prompt + the type's brief + its config, then the source ----
  function buildPrompt(t, job) {
    var cfgView = clone(job.config || {}); delete cfgView.defaults; delete cfgView.anchors;
    var anchors = job.config && job.config.anchors ? "\n\nPlaces you may pin (use these ids only):\n" + Object.keys(job.config.anchors).map(function (k) { return "- " + k + ": " + (job.config.anchors[k].name || k); }).join("\n") : "";
    var system = t.system + "\n\n---\n\n# Content type: " + t.title + "\n\n" + t.brief;
    var user = "Settings for this piece:\n" + JSON.stringify(cfgView.knobs || {}, null, 2) + anchors +
      (job.notes ? "\n\nEditor's note: " + job.notes : "") +
      "\n\n<source>\n" + job.source + "\n</source>\n\nWrite the " + t.title + " from the source above. Return only the JSON.";
    return { system: system, user: user };
  }

  var api = { fillSchema: fillSchema, apiSchema: apiSchema, assemble: assemble, validate: validate, merge: merge, buildPrompt: buildPrompt, words: words,
    LANGS: LANGS, registerOf: registerOf, englishStrings: englishStrings, applyTranslation: applyTranslation, validateTranslation: validateTranslation, buildTranslationPrompt: buildTranslationPrompt, makeTranslation: makeTranslation };
  root.PodsTemplates = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
