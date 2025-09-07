# MindsEye – Version 8

MindsEye is a creative visual canvas and control hub for ideas, media, timelines, and tools. V8 introduces dual HUD playback, export bundling, an upgraded SAR flow with ICO escalation, a customizable news ticker, and more.

## Quick Start
- Open `index.html` in a modern browser (Chrome/Edge/Safari/Firefox).
- Controls are visible in the top toolbar; panels open as overlays.
- Keyboard: A toggles the assistant; Esc closes open overlays; ←/→ navigate in HUDs.

## Major Features

### Canvas + Bubbles
- Click to create “idea bubbles”; edit via the Bubble Panel: title, description, shape, size, font, rotation, color/glow/flash.
- Attach files to bubbles (docs, images, video), add URLs, and optional bubble-level audio.
- Drawing mode with settings (color/width, smoothing, flash-only drawings); drawings do not block bubble creation when not in drawing mode.

### Dual HUD Playback (Control Hub)
- 📼 Timeline Playback: lists document attachments across bubbles by bubble date. Click items to preview (PDF/CSV/text/docx viewer). Controls: Previous/Next, Date Stamp, Share URL, Close. Fallback: “No documents available for this timeline.”
- 🔊 Audio/Video Playback: lists audio/video across bubbles (and bubble audio). Inline playback, ordered by date. Controls: Previous/Next, Date Stamp, Share URL, Close. Fallback: “No media files available for this timeline.” Closing the media HUD stops playback.
- Keyboard: Esc to close; ←/→ to navigate.

### Control Hub
- Toggle Control Hub overlay; double-bordered panel (trans colours: inner pale pink, outer turquoise ring).
- Menu entries (selected highlights only):
  - 🧐 Bubble Tracker HUD
  - 🐾 SAR Tracker (opens external tracker in new tab)
  - 📼 Timeline Playback (opens timeline HUD)
  - 🔊 Audio/Video Playback (opens media HUD)
  - 🎙️ Transcription Dropzone (local dropzone stub)
  - 📦 Export Bundle (one-click ZIP/HTML/PDF export)
  - 🗂️ Resource Drawer (reads `resources.txt`, filterable list, opens links in new tabs)
  - 🙋🏼‍♀️ Tutorials / Assistant (toggles assistant, same as A)
  - 🖥️~Broadcast~🏪 (reserved)

### Analysis Panel
- 🎶 Music Visualization (Butterchurn): utilities for local presets, fullscreen, and preset cycling.
- Suggestions & Ideas iframes (throttled with cooldowns).
- 🎤 Karaoke (bright pink): opens `https://singa.com/en/` in a new tab.
- SAR🐾 Tracker (external link).
- 🔊 Audio/Video Playback (opens media HUD).
- ⚙️ Control Hub.
- 👥 Credits (always last).

### News Ticker (Bottom Bar)
- Services: Sports, Local, News, Weather, Tweets, Entertainment.
- Right-click settings panel (topmost overlay):
  - Show Ticker, Section, Headline Color, Speed, Ticker Colour (accent). Preferences persist.
  - Hiding the ticker removes glow/border artifacts.
- Offline fallbacks from local `.txt`/`.json` + per-service caching.

### Export Bundle (📦)
- One-click export of timeline range/tags into a ZIP with:
  - `summary.html` (contents with anchors, per-entry sections), optional `summary.pdf`
  - `contents.txt` (entries, docs, media)
  - `documents/` and `media/` (best-effort fetch of linked files)
  - `timeline-map.png` (optional snapshot)
- Dynamic JSZip and jsPDF loading; configurable filename `Mindseye-Bundle_[From]_to_[To]_[Tags].zip`.

### SAR + ICO Escalation (Integrated Summary Panel)
- (External) main SAR Tracker: Control Hub item opens `https://jannerap.github.io/SAR/` in a new tab.
- Local “SAR + ICO” lightweight panel (integrated in code) supports:
  - Cases with org + SAR date; monitors due date (28 days or 90 if extension); status badges show Overdue / ICO Triggered.
  - ICO panel with auto-drafted complaint text, evidence uploads (stub), and an “Export ICO bundle” (zip with `complaint-letter.pdf`, `evidence-summary.html`, `timeline.csv`).
  - Link to official ICO SAR complaint form.

### Video & Music
- Embedded YouTube player with playlist panel and controls.
- Music panel with uploadable playlist, shuffle, radio URL input, and visualizer bars in the toolbar.

### Drawing & Visuals
- ProjectM/Butterchurn-style visualization panel; dynamically loaded preset libraries with retry and debugging.
- Theme & preset selectors in the toolbar; speed slider with pause/auto-hide toolbar.

## Keyboard Shortcuts
- A: Toggle Tutorials / Assistant
- ←/→: Navigate items in HUDs
- Esc: Close open overlays/panels (bubble panel, drawing settings, analysis, music, video playlist, read panel, HUDs, etc.)

## Files & Data
- `resources.txt`: each line `URL | Description`. The Resource Drawer parses and links.
- `session_uploads/`: optional folder to resolve local attachment/audio URLs when reloading saved ideas.
- Ideas are stored in-memory; Export Bundle serializes attachments best‑effort.

## Legal & Responsible Use
- Trademarks and content belong to their respective owners. This project displays/links third-party content for personal, non-commercial use. Respect each provider’s terms and robots policies.
- No warranty: software is provided “as is”. You’re responsible for compliance with local laws (copyright, privacy, data protection, accessibility).
- SAR / ICO: Jurisdiction-specific duties apply (UK GDPR/Data Protection Act 2018). This tool helps organize and draft; you must validate accuracy and completeness. The ICO form and legal processes remain the authority.
- Media and Karaoke: Please use responsibly. Ensure you have rights to play/stream content; karaoke services may have their own membership terms and usage limitations.
- Exported bundles may include sensitive data. Handle with care, apply redaction where appropriate, and store securely.

## Setup
- Dependencies for browser features are loaded dynamically (e.g., jsPDF, JSZip, Butterchurn). For local offline use, ensure internet access or host these libraries locally.
- Node server components (optional) are under `server/` to proxy or fetch feeds.

## Known Limitations
- PDF rendering is basic; complex formatting may need dedicated templates.
- Attachment fetch for ZIP depends on CORS/URL availability; local object URLs are not always portable.
- ICO evidence storage is stubbed; extend `MindseyeHooks.sar.addEvidence` to persist.

## Roadmap Ideas
- Richer PDF templates (thumbnails, embedded media tables, branding).
- Time‑range export controls, redaction toggles, auto-detect inactive timelines.
- News Ticker: import/export settings, font density, per-service filters.
- Deeper SAR integration: full evidence manager and case sync.

## Credits
See the in‑app Credits panel for contributors, libraries, and acknowledgements.
