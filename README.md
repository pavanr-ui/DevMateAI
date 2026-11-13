# DevMate AI

> Your AI-Powered Development Companion

Vue 3 + Vite + Ionic Vue + Tailwind CSS 4, with a Firebase backend (Auth, Firestore,
Cloud Functions) and Google Gemini accessed only through backend functions.
Runs on desktop web, mobile web, Android and iOS (Capacitor, added in Phase 9).

## Requirements

- Node.js **22.12+** (project uses 22.23.3, see `.nvmrc`): `nvm use 22.23.3`
- Java 21 (for the Firebase emulators and Android builds)

## Getting started

```bash
npm install
npm --prefix functions install
npm run emulators      # terminal 1: Firebase emulators, UI on http://localhost:4000
npm run seed           # terminal 3 (once): demo account + sample dashboard data
npm run dev            # terminal 2: web app on http://localhost:5173
```

The emulators use the offline `demo-devmate-ai` project, so no Firebase login is
needed. In development, the app talks to the emulators automatically when no real
Firebase config is set. Create test accounts on the sign-up page; they exist only
in the emulator (see the Auth tab at http://localhost:4000).

**Emulator data is kept between restarts.** Stop the emulators with `Ctrl+C` and
wait for "Export complete"; data is saved to `emulator-data/` (git-ignored) and
loaded on the next `npm run emulators`. Delete that folder, or run
`npm run emulators:fresh`, for a clean start.

**Demo data:** `npm run seed` creates a demo account (credentials are in
[`scripts/seed-emulator.js`](scripts/seed-emulator.js)) with 14 days of usage,
activity and projects. To add the same sample data to your own emulator account:
`npm run seed -- --email you@example.com`.

To use a real Firebase project later, copy `.env.example` to `.env.local` and fill
in the web app config.

## Scripts

| Command                       | What it does                                      |
| ----------------------------- | ------------------------------------------------- |
| `npm run dev`                 | Start the dev server                              |
| `npm run build`               | Production build into `dist/`                     |
| `npm test`                    | Frontend unit/component tests                     |
| `npm --prefix functions test` | Backend function tests                            |
| `npm run test:rules`          | Firestore rules tests (starts its own emulator)   |
| `npm run test:rules:running`  | Same, when `npm run emulators` is already running |
| `npm run lint`                | ESLint                                            |
| `npm run format`              | Prettier (auto-format)                            |
| `npm run emulators`           | Firebase emulators, data kept between restarts    |
| `npm run emulators:fresh`     | Firebase emulators, empty, nothing saved          |
| `npm run seed`                | Demo account + sample dashboard data (emulator)   |

See [docs/data-model.md](docs/data-model.md) for the Firestore structure.

## Security rules of thumb

- Only **public** Firebase config goes in `.env.local` (`VITE_*` values are visible in the browser).
- API keys (Gemini, GitHub App) live **only** in Cloud Functions secrets.
- Firestore rules are deny-by-default.
