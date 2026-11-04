# Design notes: the photo-diagnosis flow

Scope: **Check a leaf** (upload/capture → analysing → result) and **History**, plus the app shell they sit in.
The mode is Operate, built code-first. API calls, params, routes and navigation state are unchanged.

## Direction: the specimen sheet

A herbarium specimen sheet is how plant people have recorded "what is this leaf" for 300 years. The specimen is mounted on a white sheet. A **determination label** in the corner names it. When the botanist isn't sure, they write *cf.* (compare). When a later expert disagrees, they pin an **annotation slip** above the original label instead of erasing it.

That maps onto CropVision directly:

| Herbarium | CropVision |
|---|---|
| Mounted specimen | The farmer's own leaf photo, large |
| Determination label | The result card: disease, crop, and a plain verdict |
| *cf.* / uncertain det. | "Not sure", which leads with retake / ask an agronomist |
| Annotation slip | A reviewer's correction in History, laid over the original call |
| Accession number | The prediction `#id`, in tabular figures |

The world contributes only type, palette, density and one signature move. Layout, navigation and controls stay standard mobile web: a bottom tab bar, big buttons, native inputs and selects.

### Signature move: the determination label

One component, used everywhere a diagnosis appears. It's a bordered label block with a strong top rule, set in the verdict colour:

```
┌━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┐   ← 4px rule in verdict colour
│ ● Likely                    96%  │   ← verdict word + icon, number second
│ Early blight                     │   ← 28px, the largest text on screen
│ on Tomato                        │
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▯             │   ← meter with 60/85 tick marks
│ The model is fairly sure.        │   ← one plain sentence
└──────────────────────────────────┘
```

In History, each record uses the same label at small size. A corrected record shows the reviewer's label as an **annotation slip** above the struck-through original, which is the herbarium convention.

### Confidence, said plainly

Confidence is always a **word first**, then the number. Colour is never the only signal: every tier has its own icon and text.

| Tier | Range | Word | Sentence | Primary next step |
|---|---|---|---|---|
| Likely | ≥ 85% | **Likely** | "The model is fairly sure." | Treatment steps shown |
| Possible | 60–84% | **Possible** | "Could be this, but check the leaf against the photo below." | Compare with reference image; treatment shown with a caveat |
| Not sure | < 60% | **Not sure** | "The model can't tell yet. Don't treat on this alone." | **Retake photo** + **ask an agronomist**; treatment collapsed behind "If confirmed…" |

- Healthy classes get a "Looks healthy" verdict with a reassurance sentence and no treatment block.
- When the runner-up is within 20 points, say so: "Could also be **Target Spot** (31%)."
- These thresholds are a **client display choice only**. The server's review-queue threshold is unknown, so the UI never claims a record was queued.

### Palette: field green on sheet white

Scene: a farmer at midday in direct sun, holding a cheap Android with brightness capped. That forces a **light default**: bright sheet-white ground and near-black ink. Dark mode stays available for agronomists working at night.

- **Ground:** sheet white, very slightly green-tinted (`150 20% 98%`). Cards are pure white with a 1px rule; no ghost shadows.
- **Ink:** green-black (`160 30% 8%`). Secondary text uses `160 12% 30%` (7.5:1 measured). The old slate muted grey was 4.76:1 and is gone from this flow.
- **Brand:** deep field green (`152 62% 24%`) for the shell, primary buttons and the active tab. White text on it is 7.25:1 measured (the old green button was 3.1:1). The green is kept as the brand commitment; it's now darker and does real work, colouring the header and the primary action.
- **Verdict colours:** Likely `152 62% 24%` (green), Possible `34 90% 28%` (ochre, 6.6:1 on white), Not sure `4 72% 40%` (brick red, 6.7:1). On their tinted chip fills the lowest measured value is 5.8:1. Each tier pairs with its own icon: check-circle, help-circle, alert-triangle.

### Type

- **System workhorse stack.** It's offline-safe and loads no web font over 2G. `"Noto Sans Ethiopic"` / `"Nyala"` sit early in the stack, so Amharic renders in a real Ge'ez face on Android and Windows.
- **No all-caps tracked labels.** They break in Amharic. Labels are sentence-case at 14px/600.
- **Scale:**
  - Verdict disease name 28px/700.
  - Page titles 24px/700.
  - Body 16px. Never below 14px for anything a farmer needs.
- **Figures:** percentages and `#id` use `tabular-nums`.

### Touch and density

- Primary actions are **56px tall**, full-width on mobile. Secondary actions are 48px.
- Bottom tab bar items are 64px tall, with icon and label.
- 8px rhythm. More space above a heading than below it.
- Focus rings are 3px, in brand green with an offset. Text selection is tinted green.

## Surfaces

### 1. Check a leaf (upload/capture)

The first viewport is the task itself, not a form card:

