---
inclusion: always
---
# Product: Second Look

**One line:** Second Look is a phone app that turns a camera roll full of forgotten screenshots into things you can find, get reminded about in time, or safely delete.

**Why it exists:** People screenshot things "for later" (restaurants, sales, events, recipes, receipts, addresses), then can't find them, miss the deadline, and run out of phone storage. Pocket, the best-known "read it later" app, shut down in July 2025. Gallery text search finds words but doesn't know a sale ends Friday or that 300 screenshots are OTPs and duplicates. A website cannot see the photo library; this is a native Expo app so the user grants access once and the app does the rest.

**Users:** everyday smartphone users with hundreds–thousands of screenshots; first target: students and young professionals in Pakistan (mixed English / Roman Urdu text, often on mid-range Android phones and patchy internet).

**Every feature must answer a real need. Current must-haves:**
1. Find them: auto-import the Screenshots album (and new ones on next open) after one permission.
2. Find it: fast search across screenshot text, plus "Ask Second Look" in plain language.
3. Don't miss it: dates and expiries become local notifications, plus a daily nudge.
4. Use it: Open in Maps, copy text, open link, add to calendar.
5. Clean up: list OTPs, duplicates and expired items with storage saved, then delete from Photos only after confirmation.
6. Own it: export everything; wipe app data without touching the camera roll.

**Principles**
- Practical first: permission once, then automatic. No workflow that makes people hand-pick screenshots every time (a manual picker is only a fallback).
- Privacy, honestly: originals stay in the photo library. Smart sorting is opt-in. Only a downscaled JPEG may leave the device. Redact OTPs, card numbers and CNICs before saving. Say clearly that the first vision pass may include sensitive pixels.
- Honest UI: never delete a photo without confirmation; show why an item was classified; don't pretend the web Demo can read a phone's library.
- Useful over flashy: the graveyard theme is light flavour (labels, icon, palette), never at the cost of clarity or speed.
- Works without AI: with Smart sorting off, import, thumbnails, search of whatever text exists, and manual categories still work.
- Expo Go first: no custom native modules in the MVP.

**Out of scope:** accounts, social features, a general-purpose chatbot, server-side storage of user content, voice or on-device OCR in the MVP (those are stretch).
