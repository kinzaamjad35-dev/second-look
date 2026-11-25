---
inclusion: always
---
# Tech stack

- **App:** Expo SDK 54, managed workflow, Expo Router, TypeScript (strict). Must run in **Expo Go** (no custom native modules). Functional components and hooks only.
- **Photo access:** `expo-media-library` — Screenshots album / `mediaSubtypes` on iOS; album title / filename match on Android.
- **Image processing:** `expo-image-manipulator` (thumbnails ~300px; downscale ≤1024px for Smart sorting), `expo-file-system` (sandbox paths), `jpeg-js` (dHash greyscale bitmap).
- **Storage:** `expo-sqlite` — `shots` table + FTS5 virtual table; `settings` singleton row.
- **Notifications:** `expo-notifications` — per-item event/expiry reminders (default 24h before) + daily 09:00 nudge.
- **Calendar / actions:** `expo-calendar` on native; RFC 5545 `.ics` with VALARM on web. `expo-linking` for Maps / URL open. Maps: `https://www.google.com/maps/search/?api=1&query=`.
- **Search:** SQLite FTS5 and/or MiniSearch (fuzzy, prefix) over ocrText, title, reason, place, price, urls.
- **Dates:** `chrono-node` for parsing; `date-fns` for formatting. Store ISO 8601; display in user timezone.
- **Duplicates:** 64-bit dHash on a tiny greyscale bitmap; near-duplicate = Hamming distance ≤ 5.
- **AI:** Gemini (`gemini-2.5-flash-lite` or `gemini-3.1-flash-lite`) called **only** from `/api/classify` (Vercel serverless function). Vision input; structured JSON output with a response schema. Batch ≤ 4 downscaled JPEGs. No AI call when Smart sorting is off.
- **Ask:** `/api/ask` serverless function; receives **redacted text only**, never images.
- **Secrets:** `GEMINI_API_KEY` lives in Vercel env vars and `.env.local` (gitignored). Never in client code. Never in `EXPO_PUBLIC_*` vars. Never logged.
- **Testing:** Jest + jest-expo + fast-check (property tests for pure modules: redact, rules, dHash, merge, export, ics, payload). Testing Library for key screens.
- **Quality:** ESLint + Prettier; no `any` without a comment explaining why.
- **Hosting:** Vercel Hobby (free) for API + Expo web Demo. Expo web build is the public live URL.
- **Constraints:** MVP must run in Expo Go. No `expo-speech-recognition` or other packages absent from Expo Go in the MVP. App must remain useful when AI is unavailable (rules-only mode).
