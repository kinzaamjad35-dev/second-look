# Second Look

Resurrecting the "read it later" app for screenshots: AI works out why you saved each one and brings it back when it matters, with reminders, search and junk cleanup. Built with Kiro for Kiroween 2026.

## Features

### Photo Library Access
- **Onboarding screen** — plain-language explainer of what Second Look does and why it needs photo access; privacy note (originals stay in your library, only downscaled JPEGs may leave the device with Smart sorting on).
- **Permission request** — one-tap photo library access via `expo-media-library`; auto-starts screenshot scan on grant.
- **Denied state** — calm empty state with "Open Settings" (deep-links to iOS/Android settings) and "Try Demo" to explore the app without granting access.
- **iOS Limited Photos** — detects when full access is unavailable and the Screenshots album isn't accessible; explains the issue and offers settings or demo mode.

### Library
- Grid of shot cards from bundled demo data; thumbnail, title/reason placeholder, status badge.

## Tech
Expo SDK 54 · Expo Router · TypeScript strict · Expo Go compatible · SQLite · Gemini (server-side only)
