# Design — Second Look (Expo native app)

## 1. Architecture diagram

```
┌────────────────────────────── Phone (Expo Go / native) ──────────────────────────────┐
│                                                                                       │
│  Expo Router (TypeScript)                                                             │
│  Onboarding → Library (grid) | Search | Ask | Rising soon | Buried | Settings         │
│         │                                                                             │
│         ▼                                                                             │
│  ┌───────────────────────── import pipeline (foreground + cold start) ─────────────┐  │
│  │ expo-media-library (Screenshots album / mediaSubtypes / filename match)         │  │
│  │   → new assets only (takenAt > settings.lastScanAt)                             │  │
│  │   → expo-image-manipulator: ~300px thumbnail (app sandbox)                      │  │
│  │   → dHash (tiny greyscale bitmap + jpeg-js)                                    │  │
│  │   → upsert row in SQLite (expo-sqlite): asset id, name, size, dims, takenAt     │  │
│  └──────────────┬────────────────────────────────────────────────────────────────┘  │
│                 ▼                                                                     │
│  ┌────────── rules engine (pure TS, no AI) ──────────┐  ┌──────────────────────────┐  │
│  │ otp · dates (chrono-node) · prices · urls ·       │  │ expo-notifications      │  │
│  │ phones · duplicates (dHash ≤ 5)                   │  │ event reminders + 09:00  │  │
│  └──────────────┬────────────────────────────────────┘  │ daily nudge             │  │
│                 ▼                                     └──────────────────────────┘  │
│  ┌────────── SQLite (expo-sqlite) ────────────────────────────────────────────┐    │
│  │ shots · settings · FTS index (ocrText, title, reason, fields)               │    │
│  └──────┬──────────────────────────┬──────────────────────────┬──────────────┘    │
│         │ pending shots            │ search (FTS / MiniSearch) │ actions           │
│         ▼                          ▼                          ▼                    │
│  ┌─ Smart sorting (opt-in) ─┐  ┌─ Search / Ask ─┐  ┌─ Actions ─────────────────┐   │
│  │ downscale ≤1024px q0.6   │  │ local first;    │  │ expo-calendar, expo-     │   │
│  │ batch ≤4 → /api/classify │  │ AI fallback for │  │ linking (Maps/URL),      │   │
│  │ redact ocrText on return │  │ Ask (text only) │  │ clipboard, done/bury     │   │
│  │ rules override AI        │  └────────────────┘  └──────────────────────────┘   │
│  └──────────┬───────────────┘                                                       │
│             │ HTTPS (only when Smart sorting on)                                     │
└─────────────┼─────────────────────────────────────────────────────────────────────┘
              ▼
┌────────────────────── Vercel serverless ──────────────────────┐
│ /api/classify  · holds GEMINI_API_KEY (server env only)        │
│   → Gemini (gemini-2.5-flash-lite / 3.1-flash-lite, vision +   │
│     JSON response schema)                                      │
│ /api/ask       · redacted text only, never images              │
│ No storage, no request-body logging.                           │
└────────────────────────────────────────────────────────────────┘
```

Web (Expo web build, the live URL): same routes but auto-import is replaced by Demo mode by default; calendar action falls back to .ics download; media-library deletion unavailable.

## 2. Data model (SQLite)

```sql
CREATE TABLE shots (
  id TEXT PRIMARY KEY,            -- uuid
  assetId TEXT,                   -- expo-media-library id; NULL in demo mode
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  width INTEGER, height INTEGER,
  takenAt TEXT NOT NULL,          -- ISO 8601
  ingestedAt TEXT NOT NULL,
  thumbPath TEXT NOT NULL,         -- app-sandbox path (~300px JPEG)

  dHash TEXT NOT NULL,            -- 64-bit hex

  ocrStatus TEXT NOT NULL DEFAULT 'pending',   -- pending|done|error
  ocrText TEXT,                   -- redacted before storage when from AI

  -- rules
  isOtp INTEGER NOT NULL DEFAULT 0,
  otpValue TEXT,
  dates TEXT NOT NULL DEFAULT '[]',     -- JSON array of ISO strings
  expiresAt TEXT,
  prices TEXT NOT NULL DEFAULT '[]',   -- JSON [{amount,currency}]
  urls TEXT NOT NULL DEFAULT '[]',
  phones TEXT NOT NULL DEFAULT '[]',
  isDuplicate INTEGER NOT NULL DEFAULT 0,
  duplicateOf TEXT,                     -- JSON array of shot ids

  -- AI (absent until Smart sorting ran)
  category TEXT,           -- deal|event|place|recipe|receipt|note|junk
  title TEXT,
  reason TEXT,             -- one line: "why you saved this"
  aiPrice TEXT,            -- JSON {amount,currency}
  place TEXT,              -- JSON {name,address}
  confidence REAL,
  classifyStatus TEXT NOT NULL DEFAULT 'pending', -- pending|done|skipped|error

  status TEXT NOT NULL DEFAULT 'active',           -- active|done|buried
  notificationIds TEXT NOT NULL DEFAULT '[]'      -- JSON array
);
CREATE VIRTUAL TABLE shots_fts USING fts5(ocrText, title, reason, place, urls);
```

