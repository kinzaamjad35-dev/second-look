# How we used Kiro — Second Look

> Fill in with real examples as you build. Judges score depth of Kiro usage, so show *specific* moments, numbers and screenshots. Keep `docs/KIRO_USAGE_LOG.md` (auto-updated by a hook) as your source.

## 1. Spec-driven development
- Started from one prompt (see `KIRO_FIRST_PROMPT.md`) → Kiro generated `requirements.md` (<N> user stories, EARS acceptance criteria), `design.md` (architecture, sequence diagrams, /api/classify contract) and `tasks.md` (<N> tasks, stretch labelled).
- What I changed during review and why: <e.g. cut a general chatbot because it didn't map to a user need; kept Ask Second Look as search-over-screenshots; marked voice and on-device OCR as stretch so Expo Go still works>.
- Ran tasks in <order/parallel waves>; a runnable Expo Go app existed after task <N>.
- Bugfix spec: <e.g. Android screenshot album detection missed some devices → root cause → fix → regression test>.

## 2. Steering
- `product.md` kept every suggestion tied to a real user need and the privacy rules (opt-in Smart sorting, confirm before deleting Photos).
- `tech.md` stopped Kiro from adding custom native modules or putting the API key in `EXPO_PUBLIC_*` (<example>).
- `structure.md` kept pure logic separate so it could be property-tested.
- Example where steering changed Kiro's output: <before/after>.

## 3. Agent hooks
- **Run related tests on save** (PostFileSave, jest-expo): caught <N> regressions, e.g. <...>.
- **Privacy guard** (PostFileSave, agent prompt): flagged <e.g. a fetch sending a full-resolution URI> and fixed it.
- **README/usage sync** (Stop): kept docs current automatically.

## 4. Property-based testing (correctness)
Properties from design.md, tested with fast-check:
- Redactor never outputs a 6-digit OTP, card-like number or CNIC.
- Duplicate detection is symmetric; an image is always a duplicate of itself.
- Merge never lets AI override an OTP/duplicate rule.
- A shot marked done or deleted has no pending notification id.
- Export → reimport of the JSON archive round-trips without data loss.
- Downscaled payloads are JPEG with long edge ≤ 1024.
Bugs found by these tests: <list>.

## 5. MCP (only if used)
<e.g. GitHub MCP to open issues from tasks; browser MCP to smoke-test the deployed web Demo>

## 6. Vibe coding vs specs — what I learned
<2–3 honest sentences: where quick chat worked, where specs saved time>

## 7. Time & numbers
Built solo between 25 Nov and 3 Dec 2026. <N> tasks, <N> tests, <N> property tests, <N> hook runs.
