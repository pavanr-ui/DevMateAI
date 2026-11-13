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
cp .env.example .env.local
npm run dev            # web app on http://localhost:5173
npm run emulators      # Firebase emulators, UI on http://localhost:4000
```

The emulators use the offline `demo-devmate-ai` project, so no Firebase login is needed.

## Scripts

| Command                       | What it does                      |
| ----------------------------- | --------------------------------- |
| `npm run dev`                 | Start the dev server              |
| `npm run build`               | Production build into `dist/`     |
| `npm test`                    | Frontend unit/component tests     |
| `npm --prefix functions test` | Backend function tests            |
| `npm run lint`                | ESLint                            |
| `npm run format`              | Prettier (auto-format)            |
| `npm run emulators`           | Firebase Auth/Firestore/Functions |

## Security rules of thumb

- Only **public** Firebase config goes in `.env.local` (`VITE_*` values are visible in the browser).
- API keys (Gemini, GitHub App) live **only** in Cloud Functions secrets.
- Firestore rules are deny-by-default.
