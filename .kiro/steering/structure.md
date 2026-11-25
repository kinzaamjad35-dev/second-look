---
inclusion: always
---
# Project structure

```
/api
  classify.ts        Vercel function: validate (Zod), downscale check, Gemini vision, return JSON. No storage, no logging.
  ask.ts             Vercel function: redacted-text-only Q&A via Gemini. No images, no storage.
/app                 Expo Router screens
  (tabs)/
    index.tsx        Library (grid of shots)
    search.tsx       Fuzzy search
    rising.tsx       Rising soon (next 14 days)
    buried.tsx       Buried cleanup view
  ask.tsx            Ask Second Look
  onboarding.tsx     First launch + photo permission
  settings.tsx
/src
  /components        Presentational: ShotCard, ActionBar, Tombstone, UploadZone (web/demo), PermissionGate
  /features
    /import          mediaLibrary.ts, thumbnail.ts, dHash.ts
    /rules           otp.ts, dates.ts, prices.ts, urls.ts, phones.ts, duplicates.ts (pure functions)
    /privacy         redact.ts (pure)
    /classify        client.ts (builds multipart request), merge.ts (rules + AI), payload.ts (downscale)
    /notifications   schedule.ts, nudge.ts
    /actions         ics.ts, maps.ts, clipboard.ts, calendar.ts
    /export          json.ts, csv.ts, deleteAll.ts
    /search          miniSearch.ts or fts.ts
  /db                expo-sqlite schema + typed repositories (shots.ts, settings.ts)
  /types             Shot, Settings, Category, RulesResult, ClassifyResult
  /theme             colors.ts, typography.ts (graveyard palette, tombstone icon)
/assets              bundled fonts, tombstone icon
/demo                ~30 sample screenshots + precomputed JSON (shots + settings fixture)
/tests               *.test.ts and *.prop.test.ts (fast-check)
```

**Conventions**
- Pure logic lives in `/src/features/*` with no React/Expo imports, so it can be property-tested with Jest alone.
- File names: kebab-case for files, PascalCase for components, camelCase for functions.
- Each feature folder exports through an `index.ts`.
- Every pure module in `rules`, `privacy`, `actions`, `export`, `classify/merge`, and `classify/payload` has a `*.prop.test.ts`.
- UI copy: plain, short, friendly. Graveyard words only for labels ("Buried", "Rising soon").
- Never import GEMINI_API_KEY or process.env in `/app/**` or `/src/**`; that belongs solely in `/api/**`.
