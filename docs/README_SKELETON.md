# 🪦 Second Look
**Your screenshots, brought back when they matter — and safely buried when they don't.**

Kiroween 2026 · Resurrection category · a phone app that revives the "read it later" idea (Pocket, shut down 2025) for screenshots.

**Live demo (web):** <VERCEL_URL> · **Expo Go (SDK 54):** <EXPO_QR_OR_LINK> · **Android APK:** <EAS_URL or "coming"> · **Demo video:** <YOUTUBE_URL> · **Licence:** MIT

## The problem
We screenshot things to remember them — a restaurant, a sale, an event, an address — then never find them again, miss the deadline, and run out of storage. <1–2 sentences + 2 evidence links from PLAN.md>

## What it does
- 📥 **Finds them for you** — grant photo access once; the app imports your Screenshots album and any new ones next time you open it.
- 🔎 **Find it** — search the text inside every screenshot, or **Ask Second Look** in plain language ("where's that flight booking?").
- ⏰ **Don't miss it** — event dates and sale/coupon expiries become local reminders, plus a daily nudge.
- 📍 **Use it** — open addresses in Maps, copy text, open links, add to your calendar.
- 🪦 **Clean up** — OTPs, duplicates and expired deals are "buried", with the storage you can free, then deleted from Photos only after you confirm.
- 📦 **Own it** — export everything as CSV/JSON; wipe the app's data in one tap (your camera roll is left alone).

## Privacy
- Original screenshots stay in your photo library. The app keeps a small thumbnail and an asset id, on device (SQLite).
- **Smart sorting is opt-in.** When it is on, a downscaled JPEG (max 1024px) is sent to Gemini via our server function so the app can read the text and sort it. Full-resolution images never leave the phone. Nothing is stored server-side.
- After text comes back, OTPs, card numbers, CNICs, emails and phone numbers are masked before anything is saved. Turn Smart sorting off and no image leaves the device.
- Note: Gemini's free tier may use content to improve Google products. The first vision pass may include sensitive pixels — we say so in the app, then redact and do not re-send those shots.
- Deleting from Photos only happens after a confirmation that says how many items will go.

## Try it
1. Open <VERCEL_URL> → **Try demo** (no photos needed), or
2. Install **Expo Go (SDK 54)** and open <EXPO_QR_OR_LINK>, grant photo access, or use Demo mode, or
3. Optional: install the Android APK.

## Run locally
```bash
git clone <REPO_URL> && cd second-look
npm install
cp .env.example .env   # add GEMINI_API_KEY for the /api/classify server only — never prefix it with EXPO_PUBLIC_
npx expo start         # scan the QR with Expo Go (SDK 54)
npm test               # unit + property-based tests
npx expo export --platform web   # static web Demo, deploy to Vercel
```

## Tech
Expo SDK 54 · Expo Router · TypeScript · expo-media-library · expo-notifications · expo-sqlite · expo-image-manipulator · Gemini 2.5 Flash-Lite (vision) · Vercel · Jest + jest-expo + fast-check

## Built with Kiro
See [KIRO_WRITEUP.md](./KIRO_WRITEUP.md) and the committed [`/.kiro`](./.kiro) folder (specs, steering, hooks).

## Limitations & next steps
<honest list: vision call is opt-in and may see sensitive pixels on the first pass; Expo Go notification limits; Android album detection varies; English first; next: on-device OCR, voice Ask, EAS store builds>

## Licence
MIT © 2026 Kinza Amjad
