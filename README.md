# CropVision — Web Client

**Frontend client** for **CropVision**, a plant disease detection platform. Upload a leaf photo, get an instant diagnosis, review the model's history, and manage a fleet of camera-equipped **edge devices** (Raspberry Pi and similar hardware) submitting predictions from the field.

🔗 Backend API: [crop-vision-backend](https://github.com/tahirmohammedaman/crop-vision-backend)

## Features

- **Predict** — drag-and-drop or capture a leaf image and get a crop + disease classification with a confidence breakdown across all classes.
- **History** — a searchable, filterable log of every prediction (crop, disease, tags, confidence range, date range, source), whether it came from the web app or an edge device.
- **Review queue** — surfaces low-confidence predictions for a human to confirm or correct, closing the feedback loop with the model.
- **Stats dashboard** — running accuracy computed from confirmed/corrected predictions.
- **Disease catalog** — a browsable, searchable encyclopedia of the 38 crop/disease classes the model recognizes, grouped by host plant with reference imagery.
- **Model info** — inspect metadata about the currently deployed model.
- **Auth** — login/register against the FastAPI backend, JWT persisted client-side with automatic redirect-to-login on expiry.
- **Internationalization** — English/Amharic language switcher.

## Edge device management

A dedicated **Devices** page treats Raspberry Pi (and similar) hardware as managed fleet assets rather than an afterthought:

- Register a new edge device and receive a scoped API key for it to authenticate with.
- Live status per device — online/offline derived from last-seen heartbeat, with CPU load, memory, disk usage, uptime, CPU temperature, and camera availability rendered from the telemetry the device reports.
- Copy/rotate device credentials, tag and locate devices, and deactivate hardware that's been retired.
- Every prediction in **History** is labeled with its origin (web upload, server-assisted edge capture, or fully offline on-device inference) and links back to the device that produced it — so field hardware and the web UI share one unified data view.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript, built with Vite |
| Styling | Tailwind CSS + shadcn/ui component patterns, Radix primitives |
| Data fetching | TanStack Query + Axios |
| Forms & validation | React Hook Form + Zod |
| Routing | React Router |
| i18n | Custom translation provider (English / Amharic) |
| Infra | Docker + nginx, ESLint, TypeScript strict mode |

## Getting started

```bash
pnpm install
cp .env.example .env    # set VITE_API_BASE_URL to point at crop-vision-backend
pnpm dev
```

```bash
pnpm build      # typecheck + production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript project references
```

Or with Docker (served via nginx):

```bash
docker build -t crop-vision-frontend .
docker run -p 8080:80 crop-vision-frontend
```

## Pages

Landing · Login / Register · Predict (Upload) · History · Review Queue · Stats · Disease Catalog · **Devices** · Model Info · Profile
