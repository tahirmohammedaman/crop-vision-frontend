# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Ethiopian smallholder farmers.** They photograph a sick leaf in the field and want to know what it is and what to do next. They often use low-end Android phones, in bright sun, with gloves or dirty hands and patchy connectivity. Amharic and English both matter.
- **Agronomists and extension workers.** They diagnose for farmers, check past calls in History, and confirm or correct low-confidence predictions in the Review queue. Also mostly on mobile in the field, and sometimes on a laptop.

## Product Purpose

CropVision classifies a leaf photo into one of 38 crop/disease classes and shows what that diagnosis means, how sure the model is, and what to do. Success means a farmer acts on a correct diagnosis quickly, and an uncertain diagnosis is retaken or checked by a person instead of being trusted blindly.

## Positioning

It closes the loop in one system: web predictions, Raspberry Pi edge devices and offline device predictions all land in one history, and a human review queue confirms or corrects the model's uncertain calls.

## Operating Context

- Main field flow: capture or choose a leaf photo → upload (`POST /v1/predict`) → result → later look-up in History (`/v1/history`) → detail.
- Prediction origins: `server_web`, `server_edge`, `device_offline`.
- Reviewers use `/review` to confirm or correct predictions. The low-confidence threshold for the queue is set **on the server**; the client does not know it.
- The disease catalog (description, recommendations, symptoms, severity, reference images) is bundled locally in `catalog-data/`, so it works without a network.

## Capabilities and Constraints

- React 18 + Vite + Tailwind + shadcn-style primitives; Radix; lucide icons; sonner toasts.
- API contracts in `src/lib/api.ts` and `src/types/dto.ts` are fixed. UI work must not change requests, params, or behavior.
- i18n: `src/translations/{en,am}.ts`, currently covering nav, actions and common strings only.
- Light and dark themes via the `.dark` class.
- Open: no service worker/PWA; offline queuing of uploads doesn't exist. The client can only *detect* offline and explain it.

## Brand Commitments

- Name: **CropVision**.
- Keep a **green-led theme**. The exact palette and design treatment are free to change.

## Evidence on Hand

- Validation accuracy claim of 99.2% (README). Use only where it already appears; do not invent other metrics.
- 38 reference leaf images and a disease catalog JSON in `catalog-data/`.
- Screenshots of the current UI in `docs/screenshots/`.
- No testimonials, user counts or field-trial results exist. Do not fabricate them.

## Product Principles

1. **Say how sure, in words.** Confidence is shown as a plain-language verdict with an action, not just a percentage.
2. **Uncertainty leads to action.** Low confidence means: retake the photo, or have an agronomist check it.
3. **The field is the test bench.** Sunlight, one hand, slow networks and small cheap screens set the bar.
4. **Fail loudly and kindly.** Every network failure says what happened, what was kept, and what to try next.

## Accessibility & Inclusion

- Outdoor legibility: body text should comfortably exceed WCAG AA (aim for about 7:1 for primary text). Never rely on color alone for status.
- Touch targets of at least 48px for primary actions, with generous spacing.
- Amharic (Ge'ez script) must render well. Leave room for longer strings and avoid all-caps tracking tricks on localized text.
