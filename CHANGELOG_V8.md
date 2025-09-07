# MindsEye – Changelog (Version 8)

This document highlights what’s new in V8 compared to prior versions (v6/v7).

## Added
- Dual HUD Timeline Modules
  - 📼 Timeline Playback (documents): Chronological list from bubbles; preview, Previous/Next, Date stamp, Share URL, Close.
  - 🔊 Audio/Video Playback (media): Inline audio/video playback ordered by date; Previous/Next, Date stamp, Share URL, Close.
- 📦 Export Bundle
  - One‑click ZIP bundling with `summary.html` (+ optional `summary.pdf`), `contents.txt`, `documents/`, `media/`, optional `timeline-map.png`.
  - Dynamic JSZip + jsPDF loading; configurable filename format.
- 🗂️ Resource Drawer
  - Parses `resources.txt` (format: `URL | Description`), filterable list, opens in new tab.
- Control Hub Enhancements
  - Tutorials / Assistant button toggles assistant (same as hotkey A).
  - New double border (trans colors): inner pale pink, outer turquoise ring.
  - Esc now closes Control Hub.
- Analysis Panel Updates
  - 🎤 Karaoke button (bright pink) – opens `https://singa.com/en/`.
  - “Credits” positioned last; Butterchurn moved to top.
- News Ticker Settings
  - Ticker Colour (accent) setting; applies to borders, highlights, glow.
  - Right‑click panel persists preferences and syncs with UI.

## Changed
- SAR Tracker button now opens external tracker in a new tab: `https://jannerap.github.io/SAR/`.
- Assistant control: Control Hub button mirrors the A key (video overlay preferred if present; overlay fallback).
- Analysis Panel ordering updated to surface common tasks.

## Fixed
- Media HUD: closing panel stops audio/video playback and clears sources.
- News Ticker: no residual glow/border when hidden.
- Global close routine (Esc) now includes Control Hub alongside other panels.

## Notes / Legal
- Third‑party content and trademarks remain property of their owners; comply with each site’s terms and local laws.
- Export bundles can contain sensitive data; redact where needed and store securely.
- SAR/ICO tools assist with organization and drafting only; validate accuracy and follow authority processes.

## Known Limitations
- PDF rendering is basic HTML→PDF; for complex layouts consider custom templates.
- ZIP content relies on reachable URLs/CORS; local object URLs may not transfer.

## Quick Links
- README (V8 Overview): see `README.md` for all features and usage.
