---
target: photo-diagnosis flow (upload + history)
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
target_identity: "file:/home/user/crop-vision-frontend/src/pages/upload.tsx"
target_fingerprint: "sha256:d0349220ed02cd59e82ed3457aa13644f661a05c9c4b94762fb637ebdffdc493"
target_path: /home/user/crop-vision-frontend/src/pages/upload.tsx
timestamp: 2026-11-04T08-41-45Z
slug: src-pages-upload-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Progress bar tracks upload bytes only; inference wait is invisible, then "Processing complete" |
| 2 | Match System / Real World | 1 | "Predicted class", "Submit", "server web", 0–1 decimals; confidence is a bare number |
| 3 | User Control and Freedom | 2 | No retake/clear, no "check another leaf"; form stays above the result |
| 4 | Consistency and Standards | 2 | 46% vs 46.0%; raw labels in history vs catalog names in result; red badge for both Corrected and Incorrect |
| 5 | Error Prevention | 2 | No camera capture, no photo guidance, shortcut-only tag entry |
| 6 | Recognition Rather Than Recall | 2 | Tag syntax to memorise; history columns hidden off-screen |
| 7 | Flexibility and Efficiency | 2 | 13 filters at once, no quick presets |
| 8 | Aesthetic and Minimalist Design | 2 | Clean but weighted wrongly: 20px verdict, muted grey actions |
| 9 | Error Recovery | 1 | "Upload failed. Please try again." for offline, timeout and 500 alike |
| 10 | Help and Documentation | 1 | No guidance on photographing a leaf or reading confidence |
| **Total** | | **17/40** | **Poor** |

## Design Specificity Verdict
LLM: generic. Stock shadcn slate + 142 76% 36% green, card-in-page form, desktop copy ("Click to select or drag and drop", "Results powered by the CropVision API"). None of the PRODUCT.md principles are expressed.
Deterministic: CLI `impeccable detect` on upload/history/shell/ui returned 0 findings (exit 0). The browser overlay found 3 per page: low-contrast active nav (3.3:1), low-contrast primary button (3.1:1), nested-cards (upload); skipped-heading h1→h3 and a straggler (history). Measured: scrollWidth 722 at 375px (shell header); 11/12 controls on /upload and 28/28 on /history under 44px; destructive text 3.3:1 light / 1.95:1 dark.

## Priority Issues
- [P0] Low-confidence result looks confident and prescribes fungicide. 46% Early blight with Target Spot at 31% gets the same solid-green pill and treatment list as 96%. Fix: verdict tiers in words + icon; uncertain leads with retake / ask an agronomist; treatment collapsed. → shape/clarify
- [P0] Shell overflows to 722px at 375px; logout and language are off-screen. Fix: bottom tab bar + compact top bar. → adapt
- [P1] Errors are neither specific nor kind. Fix: offline / timeout / 413 / 5xx copy, photo kept, big Try again, offline banner. → harden
- [P1] History is a 7-column desktop table under 13 filters on a phone. Fix: stacked label rows, folded filters, percent inputs. → adapt/distill
- [P1] Contrast: primary button 3.1:1, active nav 3.3:1, destructive text 3.3:1 / 1.95:1 dark. Touch targets 20–40px. → colorize/adapt
- [P2] Capture not built for the field: no camera capture, no framing tips, tags shown as if required. → onboard

## Persona Red Flags
Farmer in sun on a cheap Android: muted 4.8:1 recommendations, 20px verdict, 40px Submit, "drag and drop", English-only body copy.
Agronomist: scrolls past 13 filters to reach 5 rows; decimal confidence filter vs % display; identical red badges.
First-timer: no explanation of the app or photo technique; "Tags" looks mandatory; "Results powered by the CropVision API" header.

## Minor Observations
"CropVisionUpload" brand/nav collision; result below the fold under a finished form; full-width % badge looks like a progress bar; uppercase tracked labels conflict with Amharic; dark destructive token unusable as text.

## Questions to Consider
- If the model is unsure, should the disease name lead at all?
- Is History a farmer feature, an agronomist feature, or both?
- What would this flow be as a camera app instead of a web form?