```typescript
interface Shot { /* mirrors the table; JSON columns parsed into typed fields */ }

interface Settings {
  id: 1;                          -- singleton row
  lastScanAt: string | null;      -- ISO; null = never scanned
  smartSortingEnabled: boolean;   -- default false until privacy notice accepted
  smartSortingNoticeSeen: boolean;
  reminderLeadHours: number;      -- default 24
  dailyNudgeTime: string;        -- '09:00'
  notificationsEnabled: boolean;
  demoMode: boolean;
}
```

## 3. `/api/classify` contract

### Downscale rules (client, before send)

- Long edge ≤ 1024px, JPEG quality ~0.6 (expo-image-manipulator).
- Batches of at most 4 images per request.
- Only pending, non-OTP, non-duplicate shots are sent.
- Never sent: Smart sorting off, OTP items, demo items.

### Request

`POST /api/classify`, `multipart/form-data`

| part     | type   | notes                                    |
|----------|--------|------------------------------------------|
| images[] | file   | JPEG, long edge ≤ 1024, ≤ 4 per request   |

### Response 200

```json
{ "results": [ { ...see schema below } ] }
```

Per item (order matches image order):

```json
{
  "ocrText": "string (raw OCR, server returns it; client redacts before saving)",
  "category": "deal | event | place | recipe | receipt | note | junk",
  "title": "string",
  "reason": "string (≤120 chars, 'why you saved this')",
  "dates": ["ISO 8601"],
  "expiresAt": "ISO 8601 | null",
  "price": { "amount": 0, "currency": "Rs" },
  "place": { "name": "string", "address": "string" },
  "urls": ["string"],
  "confidence": 0.0
}
```

### Gemini JSON response schema (server, `responseSchema`)

```json
{
  "type": "ARRAY",
  "items": {
    "type": "OBJECT",
    "properties": {
      "ocrText":  { "type": "STRING" },
      "category": { "type": "STRING", "enum": ["deal","event","place","recipe","receipt","note","junk"] },
      "title":    { "type": "STRING" },
      "reason":   { "type": "STRING" },
      "dates":    { "type": "ARRAY", "items": { "type": "STRING" } },
      "expiresAt":{ "type": "STRING" },
      "price":    { "type": "OBJECT", "properties": { "amount": { "type": "NUMBER" }, "currency": { "type": "STRING" } } },
      "place":    { "type": "OBJECT", "properties": { "name": { "type": "STRING" }, "address": { "type": "STRING" } } },
      "urls":     { "type": "ARRAY", "items": { "type": "STRING" } },
      "confidence": { "type": "NUMBER" }
    },
    "required": ["ocrText","category","title","reason","dates","urls","confidence"]
  }
}
```

### Errors

| Status | Body                     | Client behaviour                          |
|--------|--------------------------|--------------------------------------------|
| 400    | `{ "error": "Bad request" }` | Skip batch, mark `classifyStatus: 'error'` |
| 413    | payload too large       | Reduce to 1 image per request, retry once  |
| 429    | `{ "error": "Quota exceeded" }` | Fall back to rules-only, non-blocking toast |
| 500    | `{ "error": "Internal error" }` | Fall back to rules-only                  |

Server rules: validate with Zod; `GEMINI_API_KEY` from server env only; never store or log request bodies.

`/api/ask` (stretch path, used only for ambiguous Ask queries): `POST { "question": string, "contexts": [{ "id": string, "text": string }] }` where `text` is already redacted; response `{ "answer": string, "topIds": string[] }`. Never images.

## 4. Sequence diagrams

### (a) permission → scan → downscale → classify → redact → index → schedule notifications

