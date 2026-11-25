# Second Look — Build Plan (Kiroween 2026, Resurrection category)

> Reviving the dead "read it later" app (Pocket shut down July 2025 — https://www.theverge.com/news/672924/mozilla-pocket-fakespot-shutting-down) for the thing people actually save today: **screenshots**.
> This is a **native phone app** (Expo / React Native). A website cannot see the photo library; an app can, after one permission.
> Target submit: **Thu 3 Dec 2026**. Official deadline: **Sat 5 Dec, 3:00 AM PKT**.

## 1. The problem (evidence)
- People screenshot things "for later", can't find them, and storage fills up:
  - "4,500+ screenshots on my phone and I can never find anything" — https://www.reddit.com/r/SideProject/comments/1xecc8i/
  - "Hundreds of screenshots they can never find again… restaurants, products, receipts, events" — https://www.reddit.com/r/apps/comments/1wh8sp3/
  - "Phone storage keeps running out due to screenshots… I rarely ever use one, but what if I need it one day?" — https://www.reddit.com/r/OCD/comments/1vq0zuv/
  - 34% keep screenshots "just in case" and never open them — https://www.compareandrecycle.co.uk/blog/digital-declutter-statistics
  - Fewer than 20% of 40 interviewees looked back more than rarely — https://www.brendanlangen.com/thoughts/2021/8/22/we-deserve-better-screenshots
  - 2,000 screenshots ≈ 1–4 GB; OTPs, expired coupons, duplicates are safe to delete — https://getsnapsweep.app/guides/should-i-delete-screenshots
- What exists: gallery text search (Apple/Google Photos) finds words, but nothing tells you **the sale ends Friday**, **the event is tomorrow**, or **these 300 are junk**. Pixel Screenshots is Pixel-only (https://support.google.com/pixelphone/answer/15312581?hl=en).
- Honest competition note: several indie screenshot-search apps exist. Our difference = *auto-import + deadlines + actions + cleanup + "Ask Second Look"*, in a privacy-careful phone app.

## 2. MVP scope — every feature tied to a real need

### Must-have (build these, nothing else until they work)
| # | Feature | Real need it solves | Evidence |
|---|---|---|---|
| 1 | **Permission once, then auto-import** (`expo-media-library`). Find the Screenshots album (iOS: smart album / `mediaSubtypes` includes screenshot; Android: album title or filename matching Screenshot/Screen Shot). On each launch, import only assets newer than the last scan. | People will not keep picking screenshots by hand. | Practical-use feedback; r/apps |
| 2 | **Instant search** across extracted text + title, reason and fields ("biryani", "Rs 2,999", "Gulberg") | Scrolling thumbnails for 10 minutes and giving up | r/SideProject, r/apps |
| 3 | **Auto-sort by purpose**: deal/coupon, event/reminder, place/address, recipe, receipt, info/note, junk/OTP | People remember *what kind of thing* it was, not when they took it | r/apps |
| 4 | **Resurface at the right moment** — local notifications (`expo-notifications`) for event dates and deal/coupon/return expiries (default: the day before), plus a **daily nudge** summarising what's time-sensitive today | Missed events and unused coupons | r/apps, Langen interviews |
| 5 | **Ask Second Look** — type a question ("where's that flight booking?", "what was the biryani recipe?") and get the matching screenshot plus a short answer from saved text | The Jarvis-like moment, without building a general assistant | User request; same "I can never find it" need |
| 6 | **Address/place → Open in Maps** + copy text / open link / mark done | Restaurants and places saved but never visited | r/apps |
| 7 | **Cleanup suggestions** (OTPs, near-duplicates, expired deals, user-buried items) with total MB you can free, then **delete from the photo library** after a clear confirmation | Storage full; fear of deleting the wrong thing — we show *why* it's safe, then delete only what the user confirms | r/OCD, SnapSweep |
| 8 | **Export** (CSV/JSON of everything kept) + "delete all my data" (wipes the app database, not the camera roll) | Trust: the archive isn't locked into the app (Pocket shutting down is why this matters) | Pocket shutdown |
| 9 | **Demo mode** — ~30 bundled sample screenshots with pre-computed results, so judges can try the app (and the live website) without photo permission or an API key | Hackathon "live URL" + Expo Go judging | Kiroween rules |

### Stretch (only after must-haves are done & deployed, ~Day 6)
- **Voice input** for Ask Second Look. Typed is the primary path. `expo-speech-recognition` is **not** in Expo Go, so do not add it to the Expo Go build. On the web demo, the browser Web Speech API is fine. A later EAS dev build can add native voice.
- **On-device OCR** in an EAS development build (ML Kit / similar), so only redacted *text* is sent to AI. Better privacy; not required to ship.
- Android APK via EAS Preview (handy for judges who don't use Expo Go).
- Live media-library listener so a screenshot taken while the app is open is imported immediately.

### Cut (gimmicky / not needed)
- Animated graveyard scenes, general-purpose chatbot, accounts/social sharing, auto-posting. Graveyard theme = **light UI flavour only** (labels "Buried" / "Rising soon", a tombstone icon, dark palette).

## 3. Tech stack (all free) and the OCR choice

**OCR / classification — chosen path: Gemini Flash-Lite vision, on a downscaled image.**

On-device OCR (ML Kit, native Tesseract) needs a custom native module, so it will **not** run in Expo Go and is painful to debug in a 7-day beginner build (EAS signing, dev clients, iOS certificates). Tesseract.js is a browser/WASM library and is not a realistic React Native path. Sending a **downscaled, compressed JPEG** (max 1024px, quality ~0.6) to Gemini Flash-Lite via a serverless proxy, and asking for **extracted text plus structured classification in one response**, is the path that actually ships in Expo Go, on the web demo, and in one week. The privacy trade-off is real and must be disclosed (see §4). On-device OCR is a stretch item, not the MVP.

| Layer | Choice | Why | Cost |
|---|---|---|---|
| App | **Expo SDK 54, managed workflow, Expo Router, TypeScript** | SDK 54 is the last version the **iOS App Store Expo Go** supports (later SDKs need a custom Go build). Managed workflow = no eject. Expo Router = file-based screens. | Free |
| Photos | **`expo-media-library`** (in Expo Go) | Permission once; Screenshots album / `mediaSubtypes`; delete with confirmation | Free |
| Images | **`expo-image-manipulator`** + **`expo-file-system`** | Thumbnails, downscale-before-upload, tiny bitmap for dHash | Free |
| Duplicates | dHash on an 8×8 (or 9×8) greyscale jpeg decoded with **`jpeg-js`** (pure JS) | Near-duplicates without a native module | Free |
| Local storage | **`expo-sqlite`** for shots + FTS search; AsyncStorage for settings | Stays on device; FTS is good enough for search | Free |
| Dates | **chrono-node** to parse; **date-fns** to format. Store ISO 8601. | Works offline | Free |
| AI | **Gemini API, `gemini-2.5-flash-lite`** (or `gemini-3.1-flash-lite`) **vision + JSON schema** | Text + category in one call. Pakistan is a supported region (https://ai.google.dev/gemini-api/docs/available-regions). Check free RPM/RPD in AI Studio on Day 1. Batch **≤4 downscaled images** per request. | Free tier |
| AI proxy | **One Vercel serverless function** `POST /api/classify` (holds the API key) | Never put the key in the app. Do not log or store the body. | Vercel Hobby, free |
| Rules fallback | Regex + chrono-node for OTPs, dates, prices, URLs | If the API fails or Smart sorting is off, the app still imports and can use creation dates / filenames; after a successful vision call, rules still override AI for OTP and duplicates | Free |
| Reminders | **`expo-notifications`** local scheduled notifications; optional **`expo-calendar`** "Add to calendar"; `.ics` on web | No login. Daily nudge + per-item alarms | Free |
| Maps | `https://www.google.com/maps/search/?api=1&query=` via `Linking.openURL` | No API key | Free |
| Ask | MiniSearch or SQLite FTS over saved text, then a short answer. Optional second Gemini call on **redacted text only** (never re-send images) if the local hit list is ambiguous | Typed first | Free |
| Tests | **Jest + jest-expo + fast-check** | Property tests on pure logic; judges value Kiro depth | Free |
| Live URL | **Expo web export** of Demo mode (sample shots bundled) on **Vercel** (same project as `/api/classify`). Optional EAS Hosting. | Satisfies the Kiroween live URL rule (web cannot read the photo library, so the site is Demo mode + optional file picker) | Free |
| Try on a phone | **Expo Go** (SDK 54) QR / link, plus an **EAS Android APK** if time | Judges can open it without the App Store | Free |
| Licence / repo | Public GitHub, **MIT**, `/.kiro` committed and not gitignored | Required | Free |

Scaffold (from an empty app, or overwrite the current repo contents except `.git`, `LICENSE`, `docs/`, `.kiro/`):

```bash
npx create-expo-app@latest . --template tabs@54
# if the folder is not empty, scaffold in a temp dir and move the app files in
npx expo install expo-media-library expo-notifications expo-sqlite expo-image-manipulator expo-file-system expo-calendar expo-linking expo-secure-store
```

Pin `"expo": "~54.0.0"` and run `npx expo install --fix`. Do not add packages that include custom native code (they break Expo Go).

## 4. Privacy approach (explicit)
1. **Originals stay in the photo library.** The app stores a small thumbnail and a media-library asset id, not a second copy of the full image.
2. **Smart sorting is opt-in**, with a plain-language notice, default off until the user accepts. When it is on, a **downscaled JPEG only** (max 1024px, quality ~0.6, no need for EXIF) is sent to `/api/classify`. Full-resolution images never leave the device.
3. **The proxy does not store images or text** and does not log bodies. The API key never ships in the app (`EXPO_PUBLIC_*` must not contain it).
4. **Redaction after the response, before anything is saved:** OTP codes, card-like numbers (13–19 digits), CNIC patterns (`\d{5}-\d{7}-\d`), emails and phone numbers are masked in stored text. OTP screenshots are classified as junk locally from that point and are not sent again.
5. **Honest limitation:** because text is not known until after the vision call, the *first* pass of a screenshot may include sensitive pixels. Say this clearly. Recommend the paid Gemini tier for real users; the free tier "may be used to improve our products" (https://ai.google.dev/gemini-api/docs/pricing).
6. **Smart sorting off** = no image leaves the device. Import, thumbnails, notifications based on file dates, and manual categories still work.
7. **Delete from Photos** only after a confirmation that names the count and why. **Delete all my data** wipes SQLite only.
8. **Export** is always available in Settings.
9. Stretch path (better privacy): on-device OCR, then only redacted text goes to the AI — same as the original web plan.

## 5. Architecture
```
[Expo app — iOS / Android / Expo Go]
  On launch → media-library permission (if needed)
           → query Screenshots album / screenshot subtype / filename
           → new assets since lastScanAt
           → thumbnail (~300px) + dHash, store row in SQLite (status: pending)
  If Smart sorting on:
      downscale to ≤1024px JPEG → POST /api/classify  (≤4 items)
      [Vercel] → Gemini Flash-Lite vision + JSON schema
      ← {id, ocrText, category, title, reason, dates[], expiresAt, price, place, urls[], confidence}
      redact ocrText → rules merge (OTP/duplicate override AI) → update SQLite → FTS index
      schedule local notifications for dates / expiries; refresh daily nudge
  Views: Library (categories + search) | Rising soon | Ask | Buried | Settings
  Actions: Open in Maps, Copy, Open link, Add to calendar, Mark done, Bury, Delete from Photos (confirm)
  Ask: typed question → FTS/MiniSearch → answer + jump to shot
[Web / live URL]
  Same UI in Demo mode (bundled samples + pre-computed results). Optional file picker.
  Photo-library auto-import is hidden; show a short "this is the phone-app demo" note.
```

## 6. Data model (SQLite, TypeScript)
```ts
type Category = 'deal'|'event'|'place'|'recipe'|'receipt'|'note'|'junk';
interface Shot {
  id: string;                 // uuid
  assetId: string;            // expo-media-library asset id (empty in demo/web upload)
  fileName: string; takenAt?: string; addedAt: string; sizeBytes: number;
  width?: number; height?: number;
  thumbUri: string;           // local file in the app's cache/document dir
  dHash: string; duplicateOf?: string;
  ocrText: string;            // already redacted when saved
  category: Category;
  reason: string;             // "why you saved this", one line
  title: string;
  dates: { label: string; at: string }[]; // ISO
  expiresAt?: string; price?: { amount: number; currency: string };
  place?: { name?: string; address?: string };
  urls: string[];
  status: 'pending'|'active'|'done'|'buried';
  source: 'rules'|'ai'|'rules+ai'|'demo';
  confidence: number;
  notificationId?: string;
}
interface Settings {
  smartSorting: boolean;      // default false until the user accepts the notice
  reminderLeadHours: number;  // default 24
  dailyNudgeHour: number;     // local hour, default 9
  lastScanAt?: string;
}
```

## 7. Day-by-day schedule (PKT)
Already done: public GitHub repo (`kinzaamjad35-dev/second-look`, MIT), `.kiro/` steering + hooks, Kiro IDE installed, folder opened.

| Day | Date | Goal (done = runnable &, where noted, deployed) |
|---|---|---|
| 0 | Wed 25 Nov (tonight) | Paste the updated first prompt into Kiro **Spec** mode; review `requirements.md`. Collect 150–200 of your own screenshots for later testing (remove anything private). Get a Gemini key in AI Studio and note free limits. |
| 1 | Thu 26 Nov | Approve `design.md` + `tasks.md`. Scaffold Expo SDK 54 + Expo Router tabs. Photo permission + screenshot auto-import + SQLite + last-scan. Deploy a web skeleton (Demo placeholder) to Vercel so the live URL exists early. |
| 2 | Fri 27 Nov | Thumbnails, dHash, rules engine (OTP, dates, prices, URLs) + property-based tests. Search over whatever text you have. |
| 3 | Sat 28 Nov | `/api/classify` proxy + downscale + Gemini vision JSON schema; redact-on-save; merge logic; category views. |
| 4 | Sun 29 Nov | Local notifications (per item + daily nudge). Ask Second Look (typed). Maps, copy, open link, add to calendar. "Rising soon" list. |
| 5 | Mon 30 Nov | Buried/cleanup (duplicates, OTPs, expired) + MB freed + delete from Photos with confirmation + export CSV/JSON + delete-all-app-data. |
| 6 | Tue 1 Dec | Polish UI (light graveyard theme), empty/permission/error states. Finish Demo mode. Confirm Expo web on Vercel and an Expo Go QR. Optional: EAS Android APK. |
| 7 | Wed 2 Dec | README, "How we used Kiro" write-up, record & edit demo video (< 3 min), upload to YouTube (public/unlisted). |
| 8 | Thu 3 Dec | Final test on your phone + the live URL, commit `/.kiro`, submit on Devpost. Buffer until 5 Dec 3:00 AM PKT. |

## 8. Demo video outline (< 3 min)
1. **0:00–0:20 Problem:** your real Screenshots album scrolling forever; "Pocket died in 2025; today we save screenshots, and we never look again."
2. **0:20–0:50 Permission + auto-import:** grant access once; the app finds the Screenshots album and starts sorting. Mention Smart sorting briefly and honestly (downscaled images, opt-in).
3. **0:50–1:20 It sorts itself:** categories appear; search "biryani" → the restaurant screenshot → Open in Maps.
4. **1:20–1:45 Ask Second Look:** type "where's that flight booking?" → the right screenshot and a short answer.
5. **1:45–2:10 Rising soon + a notification:** a sale ending Friday; show the scheduled reminder / daily nudge.
6. **2:10–2:30 Buried:** junk (OTPs, duplicates, expired) → "Free 310 MB" → confirm delete from Photos.
7. **2:30–2:50 How Kiro built it:** quick look at specs, steering, hooks, property tests passing.
8. **2:50–3:00** Live URL + Expo Go / APK + GitHub.

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Gemini free quota / 429s, or vision slower than text-only | Batch ≤4 images, cache by asset id, rules fallback, Demo mode with pre-computed results |
| Expo Go / SDK mismatch for judges | Pin SDK 54; ship a web Demo URL as the official live link; optional Android APK |
| Photo permission denied, or iOS Limited Photos misses the Screenshots album | Clear empty state + "Open settings"; ask for full access; allow a manual "pick screenshots" fallback |
| Android screenshot detection is messier than iOS | Album title + filename patterns (`Screenshot`, `Screen Shot`, `IMG` in a Screenshots folder); test on your phone on Day 1 |
| Sensitive pixels in the first vision call | Opt-in notice, downscale, no server storage, redact before save, never re-send OTPs |
| Notifications silent on Android 13+ / iOS | Request notification permission; document that Expo Go has limits; test a real scheduled notification on Day 4 |
| Scope creep | Nothing from "Stretch" before Day 6 |
| Privacy questions from judges | Privacy section in README + in-app notice; redaction tests; be honest about the vision trade-off |