1. Title "Check a leaf", with one line of guidance.
2. A large **photo well** (4:3). When empty, it shows three framing tips with icons: one leaf, fill the frame / daylight, no harsh shadow / hold steady.
3. **Take photo** (56px, primary, `capture="environment"` opens the rear camera on phones) and **Choose from gallery** (48px, outline). Drag and drop still works on desktop, and now actually has drop handlers.
4. Once a photo is chosen, the well shows it, with "Change photo" and a filename/size line. A **Check this leaf** button becomes the single primary action.
5. Tags move behind "Add a note / tags (optional)", a disclosure with the same tag behavior inside. Enter or comma adds a tag; there's also a visible **Add** button, so no shortcut needs memorising.

### 2. Analysing (loading during inference)

Two honest stages with a live region:

- **Sending photo… 42%**: the real `onUploadProgress` value.
- **Checking the leaf…**: once upload reaches 100% and we're waiting for the model. A thin band sweeps over the photo; with `prefers-reduced-motion` it's a static tint and the text alone carries the state.
- After 15 seconds: "Slow connection. Still working, keep this screen open."
- Controls are disabled while busy, but the photo stays visible so the user knows what is being checked.

### 3. Result

The result **replaces** the form instead of stacking under it, so the verdict is above the fold. Reading order:

1. The determination label (verdict word, disease, crop, meter, sentence).
2. The leaf photo, with the catalog reference image beside it as a "Compare with a typical case" thumbnail when the catalog has one.
3. **Next steps**, ordered by tier:
   - *Likely:* "What to do" first.
   - *Not sure:* "Retake photo" (primary) and "Ask an agronomist to check" (explains the Review page) first, with "If it is confirmed" treatment collapsed.
4. "What this is" description, and "Other possibilities", each with a mini meter and word.
5. Footer actions: **Check another leaf** (primary) and **See in history**.

### 4. Errors (offline-tolerant)

Every failure says **what happened, that the photo is kept, and what to do**. Each has a big **Try again** button, and the file is never cleared.

- **Offline** (`navigator.onLine === false` or no response): "No connection. Your photo is still here. Move to where you have signal and tap Try again."
- **Timeout:** "The connection is too slow."
- **413:** "Photo is too large, choose a smaller one."
- **5xx:** "The server had a problem", with the server's detail shown as a secondary line.
- **4xx:** the server's detail.
- A shell-level **offline banner** appears when the browser reports offline: "You're offline. You can still browse the disease catalog."

### 5. History

- Records render as **stacked label rows** (photo-less; the image is a separate authenticated fetch per item, so the list doesn't fire N blob requests on 2G). Each row has: verdict word + icon, disease name (catalog name, falling back to the formatted label), crop, date, origin in plain words ("Phone/web", "Field device", "Device, offline"), and review status as a word chip (Confirmed / Corrected / Marked wrong / Not reviewed yet).
- A correction shows as an annotation slip: "Corrected to **Septoria leaf spot**", with the original struck through.
- **Filters** sit behind a "Filters" button that shows an active count and opens an inline panel. Search stays always visible. Confidence filters are entered as **percent** and converted to the same 0–1 values the API received before. Every filter key and param is the same.
- **Empty:** a real empty state with **Check a leaf** as its action. A no-match result offers "Clear filters" instead.
- **Error:** a plain sentence with **Try again** that re-runs the same query.
- **Pagination:** 48px Previous/Next, with "11–20 of 23".

### 6. Shell

- Mobile: a compact top bar (logo, language, a menu holding theme, greeting and logout) plus a **bottom tab bar**: Check · History · Review · Catalog · Devices.
- `sm`+: the same top nav laid out inline. Bottom bar hidden.
- Fixes the 722px horizontal overflow at 375px.

## Before → after summary

| Before | After |
|---|---|
| "Upload image / Choose a plant image and optionally add tags" form card | "Check a leaf" with camera-first capture and framing tips |
| One progress bar ("Uploading… 1%" during inference, then "Processing complete") | Two honest stages: Sending x% → Checking the leaf…, plus a slow-network notice |
| `Badge` with "46%" in solid green: looks like success | "Not sure" label in brick red with icon and sentence; treatment collapsed; retake/agronomist first |
| "Upload failed. Please try again." for everything | Cause-specific messages, photo kept, big Try again, offline banner |
| 7-column table, scrolled sideways on a phone; 13 filters above it | Label rows with verdict and status in words; filters folded; percent inputs |
| Nav overflows to 722px at 375px | Bottom tab bar, 375px-clean |
| Muted text 4.76:1; primary button 3.1:1; dark error text 1.95:1 | Lowest measured text 5.8:1 (verdict chip with icon); body ≥ 7.25:1 in both themes |

## Out of scope / follow-ups

- Amharic strings for the new flow copy. The current i18n only covers nav and actions, so the new copy is English and ready to move into `translations/`.
- A real offline queue (service worker + IndexedDB) to submit later.
- The detail, review, devices and catalog pages inherit the new tokens but weren't redesigned.
- Pre-existing: `src/lib/api.ts` and `src/store/auth.tsx` default to *different* token storage keys when `VITE_TOKEN_STORAGE_KEY` is unset (`cropvision.token` vs `phm.token`). Left unchanged, since behavior is frozen.
