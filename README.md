# Plant Health Monitoring – Web Client

A React + TypeScript + Tailwind + shadcn/ui frontend for a Plant Health Monitoring backend.

## Tech stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-style components
- React Router
- TanStack Query
- Axios
- Zod + React Hook Form

## Setup
1. Copy environment file:
   - Duplicate `.env.example` to `.env` and adjust values.
2. Install dependencies and start dev server.

## Scripts
- dev: start dev server
- build: typecheck and production build
- preview: preview built app
- lint: run ESLint
- typecheck: run TypeScript

## Environment
- `VITE_API_BASE_URL` – base URL to backend
- `VITE_TOKEN_STORAGE_KEY` – storage key for tokens (default `phm.token`)

## Pages
- Landing, Login, Register, Upload, History, Stats, Review Queue, Catalog, Model Info, Profile

## Notes
- Auth is persisted via localStorage token; 401 clears token and redirects user to login on next navigation.