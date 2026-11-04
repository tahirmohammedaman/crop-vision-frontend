---
version: 1
slug: "src-pages-upload-tsx"
primary_target: "src/pages/upload.tsx"
related_targets: ["src/pages/history.tsx","src/shell/app-shell.tsx"]
---

Scope: Check-a-leaf flow (upload/capture, analysing, result, errors) and History, plus app shell. Mode: Operate. Build: code-led (no image generation).
Audience/task: Ethiopian farmers and agronomists on low-end Android outdoors; photograph a leaf, understand the diagnosis and how sure it is, act; agronomists scan history. API behavior frozen.

## Direction contract
THESIS: A diagnosis is a herbarium determination label, not a percentage badge. Refuses the category default of a form card above a result card with a green % pill.
OWN-WORLD: Sheet-white ground, green-black ink, deep field-green shell and primary; verdict colours green/ochre/brick each paired with icon + word. Bordered label blocks with a 4px verdict-coloured top rule, tabular figures for % and #id, sentence-case 14px/600 labels, no caps tracking.
STORY: The farmer sees a camera-first task, an honest two-stage wait, then a verdict word ("Likely / Possible / Not sure") with one plain sentence and the next step ordered by certainty; uncertain results lead with retake / ask an agronomist.
FIRST VIEWPORT: 375px: compact green top bar; title "Check a leaf"; 4:3 photo well with three framing tips; 56px "Take photo" primary and 48px "Choose from gallery"; bottom tab bar (Check, History, Review, Catalog, Devices). Result viewport: determination label at top, leaf photo below, next-step buttons.
FORM: Herbarium specimen sheet, candidate 7 of 7 on the grounded list. seed:06931fae43608e71
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
