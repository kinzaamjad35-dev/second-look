# Tasks — Second Look (Expo MVP)

Ordered MVP-first: a runnable Expo Go app exists after tasks 1–3; the web Demo deploys by task 5. Stretch tasks at the end.

## Phase 1 — Scaffold + runnable app

- [x] 1. **Scaffold Expo app.** `npx create-expo-app@latest` with Expo SDK 58, managed workflow, TypeScript strict, Expo Router, dark graveyard theme tokens (colors, tombstone icon). Verify it opens in Expo Go on iOS and Android.
- [x] 2. **Set up testing + structure.** Jest + jest-expo + fast-check; folder structure (app routes, features/{rules,privacy,classify,notifications,actions,export}, db, demo data); ESLint/Prettier. Add a smoke test that renders the home screen.
- [x] 3. **Static Library screen with demo data.** Grid of shot cards from a bundled ~10-shot JSON fixture; ShotCard with thumbnail, title/reason placeholder, status. Runnable Expo Go app at this point.

## Phase 2 — Permission, scan, local list

- [x] 4. **Onboarding + photo permission flow** (FR-1): explainer screen, permission request, denied-state (settings button + "Try demo"), iOS Limited-Photos explanation. Unit-test the permission-state reducer.
- [x] 5. **Screenshot scan + auto-import** (FR-2): iOS Screenshots album / mediaSubtypes; Android album/filename match; incremental via `settings.lastScanAt`; re-scan on foreground return; ~300px thumbnail via expo-image-manipulator; asset-id upsert into SQLite.
- [ ] 6. **dHash + duplicates** (FR-2.4, FR-3.2): tiny greyscale bitmap + jpeg-js → 64-bit dHash; Hamming ≤ 5 near-duplicate marking; pure module + property tests (self-duplicate, symmetric).
- [ ] 7. **Import fallback + error states**: manual "pick screenshots" picker when album detection finds nothing; per-file error surfacing.
- [ ] 8. **Library screen reads real SQLite data** with thumbnails, grouping by category, pull-to-refresh, empty state.

## Phase 3 — Rules, redaction, search

- [ ] 9. **Rules engine** (FR-3): pure extractors — OTP, dates (chrono-node), prices (Rs/PKR/$/£/€), URLs, phones. Property tests: purity/totality.
- [ ] 10. **Redactor** (FR-4.4): mask OTPs, 13–19 digit card-likes, CNIC, emails, phones. Property tests: no unmasked 6-digit OTP / card / CNIC in output; idempotent.
- [ ] 11. **Search** (FR-5): SQLite FTS5 (or MiniSearch) over ocrText, title, reason, extracted fields; ranked results with match highlighting. Search screen + tests.

## Phase 4 — Smart sorting (opt-in)

- [ ] 12. **`/api/classify` Vercel function**: Zod validation, GEMINI_API_KEY server-env only, Gemini vision + JSON response schema, batch ≤ 4, no storage/logging; 400/413/429/500 handling. **Deploy the API to Vercel in this task.**
- [ ] 13. **Client: Smart sorting opt-in + privacy notice** (FR-4.1): default OFF, plain notice, settings toggle; downscale ≤1024px q0.6; batch ≤ 4 of pending non-OTP/non-dup shots.
- [ ] 14. **Merge + redact pipeline** (FR-4.4–4.5): redact ocrText before save; rules override AI for OTP/duplicates; OTP items → junk and never re-sent; API-failure fallback to rules-only. Property tests for merge.
- [ ] 15. **Deploy Expo web build to Vercel** as the live URL (task moved up so the public link exists early); web defaults to Demo mode with the auto-import note.

## Phase 5 — Rising soon, notifications, Ask, actions

- [ ] 16. **"Rising soon" view** (FR-6): next-14-days items sorted by date; auto-expiry handling.
- [ ] 17. **Local notifications** (FR-7): permission on first enable, 24h-adjustable event/expiry reminders, 09:00 daily nudge with summary-or-silent, cancel/update on done/bury/delete. Property test: done shots have no pending notification ids.
- [ ] 18. **One-tap actions** (FR-9): Maps deep link, copy redacted text, open link, calendar (expo-calendar native / .ics+VALARM web, with permission fallbacks), mark done, bury. .ics property test (parses; DTSTART before trigger).
- [ ] 19. **"Ask Second Look"** (FR-8): typed question, local ranked search over redacted text, short answer, ambiguous→`/api/ask` redacted-text fallback (implement `/api/ask` too, same server rules).

## Phase 6 — Cleanup, export, demo, polish

- [ ] 20. **"Buried" cleanup view** (FR-10): OTPs, duplicates, expired, buried; total size; deletion via expo-media-library with count + irreversibility confirmation; local row removal.
- [ ] 21. **Settings: "Delete all my data"** (SQLite + thumbnails only), notification preferences, Smart sorting toggle. Property test: delete wipes shots/FTS but not photo library.
- [ ] 22. **Export** (FR-11): JSON and CSV of kept items. Property test: JSON round-trips losslessly.
- [ ] 23. **Demo mode** (FR-12): ~30 bundled sample screenshots with pre-computed results wired through Library, Search, Rising soon, Ask, Buried; entered from onboarding-denied state and Settings; clearly labeled, exitable.
- [ ] 24. **Accessibility + theme pass**: contrast AA, labels, focus order, keyboard/switch support; graveyard labels only ("Buried"/"Rising soon").
- [ ] 25. **Offline check**: verify app is usable offline after first load except Smart sorting and Ask AI fallback.
- [ ] 26. **End-to-end smoke on device**: full flow in Expo Go on iOS and Android; fix what breaks.

## Phase 7 — Test hardening + release

- [ ] 27. **Property-test sweep**: all modules listed in design.md §7 running in CI (`npm test`), plus component tests for Library, Rising soon, Buried.
- [ ] 28. **Final Vercel deploy**: API + Expo web Demo live URLs in README; demo-mode instructions for judges.

## STRETCH (not on the critical path)

- [ ] S1. **STRETCH — Voice input for Ask on web** via Web Speech API only (no expo-speech-recognition in Expo Go).
- [ ] S2. **STRETCH — On-device OCR in an EAS dev build**, then send only redacted text to Gemini.
- [ ] S3. **STRETCH — EAS Preview Android APK** for judges.
- [ ] S4. **STRETCH — Media-library listener** importing screenshots taken while the app is foregrounded.
