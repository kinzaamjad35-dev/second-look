# First Kiro prompt (Specs → + → Feature → Requirements-First)

Add the three steering files first (copy `.kiro/` from this kit into your repo root — already done if you used this kit). In the **Kiro IDE**, open the `second-look` folder, Trust the workspace, click **Spec**, and paste everything between the lines:

---
Create a feature spec for **Second Look**, a privacy-careful **Expo (React Native) phone app** that revives the "read it later" idea (Pocket shut down in 2025) for screenshots.

This is a native app, not a website. After the user grants photo-library permission once, the app finds their screenshots and does the rest. A website cannot do this.

Stack (do not change unless a package is incompatible with Expo Go): Expo SDK 54, managed workflow, Expo Router, TypeScript, expo-media-library, expo-notifications, expo-sqlite, expo-image-manipulator, expo-file-system, expo-calendar, expo-linking, Jest + jest-expo + fast-check. No custom native modules — the MVP must run in Expo Go (SDK 54, the last iOS App Store Expo Go) and as an Expo web Demo for the live URL.

Must-have requirements (write each as a user story with EARS-style acceptance criteria). These are MVP — build these first:

1. Onboarding + photo permission. The first launch explains what the app does and why it needs the photo library. WHEN the user grants access, THE SYSTEM SHALL start a screenshot scan. WHEN the user denies access, THE SYSTEM SHALL show a calm empty state with a button to open system settings, plus a "Try demo" path. On iOS, if only Limited Photos access is granted and the Screenshots album is missing, THE SYSTEM SHALL explain that full access is needed and offer Demo mode.
2. Auto-import screenshots. THE SYSTEM SHALL find screenshot assets using: iOS smart "Screenshots" album and/or mediaSubtypes that include screenshot; Android album title or filename matching Screenshot / Screen Shot / similar. On every cold start (and when returning to the foreground), THE SYSTEM SHALL import only assets newer than `settings.lastScanAt`, create a ~300px thumbnail stored in the app directory, record file name, size, dimensions, takenAt, and a perceptual hash (dHash via a tiny greyscale bitmap + jpeg-js), and upsert a SQLite row. Original full-resolution files stay in the photo library (store the media-library asset id, not a second full copy). Provide a manual "pick screenshots" fallback if album detection finds nothing.
3. Rules engine (no AI): detect OTP/verification codes, dates and times (chrono-node), prices (Rs/PKR/$/£/€), URLs, phone numbers; detect near-duplicates via dHash Hamming distance ≤ 5.
4. Smart sorting, opt-in (default OFF until the user accepts a plain privacy notice). WHEN Smart sorting is on, THE SYSTEM SHALL downscale each pending shot to a JPEG no larger than 1024px on the long side at quality ~0.6, and POST batches of at most 4 items to a Vercel serverless function `/api/classify`. The function holds `GEMINI_API_KEY`, calls Gemini (`gemini-2.5-flash-lite` or `gemini-3.1-flash-lite`) with vision + a JSON response schema, does not store or log the body, and returns per item: ocrText, category (deal | event | place | recipe | receipt | note | junk), one-line reason ("why you saved this"), title, dates[], expiresAt, price, place {name, address}, urls[], confidence. WHEN the response arrives, THE SYSTEM SHALL run the redactor on ocrText BEFORE saving (mask OTPs, 13–19 digit card-like numbers, Pakistani CNIC `\d{5}-\d{7}-\d`, emails and phone numbers). Rules results override AI for OTP and duplicates. OTP items are classified as junk and are not sent again. If the API fails or quota is hit, fall back to rules-only and keep going. WHEN Smart sorting is off, no image leaves the device.
5. Instant search over OCR text, title, reason and extracted fields (SQLite FTS and/or MiniSearch).
6. "Rising soon" view: items with an upcoming date or expiry in the next 14 days, sorted by date.
7. Local notifications (`expo-notifications`): request permission when the user first enables reminders. THE SYSTEM SHALL schedule a local notification for each upcoming event/expiry (default 24 hours before, user-adjustable). THE SYSTEM SHALL also schedule a daily nudge (default 09:00 local) that summarises time-sensitive items ("3 deals end today; an event is tomorrow") or not fire if there is nothing to say. Cancel or update notifications when an item is marked done, buried, or deleted.
8. "Ask Second Look": a screen where the user types a natural-language question ("where's that flight booking?", "what was the biryani recipe?"). THE SYSTEM SHALL search saved (redacted) text and return the best matching screenshot(s) plus a short answer. If the local hits are ambiguous, it MAY call `/api/classify` or a sibling `/api/ask` with **redacted text only** (never re-send images). Typed input is required for MVP.
9. One-tap actions: Open in Google Maps (search URL, no key), copy text, open link, add to the device calendar (`expo-calendar`, with permission; on web, download an .ics with VALARM instead), mark done, bury.
10. "Buried" cleanup view: OTPs, duplicates, expired deals and user-buried items, with total size you could free. WHEN the user confirms deletion, THE SYSTEM SHALL delete the selected assets from the photo library via expo-media-library and remove the local rows. The confirmation must state how many photos will be deleted and that this cannot be undone from the app. "Delete all my data" in Settings wipes SQLite and local thumbnails only — it does not touch the camera roll.
11. Export all kept items as JSON and CSV.
12. Demo mode: a bundled set of ~30 sample screenshots with pre-computed results so judges can try Library, Search, Rising soon, Ask, and Buried without photo permission or an API key. The Expo **web** build (the live URL) SHALL default to Demo mode, with a short note that auto-import is a phone-app feature, and MAY offer a file-picker fallback.

