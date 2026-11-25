# Requirements — Second Look (Expo native app)

## 1. Overview

Second Look is a privacy-careful **Expo (React Native) phone app** that revives the "read it later" idea (Pocket shut down in 2025) for screenshots. After a one-time photo-library permission grant, the app finds the user's screenshots, OCRs/extracts what matters, and gives the user search, reminders, natural-language "Ask", one-tap actions and a cleanup view. A website cannot do this; this is a native app.

- **Platform:** Expo SDK 54, managed workflow, Expo Router, TypeScript. Must run in **Expo Go** (no custom native modules) and as an **Expo web Demo** for the public live URL.
- **Stack (fixed unless a package is incompatible with Expo Go):** expo-media-library, expo-notifications, expo-sqlite, expo-image-manipulator, expo-file-system, expo-calendar, expo-linking, Jest + jest-expo + fast-check.
- **Privacy posture:** originals stay in the photo library (only asset ids stored); thumbnails stay on device; with Smart sorting off, no image leaves the device; redaction runs on OCR text before anything is saved from an AI response.

EARS wording is used throughout: WHEN/WHILE/WHERE a trigger holds, THE SYSTEM SHALL produce a response.

## 2. MVP user stories and acceptance criteria

### FR-1 Onboarding + photo permission
**Story:** As a first-time user, I want to understand what the app does and why it needs my photos, so I can grant access with confidence (or try a demo).

1. On first launch, THE SYSTEM SHALL show an onboarding screen explaining the app and why photo-library access is needed.
2. WHEN the user grants access, THE SYSTEM SHALL start a screenshot scan.
3. WHEN the user denies access, THE SYSTEM SHALL show a calm empty state with a button to open system settings, plus a "Try demo" path.
4. On iOS, WHERE only Limited Photos access is granted and the Screenshots album is missing, THE SYSTEM SHALL explain that full access is needed and offer Demo mode.

### FR-2 Auto-import screenshots
**Story:** As a user, I want my screenshots found and imported automatically, so I never upload anything.

1. THE SYSTEM SHALL find screenshot assets using: the iOS smart "Screenshots" album and/or `mediaSubtypes` including screenshot; on Android, album title or filename matching Screenshot / Screen Shot / similar.
2. On every cold start and when returning to the foreground, THE SYSTEM SHALL import only assets newer than `settings.lastScanAt`.
3. WHEN an asset is imported, THE SYSTEM SHALL create a ~300px thumbnail stored in the app directory, record file name, size, dimensions, takenAt, and a 64-bit dHash perceptual hash (tiny greyscale bitmap + jpeg-js), and upsert a SQLite row.
4. THE SYSTEM SHALL store the media-library asset id, not a second full-resolution copy; originals stay in the photo library.
5. WHERE album detection finds nothing, THE SYSTEM SHALL offer a manual "pick screenshots" fallback (document picker / manual selection).

### FR-3 Rules engine (no AI)
**Story:** As a user, I want obvious things detected without any AI, so the app is useful and private even with Smart sorting off.

1. WHEN OCR/rules run, THE SYSTEM SHALL detect OTP/verification codes, dates and times (chrono-node), prices (Rs/PKR/$/£/€), URLs, and phone numbers.
2. WHERE two shots' dHash Hamming distance is ≤ 5, THE SYSTEM SHALL mark them as near-duplicates.
3. All rules modules SHALL be pure functions testable without a device.

### FR-4 Smart sorting (opt-in AI, default OFF)
**Story:** As a privacy-conscious user, I want optional AI enrichment that I knowingly enable, so nothing leaves my phone until I say so.

1. Smart sorting SHALL be default OFF until the user accepts a plain privacy notice stating exactly what is sent (a downscaled JPEG, what it is used for, that originals never leave the device).
2. WHEN Smart sorting is on, THE SYSTEM SHALL downscale each pending shot to a JPEG no larger than 1024px on the long side at quality ~0.6, and POST batches of at most 4 items to `/api/classify`.
3. The serverless function SHALL hold `GEMINI_API_KEY`, call Gemini (`gemini-2.5-flash-lite` or `gemini-3.1-flash-lite`) with vision + a JSON response schema, not store or log the body, and return per item: ocrText, category (deal | event | place | recipe | receipt | note | junk), one-line reason ("why you saved this"), title, dates[], expiresAt, price, place {name, address}, urls[], confidence.
4. WHEN a response arrives, THE SYSTEM SHALL run the redactor on ocrText BEFORE saving: mask OTPs, 13–19 digit card-like numbers, Pakistani CNIC (`\d{5}-\d{7}-\d`), emails, phone numbers.
5. Rules results SHALL override AI for OTP and duplicates; OTP items are classified as junk and are not sent again.
6. WHEN the API fails or quota is hit, THE SYSTEM SHALL fall back to rules-only and keep going.
7. WHEN Smart sorting is off, no image or text shall leave the device.

