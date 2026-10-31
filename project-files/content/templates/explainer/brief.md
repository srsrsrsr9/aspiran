# Ek Minute explainer

Schema: `upsc-pods/explainer@1` · Folder: `content/explainers/` · Family: Watch

**Exam:** revision · papers: prelims-gs1, mains-gs2 · formats: mains-answer

**Sound:** Tanpura bed under the scenes, chai motif on the end card.

**Motion:** Scenes cross-fade at 300 ms; the bill slides between actors.

## How to fill it

A one-minute animated explainer built on a fixed recipe. You write only the words; the recipe sets the drawing and timing.
Recipe "four-options": an item (a bill, a petition, a file) goes from a first actor to a second actor, who can do one of four things.
- title: "Ek Minute · <static link>" style, 8 words or fewer.
- elements.legislature.label: the first actor. elements.governor.label: the deciding actor. elements.bill.label: the item.
- elements.tiles: exactly four options, in the order the scenes reveal them. label is 1 or 2 words, sub is 4 words or fewer (or null).
- scenes: exactly seven captions, each 30 words or fewer, spoken in under the scene's seconds (6, 6, 6, 5, 10, 10, 5).
  Scene 1 sets up, scene 2 says there are four options, scenes 3 to 6 explain one option each, scene 7 sums up.
- endCard.title is the static link; endCard.subtitle is 5 words or fewer.
Use only provisions named in the source.