Non-functional: works in Expo Go (SDK 54) on iOS and Android; Expo web Demo is the public live URL; light graveyard theme only (dark palette, tombstone icon, labels "Buried"/"Rising soon"); accessible contrast; usable offline after first load except Smart sorting and Ask's optional AI fallback; no `GEMINI_API_KEY` in client code or `EXPO_PUBLIC_*` vars.

Stretch (write these as user stories too, but clearly mark them STRETCH — do not put them on the critical path in tasks.md):
- Voice input for Ask Second Look. Do not add `expo-speech-recognition` to the Expo Go MVP (it is not in Expo Go and will break the project). On web, the Web Speech API is acceptable. Native voice belongs in a later EAS dev build.
- On-device OCR in an EAS dev build, after which only redacted text (not images) is sent to Gemini.
- An EAS Preview Android APK for judges.
- A media-library listener that imports a screenshot taken while the app is in the foreground.

Out of scope: accounts, server database of user content, social sharing, a general-purpose chatbot, custom native modules in the MVP, deleting photos without an explicit confirmation.

In design.md include: architecture diagram (app, SQLite, notifications, /api/classify, Gemini), data model (Shot, Settings), the /api/classify contract and JSON schema (including the downscale rules), sequence diagrams for (a) permission→scan→downscale→classify→redact→index→schedule notifications and (b) Ask, error handling (permission denied, limited photos, 429, offline), Expo web/Demo vs native behaviour, and correctness properties suitable for property-based tests with fast-check (e.g. redactor never outputs a 6-digit OTP, card-like number or CNIC; dHash of an image is a duplicate of itself and detection is symmetric; merge never lets AI override an OTP/duplicate rule; a shot marked done has no pending notification id; export→reimport of the JSON archive round-trips without data loss; downscaled payloads are JPEG and long edge ≤ 1024).

In tasks.md keep tasks small, MVP-first (stretch tasks at the end, labelled STRETCH), ordered so a runnable Expo Go app exists after the first few tasks (scaffold → permission + scan → local list), include test tasks, and include deploying the Expo web Demo to Vercel early.
---

## Follow-up prompts to use later
- "Review requirements.md against #product and remove anything not tied to a user need. Keep stretch items marked as stretch."
- "Run tasks 1–4 of the second-look spec." (then review the diff before continuing)
- "Write a Bugfix spec: Android screenshot album detection misses some devices."  ← shows judges a bugfix spec too
