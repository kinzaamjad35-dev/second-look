# Hooks in this kit
Format follows https://kiro.dev/docs/hooks/ (`.kiro/hooks/*.json`, `version: "v1"`, PascalCase triggers).
- `test-on-save.json` — PostFileSave → runs `jest --findRelatedTests` (jest-expo) on pure-logic files.
- `privacy-guard.json` — PostFileSave → agent prompt that checks no full-resolution images or API key leak from client code, and that saved OCR text is redacted.
- `readme-sync.json` — Stop → agent keeps README + Kiro usage log current.
Note: file triggers fire on *agent* edits only (per Kiro docs). If a trigger name is rejected in your Kiro version, use Agent Hooks panel → + → "Ask Kiro to create a hook" and paste the description.
Optional MCP: add a GitHub or browser/Playwright MCP server in Kiro (`.kiro/settings/mcp.json`) to let Kiro check the deployed web Demo; mention it in the write-up only if you actually use it.
