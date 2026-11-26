# Second Look — Standby Plan

Ready-to-run plan for the moment Kiroween credits arrive.  
**Target submit:** Thu 3 Dec 2026 (PKT). **Hard deadline:** Fri 4 Dec 2026, 2:00 PM PST = Sat 5 Dec 2026, 3:00 AM PKT.  
**Credits:** 4,000 — budget about **10–12 Kiro agent sessions**. Merge small tasks; do not Retry a failed run blindly.

App: Expo SDK **58** (matches Expo Go on the iPhone; do not downgrade to 54). Repo: `~/Desktop/second-look`. Public GitHub already exists: https://github.com/kinzaamjad35-dev/second-look (MIT). `/.kiro` is not gitignored.

As of 26 Nov 2026 evening PKT: tasks **1–4 done**, task **5** (scan + auto-import) was being built by a helper. Permission screen was built in task 4 but was **not wired to first launch** — confirm this in Step 0.

---

## How to use this file

1. When credits land, start at **Step 0**. Do not fill the credit form again.
2. Kinza clicks **Start task N** only when that single task is still a perfect match. For every merged step, **paste the prompt** into a new Kiro chat.
3. One Kiro session per step. After each step: check the app on the iPhone (`npx expo start --tunnel --clear` — LAN failed before). The assistant runs tests and a git checkpoint. Nothing is deleted, published, or made public without Kinza's OK.
4. If a session fails, stop and ask the assistant — do not hammer Retry (that is how the free credits were burned).
5. Keep `docs/KIRO_USAGE_LOG.md` current (the readme-sync hook should append a line; if it doesn't, add one by hand).

**Work split:** Kinza clicks Start / pastes prompts, reviews the diff, checks the phone, records the video, submits Devpost, posts social + blog. The assistant handles Terminal, tests, the dev server, Vercel help, and git checkpoints.

---

## New order at a glance

| Step | Spec tasks | What you get | Kiro action |
|------|------------|--------------|-------------|
| 0 | confirm 5 | Scan works; permission screen actually appears | Checklist (no session unless a fix is needed) |
| 1 | **6 + 8** (+ 7 only if album is empty) | dHash / duplicates; Library reads SQLite, grouped | Paste prompt |
| 2 | **9 + 10** | Rules engine + redactor + property tests | Paste prompt |
| 3 | *booster* | Extra hooks, steering, MCP, a small Power — do this *before* AI so later tasks are scored | Paste prompt |
| 4 | **12** | `/api/classify` on Vercel (Gemini key server-side only) | Click **Start task 12** (or paste if the task text drifted) |
| 5 | **13 + 14** | **Auto-sort by category** (opt-in Smart sorting + merge/redact) | Paste prompt |
| 6 | **16 + 17** | **Rising soon** + local reminders / daily nudge | Paste prompt |
| 7 | **11 + 19** | Search + **Ask Second Look** (local first, `/api/ask` fallback) | Paste prompt |
| 8 | **18 + 20** | One-tap actions (Maps, copy, link, calendar, done/bury) + **Buried** | Paste prompt |
| 9 | **23 + 15** | ~30-shot Demo mode + **first web Demo deploy** (live URL) | Paste prompt |
| 10 | *new* + light 24 | **Halloween polish** (pumpkin accent, ghost/fog, spooky type, haunted empty states) + contrast/labels | Paste prompt |
| 11 | **21 + 22** | Settings (delete-all-app-data, toggles) + Export JSON/CSV | Paste prompt — **cut if short** |
| 12 | **26 + 27** | Device smoke + property-test sweep in `npm test` | Paste prompt |
| 13 | **28** + submit pack | Final Vercel deploy, README, write-up, video, Devpost, social, blog | Click **Start task 28** for the deploy; rest is listed below |

Smart path (what the 3-minute video must show): **auto-sort → Rising soon + reminder → Ask → Buried → live web Demo**.

---

## Cut list

**Never cut (winning demo):** permission + import, Library with real (or demo) data, Smart sorting by category, Rising soon + at least one real notification, Ask (local search is enough if `/api/ask` slips), Buried with a confirm-to-delete flow, Demo mode + public Vercel URL, Halloween polish, <3 min device video, Kiro write-up, Devpost fields.

**Cut if time or credits run short (in this order):**

1. **Task 7** as its own session — only keep the picker if album detection finds nothing on the phone.
2. **Tasks 21 + 22** (Step 11) — Export and "Delete all my data" are good privacy story, not in the video critical path. If cut, add a one-line Settings stub later if there is a spare hour.
3. **Formal task 25** (offline check) — do it by hand during Step 12 (airplane mode). Do not spend a Kiro session on it.
4. **Heavy task 24** — fold contrast + labels into Step 10; skip exhaustive keyboard/switch work.
5. **`/api/ask` AI fallback** — keep typed Ask with local ranked search; add the server call only if Step 7 is going well.
6. **All stretch (S1–S4)** — voice, on-device OCR, EAS APK, live media-library listener. Optional extras only after Step 12, if credits remain. An Android APK (S3) is the only stretch worth considering for judges who skip Expo Go.
7. A separate **task 27** redo — if property tests were written in Steps 1, 2, 5, 6 and 8, Step 12 is just "run `npm test` and fill gaps."

**Do not build:** animated graveyard set-pieces, a general chatbot, accounts/social sharing, custom native modules, `expo-speech-recognition` (breaks Expo Go).

---

## Steps and prompts

### Step 0 — Confirm task 5 (no Kiro session unless something is broken)

On the iPhone, in Expo Go:

- [ ] Fresh launch shows the **onboarding / permission** screen *before* the Library (this was skipped after task 4).
- [ ] Granting access starts a screenshot scan (iOS Screenshots album / `mediaSubtypes`).
- [ ] Denying access shows Open Settings + **Try demo**.
- [ ] Re-opening the app does not re-import the same assets (`lastScanAt`).
- [ ] `npm test` still passes.

If the permission screen still never appears, paste this short fix (do not start task 6 yet):

```
The onboarding + photo permission flow (task 4, FR-1) was built but is not shown on first launch — the app goes straight to the Library. Wire it so a first launch (and any launch with no photo permission and demo mode off) opens the onboarding/permission screen. Grant starts the task-5 scan; deny shows Open Settings + Try demo; iOS Limited Photos still explains full access. Do not rewrite the scan pipeline. Expo SDK 58, Expo Go only. Append one dated line to docs/KIRO_USAGE_LOG.md.
```

Also before Step 4: create a Gemini API key in Google AI Studio, and a Vercel account. Put the key only in `.env.local` (gitignored) and in Vercel env vars — never in `EXPO_PUBLIC_*`. Collect ~30 non-private sample screenshots for Demo mode (or use the bundled fixtures plus safe personal shots).

---

### Step 1 — dHash + Library from SQLite (tasks 6 + 8)

```
Implement tasks 6 and 8 of .kiro/specs/second-look/tasks.md together. Follow design.md and the existing steering files. Expo SDK 58, managed workflow, Expo Go only — no custom native modules.

1) dHash + duplicates (FR-2.4, FR-3.2): pure module (tiny greyscale bitmap + jpeg-js → 64-bit dHash). Near-duplicate when Hamming distance ≤ 5. Property tests with fast-check: an image's dHash matches itself; isDup(a,b) ⇔ isDup(b,a).
2) Hook dHash into the task-5 import pipeline so each SQLite upsert stores the hash and marks near-duplicates.
3) Library reads real SQLite data: thumbnails, group by category (use an "Unsorted" group when category is empty), pull-to-refresh re-scans, decent empty state. Keep the bundled demo shots as the path for Demo mode / denied permission.
4) If a granted permission still finds zero screenshot assets, add a minimal "Pick screenshots" fallback (task 7). Skip a fancy picker if the album path works on this iPhone.
5) Confirm first launch still shows onboarding/permission before the Library.
6) Append a dated line to docs/KIRO_USAGE_LOG.md. Do not commit secrets. Do not add GEMINI_API_KEY to client code.
```

---

### Step 2 — Rules + redactor (tasks 9 + 10)

```
Implement tasks 9 and 10 of .kiro/specs/second-look/tasks.md together. Pure TypeScript modules under src/features/rules and src/features/privacy, no React/Expo imports, following structure.md.

1) Rules engine (FR-3): extractors for OTP/verification codes, dates/times (chrono-node), prices (Rs/PKR/$/£/€), URLs, phone numbers. Run them on imported shots and store results in SQLite as in design.md. Property tests: extractors are pure and total (never throw) on arbitrary strings, including mixed English / Roman Urdu.
2) Redactor (FR-4.4): mask OTPs (4–8 digit codes), 13–19 digit card-likes, Pakistani CNIC \d{5}-\d{7}-\d, emails, phones. Property tests: no unmasked OTP / card / CNIC in the output; function is idempotent.
3) OTP shots are classified as junk and must not be eligible for later Smart sorting.
4) npm test must include the new *.prop.test.ts files. Append a dated KIRO_USAGE_LOG line noting any bugs the property tests caught.
```

---

### Step 3 — Kiro-depth boosters (do once, early)

This is for the Technological Implementation score. One session. Details of what to log are in the booster section below.

```
Do not build a product feature in this turn. Set up Kiro-depth so later tasks are safer and scorers can see specs + steering + hooks + MCP + powers + property tests in the repo.

1) Add steering file .kiro/steering/theme.md (inclusion: always or fileMatch on theme/UI): dark graveyard base stays; pumpkin-orange accent (#F07C32 or similar, AA contrast on #0C0D10); optional ghost/fog atmosphere on empty states only; one spooky display font for titles (bundled, licensed, fallback to system); labels stay "Buried" / "Rising soon"; never sacrifice readability or speed. Also update .kiro/steering/tech.md to say Expo SDK 58 (not 54) and Expo Go only.
2) Add a hook .kiro/hooks/expo-go-guard.json (PostFileSave on package.json / app.json / any new dependency): agent must reject packages that need custom native modules or are absent from Expo Go (especially expo-speech-recognition). Explain in one line if it blocks something.
3) Confirm the three existing hooks still work (test-on-save, privacy-guard, readme-sync). Fix matchers if paths drifted (src/features/...).
4) Add project MCP at .kiro/settings/mcp.json: a Playwright or other official browser MCP to smoke-test the future web Demo, and GitHub MCP only if it can be enabled without leaking tokens into the repo (use env vars). Do not commit secrets. If a server needs a token Kinza has not provided, leave it disabled with a comment and document the intended use in docs/HOOKS_README.md.
5) Create a small local Kiro Power in the repo (e.g. .kiro/powers/second-look-privacy/ or the current Power format with plugin.json): keywords like "classify", "Smart sorting", "expo", "redact". It should remind the agent: Expo Go only, GEMINI_API_KEY never in client or EXPO_PUBLIC_*, only downscaled JPEGs (≤1024px, q0.6, batch ≤4) may leave the device when Smart sorting is on, redact before save, confirm before deleting Photos. Tell me how to install it from the local folder in the Kiro Powers panel.
6) Browse kiro.dev/powers and list 1–2 registry Powers that would actually help this repo (for example a browser-testing Power, or a deploy Power). Do not install a pile of unused vendor Powers. Do not switch hosting from Vercel just to use a Netlify Power.
7) Update docs/HOOKS_README.md and append a KIRO_USAGE_LOG line for each hook / steering file / MCP / Power added.
```

After this step, Kinza should: Powers panel → Add Custom Power → import the local folder. Optional: try **Kiro CLI once** later (e.g. run tests or a tiny bugfix) and note IDE vs CLI in the write-up. Do not switch the whole build to Crew.

---

### Step 4 — `/api/classify` + deploy the API (task 12)

Click **Start task 12** if the checkbox text still matches design.md §3. Otherwise paste:

```
Click-through / implement task 12: Vercel serverless function POST /api/classify exactly as design.md §3. Zod validation, GEMINI_API_KEY from server env only, Gemini vision (gemini-2.5-flash-lite or gemini-3.1-flash-lite) with the JSON response schema, batch ≤ 4, no storage or body logging, 400/413/429/500 handling as specified. Deploy the API to Vercel in this task. Never put the key in /app, /src, or EXPO_PUBLIC_*. Expo SDK 58 client must not call this until task 13. Append a KIRO_USAGE_LOG line, including how Kiro (and any Power/MCP) helped with the deploy.
```

Kinza (or the assistant, with her OK) sets `GEMINI_API_KEY` in the Vercel project env.

---

### Step 5 — Auto-sort by category (tasks 13 + 14) — video wow #1

```
Implement tasks 13 and 14 together (FR-4). Expo SDK 58, Expo Go only.

1) Smart sorting is default OFF. Show a plain privacy notice before enable: only a downscaled JPEG (long edge ≤ 1024, quality ~0.6) is sent to /api/classify; originals never leave the device; the first vision pass may include sensitive pixels; redact happens before save; free-tier Gemini may use content to improve Google products.
2) When ON, downscale pending non-OTP, non-duplicate shots, POST batches of at most 4, then redact ocrText before saving. Property test (classify/payload): every built batch is JPEGs with long edge ≤ 1024 and length ≤ 4.
3) merge(rules, ai): rules override AI for OTP and duplicates; OTP items are junk and are never re-sent. On 429/5xx/offline, fall back to rules-only with a non-blocking toast. Property test: merge never lets AI override an OTP or duplicate rule.
4) Library groups by category (deal, event, place, recipe, receipt, note, junk) with the one-line reason visible on the card.
5) Privacy-guard hook must still hold. Append KIRO_USAGE_LOG, and note any property-test bug you found.
```

Phone check: enable Smart sorting on a few safe screenshots and watch categories appear.

---

### Step 6 — Rising soon + reminders (tasks 16 + 17) — video wow #2

```
Implement tasks 16 and 17 together (FR-6, FR-7). Expo SDK 58, Expo Go only (expo-notifications is in Expo Go).

1) Rising soon: items with a date or expiry in the next 14 days, soonest first; items drop out when the date passes. Use dates from rules and/or Smart sorting. Haunted-but-clear empty state if nothing is due.
2) Local notifications: request permission only when the user first enables reminders. Schedule a per-item reminder (default 24 hours before, user-adjustable) and a daily 09:00 local nudge that summarises time-sensitive items, or stays silent when there is nothing to say. Cancel or update notifications when a shot is marked done, buried, or deleted.
3) Property test: a shot marked done/buried/deleted has no pending notification id.
4) Be honest if Expo Go notification behaviour is limited; the UI and scheduler must still be correct. Append KIRO_USAGE_LOG.
```

Phone check: create or use a shot that expires tomorrow; confirm it is on Rising soon and that a notification can be scheduled.

---

### Step 7 — Search + Ask (tasks 11 + 19) — video wow #3

```
Implement tasks 11 and 19 together (FR-5, FR-8). Expo SDK 58, Expo Go only.

1) Search: SQLite FTS5 and/or MiniSearch over ocrText, title, reason and extracted fields; ranked results with match highlighting; sub-second on ~1,000 shots. Search tab should work offline on already-saved text.
2) Ask Second Look: typed question (e.g. "where's that flight booking?") → local ranked search over redacted text → matching screenshot(s) plus a short answer. Voice is stretch — do not add expo-speech-recognition.
3) Only if local hits are ambiguous, call POST /api/ask with redacted text only (never images), same server rules as classify (no storage, no logging, key server-side). If /api/ask would blow the session, ship local Ask first and leave a clearly marked TODO.
4) Append KIRO_USAGE_LOG.
```

Phone check: search a word you know is in a shot; Ask a natural question and get the right card back.

---

### Step 8 — Actions + Buried (tasks 18 + 20) — video wow #4

```
Implement tasks 18 and 20 together (FR-9, FR-10). Expo SDK 58, Expo Go only.

1) One-tap actions on a shot: Open in Maps (https://www.google.com/maps/search/?api=1&query=…, no API key), copy redacted text, open link, add to calendar (expo-calendar on native with permission fallback; on web, download an .ics with VALARM), mark done, bury. Property test: web .ics parses and DTSTART is before the VALARM trigger.
2) Buried view: list OTPs, duplicates, expired deals, and user-buried items, with total size that could be freed. Delete from the photo library only after a confirmation that states the count and that it cannot be undone from the app; then delete via expo-media-library and remove local rows. Demo mode / web must not delete from a real camera roll — hide or disable that action and say why.
3) Append KIRO_USAGE_LOG. Note any property-test bug.
```

Phone check: Open in Maps on a place shot; open Buried; walk up to the confirm dialog (do not delete important photos).

---

### Step 9 — Demo mode + first web deploy (tasks 23 + 15)

```
Implement tasks 23 and 15 together (FR-12, NFR-2). Expo SDK 58.

1) Demo mode: bundle ~30 sample screenshots with pre-computed results that exercise Library (categories), Search, Rising soon, Ask, and Buried, with no photo permission and no API key. Enter from the onboarding denied-state and from Settings. Clearly labelled, easy to exit.
2) Expo web build is the public live URL and defaults to Demo mode, with a short note that auto-import is a phone-app feature. Optional file-picker fallback on web. Calendar = .ics; no photo-library deletion.
3) Deploy the Expo web export to the same Vercel project as /api/classify. Put the live URL in README.md and append KIRO_USAGE_LOG. If a browser MCP or Power is configured, use it to smoke-test the deployed Demo (Library, Search, Ask, Rising soon, Buried load) and log what it caught.
```

---

### Step 10 — Halloween design polish (new) + light a11y

```
Design polish pass for the Kiroween Design score. Keep the app fully usable — flavour, not a haunted-house game.

Follow (or create) .kiro/steering/theme.md and NFR-3, with a slightly richer Halloween look than the original "light flavour only" note, because judges reward a polished, intentional, spooky aesthetic:

1) Pumpkin-orange accent (AA contrast on the near-black soil background) for primary buttons, active tabs, and key highlights. Keep moss/lantern colours for success and Rising soon if they still contrast.
2) Ghost / fog touches only on empty states and maybe a very light Library atmosphere — no looping full-screen animations, no extra permissions, no performance jank.
3) One bundled, redistributable spooky display font for the app title and screen headers; body copy stays a readable system font.
4) Haunted but clear empty states for Library, Search, Ask, Rising soon, and Buried (short copy, one obvious action).
5) Light accessibility: contrast AA for text and badges, labels on icons, sensible focus order. Skip a full keyboard/switch audit if time is tight (that was task 24).
6) Update the app icon / splash if they are still generic Expo assets, in the same palette.
7) Append KIRO_USAGE_LOG. Do not regress any flow from Steps 5–9.
```

---

### Step 11 — Settings + Export (tasks 21 + 22) — cut if short

```
Implement tasks 21 and 22 (FR-10.3, FR-11) only if credits and time remain after Step 10. Expo SDK 58.

Settings: "Delete all my data" wipes SQLite + local thumbnails only, never the camera roll (property test). Notification preferences (lead hours, daily nudge time, on/off). Smart sorting toggle (same privacy notice as task 13). Export kept items as JSON and CSV; property test: JSON export → reimport is lossless.

Append KIRO_USAGE_LOG. If this step is skipped, leave a short Settings screen with the Smart sorting toggle (already in task 13) and do not block submission.
```

---

### Step 12 — Device smoke + property-test sweep (tasks 26 + 27)

```
Implement tasks 26 and 27 as a hardening pass, not a rewrite.

1) Property-test sweep: every module in design.md §7 has a passing *.prop.test.ts (redact, dHash/duplicates, merge, notifications, export if built, payload, rules purity, ics if built). npm test is the single command. Add component tests for Library, Rising soon, and Buried if missing and cheap.
2) End-to-end smoke, and fix only what breaks: full flow in Expo Go on this iPhone (permission or demo → import/library → Smart sorting → search → Ask → Rising soon → notification permission → Maps/copy → Buried confirm dialog). Quick web Demo check. Airplane-mode check: app usable offline except Smart sorting and Ask's AI fallback (task 25 — do not make a separate session).
3) List any Expo Go notification or Android-album limitations honestly in README. Append KIRO_USAGE_LOG with the test count and any bugs property tests caught that unit tests missed.
```

If an Android device is not available, say so in the README rather than spending credits on guesswork. A bugfix spec (e.g. "permission screen skipped on launch" or "Android album miss") is worth writing if a real bug was fixed — paste:

```
Write a short Bugfix spec under .kiro/specs/ for <the real bug we just fixed>: root cause, acceptance criteria, and the regression test. Then stop. We will mention it in the Kiro write-up.
```

---

### Step 13 — Final deploy + submission pack (task 28 + docs)

Click **Start task 28** for the deploy, or paste:

```
Final Vercel deploy of API + Expo web Demo. Put the live Demo URL and clear judge instructions (web Demo needs no photos and no API key; phone path is Expo Go / SDK 58 + the tunnel QR) in README.md. Update any leftover "SDK 54" references to SDK 58. Do not rewrite features. Append KIRO_USAGE_LOG.
```

Then finish the pack in the schedule below (write-up, video, Devpost, social, blog). The assistant can draft text; Kinza records, publishes, and submits.

---

## Kiro-feature boosters (Technological Implementation)

Judges score **depth and variety**. Aim to use, and then *describe with evidence*, all of: specs, steering, hooks, MCP, property-based testing, Powers. Optional extras that the official write-up questions also ask about: IDE vs CLI (try once), a custom agent, a bugfix spec. Kinza is building in the **Kiro IDE**, not Crew — that is fine; do not restart in Crew.

### Already in the repo (show these in the video + write-up)

- **Specs:** `.kiro/specs/second-look/{requirements,design,tasks}.md` (12 FRs, EARS criteria, 28 tasks + stretch). Started from `docs/KIRO_FIRST_PROMPT.md`.
- **Steering:** `product.md`, `structure.md`, `tech.md` (always on).
- **Hooks:** `test-on-save.json` (Jest on pure-logic saves), `privacy-guard.json` (no full-res uploads, no client API key, redact before save), `readme-sync.json` (README + usage log).
- **PBT (fast-check):** planned in design.md §7; written in Steps 1, 2, 5, 6, 8, 11.

### Add in Step 3 (and use for real)

| Feature | What to add | What to do with it |
|---------|-------------|--------------------|
| Steering | `theme.md` (Halloween, still functional); `tech.md` → SDK 58 | Quote one before/after in the write-up (e.g. tech.md stopped an `EXPO_PUBLIC_` key or a native module) |
| Hook | `expo-go-guard.json` | Log any package it blocked |
| MCP | Project `.kiro/settings/mcp.json`: browser/Playwright for the web Demo; GitHub only with env-based tokens | Use the browser MCP in Step 9 to smoke the live URL — that is the "MCP enabled something hard" story |
| Powers | A **small local Power** for Expo Go + privacy + classify rules, installed from the folder; at most 1–2 registry Powers you will actually invoke | In prompts for Steps 4–5 and 9, name the Power's keywords ("Smart sorting", "Vercel deploy", etc.) so it activates. Screenshot the Powers panel for the write-up |
| Custom agent (optional, 20 min) | A "Privacy reviewer" agent that only checks FR-4 / privacy-guard rules | Run it once after Step 5 and log the result |
| Kiro CLI (optional, 20 min) | One `npm test` or tiny fix in the CLI | Two honest sentences on IDE vs CLI |
| Bugfix spec | Only for a real bug | Strong write-up evidence |

Do **not** install a stack of unused vendor Powers (they compete for activation). Do **not** move hosting to Netlify just because a Netlify Power exists. Official registry: https://kiro.dev/powers/ and https://kiro.dev/registry/.

### What to write in `docs/KIRO_USAGE_LOG.md`

The readme-sync hook should append a short dated line after user-facing work. If it misses, add the line by hand. Fix the existing `2026-06-30` date if it is still wrong (task 4 was 26 Nov 2026).

Each line should look like:

`YYYY-MM-DD — [spec task | steering | hook | MCP | power | PBT | CLI]: what ran, what it produced, any bug caught.`

Examples:

- `2026-11-27 — PBT (rules/redact): idempotence test caught double-masking on CNIC; fixed before save.`
- `2026-11-27 — hook expo-go-guard: blocked expo-speech-recognition.`
- `2026-11-30 — MCP Playwright: deployed Demo, Ask tab returned empty on web; fixed demo fixture wiring.`
- `2026-11-27 — power second-look-privacy: activated on classify prompt; kept key out of client.`

The write-up (`docs/KIRO_WRITEUP.md`) is filled from this log on 2 Dec — specific moments, numbers, and screenshots, not generic praise. Fill every section that is still a `<placeholder>`, including bugs PBT found that unit tests missed, and one steering before/after.

---

## Day-by-day schedule (PKT, UTC+5)

Credits may arrive mid-plan. If they arrive late, skip down the cut list and protect 2–3 Dec for video + submit. If they arrive 27 Nov, follow this.

### Fri 27 Nov — Foundation

- Step 0 (permission + scan check).
- Steps 1–3 (Library + dHash, rules + redactor, Kiro boosters).
- Start Step 4 if there is time (API deploy needs the Gemini key + Vercel).
- Gather Demo screenshots (non-private).
- Assistant: tests + git checkpoint after each step.

### Sat 28 Nov — Smart core

- Finish Step 4. Steps 5–6: **auto-sort** and **Rising soon + reminders**.
- Phone: categories appear; a soon-expiring item is on Rising soon; notification permission path works.
- Goal by tonight: the first two video wow moments work on the device.

### Sun 29 Nov — Ask, actions, Buried

- Steps 7–8: Search + **Ask**, Maps/copy/calendar, **Buried**.
- Phone: walk the video flow once, even if Demo mode and polish are still thin.

### Mon 30 Nov — Live URL + look

- Step 9: Demo mode + **first Vercel web URL** (put it in README).
- Step 10: Halloween polish.
- Step 11 only if credits and energy remain.
- Draft the video script (below) and a shot list for the phone.

### Tue 1 Dec — Harden, start submission work

- Step 12: device smoke, `npm test`, airplane-mode check, README limitations.
- Optional stretch only if the app is already demo-ready: EAS Android APK (S3).
- Start filling `docs/KIRO_WRITEUP.md` from the usage log. Update README from `docs/README_SKELETON.md` (SDK 58, live URL, privacy, licence).
- Walk the video script on the phone; fix only blockers.

### Wed 2 Dec — Video, write-up, drafts

- Step 13: final Vercel deploy if anything changed.
- Record and edit the **demo video (< 3 min)** with real device footage; upload to YouTube (public or unlisted). No copyrighted music, no third-party trademarks.
- Finish the Kiro write-up. Confirm `/.kiro` is in the public repo (specs, steering, hooks, settings, Power if added).
- Draft Devpost fields, the social post, and the blog post (templates below). Do not submit or publish until Kinza reviews.

### Thu 3 Dec — Submit (buffer until Sat 5 Dec, 3:00 AM PKT)

- Final pass: phone + live URL + repo + video + write-up.
- Submit on [Devpost](https://kiroween.devpost.com/) (Resurrection category). Paste every required field. Add bonus URLs if the posts are up.
- Publish the **social post** (hashtag must be the first characters) and the **blog post** (must say it is part of Kiroween 2026), then add both URLs to the submission.
- Stop. Use Fri 4 Dec only for an emergency fix; no new features.

---

## Demo video outline (< 3 minutes, on-device)

Record on the iPhone (Expo Go) for the main flow. A 5-second cut to the web Demo is enough to prove the live URL.

1. **0:00–0:20 Problem.** Scroll a real Screenshots album. "Pocket died in 2025. Today we save screenshots — and we never look again."
2. **0:20–0:50 Permission + import.** Grant once; the app finds Screenshots and imports. One honest line: Smart sorting is opt-in; only a downscaled JPEG may leave the device.
3. **0:50–1:15 It sorts itself.** Categories and "why you saved this" appear. Search a word (e.g. a restaurant) → Open in Maps.
4. **1:15–1:35 Ask Second Look.** Type "where's that flight booking?" (or a question that matches a demo/real shot) → the right screenshot + a short answer.
5. **1:35–2:00 Rising soon + a reminder.** A sale or event in the next few days; show the scheduled reminder / daily nudge.
6. **2:00–2:20 Buried.** OTPs, duplicates, expired → storage you could free → confirmation dialog (you can cancel on personal photos).
7. **2:20–2:45 How Kiro built it.** Quick look at `.kiro` specs, steering, hooks, a Power or MCP, property tests passing.
8. **2:45–3:00** Live URL + Expo Go + GitHub.

---

## Devpost fields (have these ready)

- **Category:** Resurrection.
- **Repo:** https://github.com/kinzaamjad35-dev/second-look — public, MIT licence visible in About, `/.kiro` at the root, not gitignored.
- **Working app URL:** Vercel Expo web Demo (no login). Testing notes: open the URL for Demo mode; for the phone, Expo Go / SDK 58 and the QR or tunnel link.
- **Description:** 2–3 short paragraphs from the README (problem, what it does, privacy in one paragraph).
- **YouTube video:** <3 min, device footage, public or unlisted link.
- **Kiro write-up:** paste or link `docs/KIRO_WRITEUP.md` (cover IDE, hooks, specs vs vibe, steering, MCP, PBT, Powers; skip Crew if unused).
- **Bonus — Social Blitz:** URL of a public post that **starts with** `#KiroweenHackathon26`, posted during the submission period, about a favourite Kiro feature and how it changed the way you built.
- **Bonus — Blog:** URL of a public third-party post (Medium, Hashnode, Dev.to, etc.) published during the submission period, about Kiro and this project, explicitly mentioning it was written as part of the **Kiroween 2026** hackathon.

---

## Social and blog (drafts — publish on 3 Dec)

**Social (X / LinkedIn).** The hashtag must be the very first characters, before any other text:

```
#KiroweenHackathon26 I built Second Look in the Kiro IDE: an Expo app that resurrects forgotten screenshots, reminds you before they expire, and buries the junk.

My favourite Kiro feature was spec-driven tasks plus property-based tests and a privacy hook. The spec kept the build honest (opt-in Smart sorting, redact before save, Expo Go only), the hook caught unsafe changes, and fast-check found edge cases unit tests missed. That is a different way of working than vibe-coding a UI and hoping.

Repo: https://github.com/kinzaamjad35-dev/second-look
```

Add the live URL and YouTube link when they exist. A short screen recording helps the Social Blitz prize (5 winners, 3-month Kiro Pro+).

**Blog (any public third-party platform).** Title idea: "Resurrecting 'read it later' for screenshots — building Second Look with Kiro for Kiroween 2026." First paragraph must say this was written as part of the **Kiroween 2026** hackathon. Cover: the Pocket / screenshot problem, why it had to be a phone app, how specs/steering/hooks/MCP/PBT/Powers were used (steal evidence from the usage log), one thing that went wrong (credits, permission screen, or a PBT bug), and links to the repo, live Demo, and video. Bonus Blog Prize: 2,000 Kiro credits, up to 100 winners.

---

## Quick reminders

- Official rules and write-up questions: https://kiroween.devpost.com/rules
- Resources / credits: https://kiroween.devpost.com/resources — do not submit a second credit request.
- If the permission screen or scan is still wrong when credits arrive, fix that before Step 1.
- Keep every time in this plan in **PKT (UTC+5)**; the official clock is PST.