```
User     App(Router)   media-library   import pipeline      SQLite      /api/classify   redact/merge   notifications
  │          │              │               │                 │             │               │              │
  │ grant    │              │               │                 │             │               │              │
  │─────────▶│ getAlbums/   │               │                 │             │               │              │
  │          │ getAssets    │               │                 │             │               │              │
  │          │─────────────▶│               │                 │             │               │              │
  │          │              │ new assets    │                 │             │               │              │
  │          │              │──────────────▶│ thumbnail,dHash │             │               │              │
  │          │              │               │────────────────▶│ upsert      │               │              │
  │          │              │               │  rules extraction │             │               │              │
  │          │              │               │────────────────▶│             │               │              │
  │ (Smart sorting ON, non-OTP, non-dup, pending)             │             │               │              │
  │          │ downscale ≤1024px q0.6        │                │             │               │              │
  │          │ batch ≤4 ─────────────────────────────────────────────────▶ │               │              │
  │          │                                 results[] ◀────────────────│               │              │
  │          │ redact(ocrText) ────────────────────────────────────────────▶│               │              │
  │          │ merge(rules, ai) — rules override OTP/dup ───────────────────▶│               │              │
  │          │ save ◀──────────────────────────────────────────────────────│               │              │
  │          │ reindex FTS, update Rising-soon set             │             │               │              │
  │          │ schedule reminders (24h before) + daily 09:00 nudge ─────────────────────────────────────────▶│
```

### (b) Ask

```
User        App            SQLite/FTS          /api/ask (optional)
 │ type Q    │                  │                     │
 │──────────▶│ local search     │                     │
 │           │─────────────────▶│ ranked hits         │
 │           │ clear hit?       │                     │
 │           │   yes → answer + screenshots          │
 │           │   ambiguous? → redacted contexts only │
 │           │──────────────────────────────────────▶│ answer + topIds
 │◀──────────│ best match(es) + short answer         │
```

## 5. Error handling

| Failure | Behaviour |
|---------|-----------|
| Photo permission denied | Calm empty state; "Open settings" button; "Try demo" path |
| Limited Photos, no Screenshots album | Explain full access needed; offer Demo mode |
| Album detection finds nothing (some Android devices) | Manual "pick screenshots" fallback |
| `/api/classify` 429 / 5xx / offline | Fall back to rules-only; non-blocking toast; `classifyStatus: 'error'`; retry next scan |
| Notification permission denied | Reminders toggle off with explanation; rest of app unaffected |
| Calendar permission denied | Offer .ics download fallback (also on web) |
| Delete confirmation | Must state photo count and irreversibility before deleting via expo-media-library |
| SQLite write failure | Surface error; never silently drop |
| Gemini returns malformed item | Drop that item only, keep batch |

## 6. Expo web / Demo vs native behaviour

| Capability | Native (Expo Go) | Web (live URL) |
|---|---|---|
| Auto-import screenshots | Yes (album/foreground/cold start) | No — Demo mode default, optional file-picker |
| Delete from photo library | Yes (explicit confirm) | No |
| Calendar | expo-calendar | .ics download with VALARM |
| Notifications | expo-notifications | Best-effort web push or skipped |
| Smart sorting | Available when enabled | Available when enabled (uploads via file picker or demo assets) |
| Demo mode | Available from onboarding/settings | Default |

## 7. Correctness properties for fast-check

| Property | Module | Assertion |
|----------|--------|-----------|
| Redactor never outputs a bare 6-digit OTP (also 4–8 digit codes), 13–19 digit card-like number, or CNIC `\d{5}-\d{7}-\d` | `privacy/redact` | ∀ strings; also idempotent |
| dHash of an image equals itself; duplicate detection symmetric: `isDup(a,b) ⇔ isDup(b,a)` | `rules/duplicates` | ∀ dHash pairs |
| `merge(rules, ai)` never lets AI override an OTP or duplicate rule | `classify/merge` | ∀ rule/ai combos |
| A shot marked done/buried/deleted has no pending notification id | `notifications` | ∀ shots |
| Export → reimport of the JSON archive round-trips without data loss | `export` | ∀ shot sets |
| Downscaled payloads are JPEG with long edge ≤ 1024 and ≤ 4 per batch | `classify/payload` | ∀ built batches |
| Rules extractors are pure and total (no throw) on arbitrary input | `rules/*` | ∀ strings |
| .ics output (web) always parses and has DTSTART before the alarm trigger | `actions/ics` | ∀ dated shots |