### FR-5 Instant search
**Story:** As a user, I want to find a screenshot by any word I remember.

1. WHEN the user types a query, THE SYSTEM SHALL search OCR text, title, reason and extracted fields via SQLite FTS and/or MiniSearch and return ranked results quickly (sub-second on ~1,000 shots).
2. WHERE a shot matches, THE SYSTEM SHALL show why (highlighted field/term).

### FR-6 "Rising soon" view
**Story:** As a user, I want to see what's about to expire or happen, so I don't miss it.

1. WHEN the user opens "Rising soon", THE SYSTEM SHALL list items with an upcoming date or expiry within the next 14 days, sorted by soonest first.
2. WHEN an item's date passes, THE SYSTEM SHALL move it out of the view.

### FR-7 Local notifications
**Story:** As a user, I want reminders before events and expiries, so a screenshot becomes an alarm.

1. WHEN the user first enables reminders, THE SYSTEM SHALL request notification permission (expo-notifications).
2. THE SYSTEM SHALL schedule a local notification for each upcoming event/expiry (default 24 hours before, user-adjustable).
3. THE SYSTEM SHALL schedule a daily nudge (default 09:00 local) summarising time-sensitive items ("3 deals end today; an event is tomorrow") and SHALL not fire when there is nothing to say.
4. WHEN an item is marked done, buried, or deleted, THE SYSTEM SHALL cancel or update its notifications.

### FR-8 "Ask Second Look"
**Story:** As a user, I want to ask "where's that flight booking?" in plain words, so I don't remember exact words to search.

1. WHEN the user types a question, THE SYSTEM SHALL search saved (redacted) text and return the best matching screenshot(s) plus a short answer.
2. WHERE local hits are ambiguous, THE SYSTEM MAY call `/api/classify` or a sibling `/api/ask` with **redacted text only** (never re-send images).
3. Typed input is required for MVP (voice is stretch).

### FR-9 One-tap actions
**Story:** As a user, I want to act on a shot instantly.

1. "Open in Maps" SHALL open `https://www.google.com/maps/search/?api=1&query=…` (no API key).
2. "Copy text" SHALL copy the (redacted) OCR text.
3. "Open link" SHALL open the first/selected URL.
4. "Add to calendar" SHALL use expo-calendar with permission on native; on web, download an .ics with a VALARM instead.
5. "Mark done" and "Bury" SHALL set the status immediately and update notifications.

### FR-10 "Buried" cleanup view + delete
**Story:** As a user running out of storage, I want junk listed with sizes and a real delete, so I can free space safely.

1. WHEN the user opens "Buried", THE SYSTEM SHALL list OTPs, duplicates, expired deals and user-buried items with the total size they could free.
2. WHEN the user confirms deletion, THE SYSTEM SHALL show how many photos will be deleted and state this cannot be undone from the app; on confirmation, delete the selected assets via expo-media-library and remove the local rows.
3. "Delete all my data" in Settings SHALL wipe SQLite and local thumbnails only — it SHALL NOT touch the camera roll.

### FR-11 Export
**Story:** As the owner of my data, I want full export.

1. WHEN the user exports, THE SYSTEM SHALL download all kept items as JSON and CSV.

### FR-12 Demo mode + Expo web build
**Story:** As a judge without photo permission or an API key, I want to try the whole app.

1. Demo mode SHALL bundle ~30 sample screenshots with pre-computed results, exercising Library, Search, Rising soon, Ask, and Buried with no photo permission and no API key.
2. The Expo **web** build (the public live URL) SHALL default to Demo mode, with a short note that auto-import is a phone-app feature, and MAY offer a file-picker fallback.

## 3. Non-functional requirements

- NFR-1: Runs in Expo Go (SDK 54) on iOS and Android; no custom native modules in the MVP.
- NFR-2: Expo web Demo is the public live URL (Vercel).
- NFR-3: Light graveyard theme only: dark palette, tombstone icon, labels "Buried"/"Rising soon"; accessible contrast.
- NFR-4: Usable offline after first load, except Smart sorting and Ask's optional AI fallback.
- NFR-5: No `GEMINI_API_KEY` in client code and no `EXPO_PUBLIC_*` variables for secrets.
- NFR-6: Mixed English/Roman Urdu text handled without crashes.

## 4. Stretch user stories (STRETCH — not on the critical path)

- **S-1 Voice input for Ask.** Do not add `expo-speech-recognition` to the Expo Go MVP (not in Expo Go; breaks the project). On web, the Web Speech API is acceptable. Native voice belongs in a later EAS dev build.
- **S-2 On-device OCR in an EAS dev build**, after which only redacted text (not images) is sent to Gemini.
- **S-3 An EAS Preview Android APK for judges.**
- **S-4 A media-library listener** that imports a screenshot taken while the app is in the foreground.

## 5. Out of scope

Accounts, server database of user content, social sharing, a general-purpose chatbot, custom native modules in the MVP, deleting photos without an explicit confirmation.
