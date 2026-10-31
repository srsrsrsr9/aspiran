# Applies the Prep content hooks to app.js and strings.js. Run: python3 patch_app.py <public/app dir>
import sys, re
d = sys.argv[1]
def sub(s, old, new, name):
    n = s.count(old)
    if n != 1: raise SystemExit(f"anchor {name}: found {n} times")
    return s.replace(old, new)
p = d + "/app.js"; s = open(p, encoding="utf-8").read()
if "./explore.js" in s: raise SystemExit("already patched")
s = sub(s, 'import * as M from "./metrics.js";\n', 'import * as M from "./metrics.js";\nimport * as X from "./explore.js";\n', "import")
s = sub(s, '["read", "nav.read"], ["focus", "nav.focus"]', '["read", "nav.read"], ["learn", "nav.learn"], ["focus", "nav.focus"]', "prep tabs")
s = sub(s, 'plan: "prep", routine: "prep", roadmap: "prep",\n', 'plan: "prep", routine: "prep", roadmap: "prep",\n  learn: "prep", upgrade: "prep", ptest: "prep", pcompile: "prep", insights: "prep", revise: "prep",\n', "tab_of")
s = sub(s, 'const PREP_OF = { prelims: "practice", mains: "practice", ', 'const PREP_OF = { ptest: "practice", pcompile: "practice", insights: "practice", revise: "practice", upgrade: "practice", prelims: "practice", mains: "practice", ', "prep_of")
s = sub(s, '  mock: viewMock, read: viewRead, focus: viewFocus,', '  learn: X.viewLearn, upgrade: X.viewUpgrade, ptest: X.viewWeeklyTest, pcompile: X.viewCompilation, insights: X.viewInsights, revise: X.viewRevise,\n  mock: viewMock, read: viewRead, focus: viewFocus,', "views")
# Practice: Learn and play and the Plus tools.
s = sub(s, '''h("a.btn", { href: "#read/saved" }, "Read"))));\n}\n\nfunction viewPrelims''', '''h("a.btn", { href: "#read/saved" }, "Read"))),
    h("a.card.link", { href: "#learn" }, h("div.row.between", h("div", h("strong", "Learn and play"), h("div.small.muted", `${(data.library?.items ?? []).filter((i) => i.data?.play).length} flashcard decks, matches, timelines, quizzes and answer skeletons. Free.`)), h("span", "→"))),
    h("h2", "Go deeper"), X.toolsStrip(),
    plusOn() && !paused() && !resultMode() && h("p.small", h("a", { href: "#upgrade" }, "What Plus adds →")));
}

function viewPrelims''', "practice")
# Mock allowance used: point at what Plus adds.
s = sub(s, '''h("p", "The quick mock is always free, and your allowance comes back next month."), h("div.row", h("button", { onclick: () => d.close() }, "OK"))); return; }''',
 '''h("p", "The quick mock is always free, and your allowance comes back next month."), h("div.row", h("button", { onclick: () => d.close() }, "OK"), h("a.btn", { href: "#upgrade", onclick: () => d.close() }, "What Plus adds"))); return; }''', "mock allowance")
# A Plus card's "See Plus" opens the upgrade screen with its taste first.
s = sub(s, 'if (action === "accepted") location.hash = "#plus"; else box.remove();', 'if (action === "accepted") location.hash = "#upgrade"; else box.remove();', "plus card")
s = sub(s, 'plusOn() && link("#plus", "Plus (test mode)", "Everything in the Adda, Pod and Chotu stays free"),',
 'plusOn() && link("#plus", "Plus (test mode)", "Everything in the Adda, Pod and Chotu stays free"),\n    plusOn() && link("#upgrade", "What is inside Plus", "Try a mock, the weekly test and insights before deciding"),', "me link")
# Hand the helpers over once, before the first render.
s = sub(s, '\nconst VIEWS = {', '\nX.init({ h, put, store, bi, lang, data, libraryOf, post, getJson, toast, plusOn, profile, paused, resultMode, careRecently, mcqBlock, mcqOf, addMiss, shuffle, today, addDays, render: () => render() });\n\nconst VIEWS = {', "init")
open(p, "w", encoding="utf-8").write(s)
p = d + "/strings.js"; s = open(p, encoding="utf-8").read()
s = sub(s, '"nav.read": "Read", "nav.focus": "Focus",', '"nav.read": "Read", "nav.learn": "Learn", "nav.focus": "Focus",', "en")
s = sub(s, '"nav.read": "पढ़ें", "nav.focus": "फ़ोकस",', '"nav.read": "पढ़ें", "nav.learn": "सीखें", "nav.focus": "फ़ोकस",', "hi")
s = sub(s, '"nav.read": "చదవండి", "nav.focus": "ఫోకస్",', '"nav.read": "చదవండి", "nav.learn": "నేర్చుకోండి", "nav.focus": "ఫోకస్",', "te")
open(p, "w", encoding="utf-8").write(s)
print("patched")
