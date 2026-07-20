# Vault Pulse (`obsidian-pulse`)

**Local radar + daily triage habit for large Obsidian vaults.**

Obsidian stores everything you throw at it — but large vaults go passive. Notes age, orphans pile up, and the graph looks busy while nothing gets touched.

Vault Pulse scores notes with a **local rule engine** (no AI, no network) and runs a **timed focus session** so you process a small queue every day.

## Features (0.1.0)

- **Signals**
  - **Stale** — not modified for N days (default 90)
  - **Orphan** — zero inbound wikilinks
  - **Duplicate** — same normalized title or similar opening text
  - **Avoidance** — `someday` / `TODO` / `나중에` style markers
- **Today queue** with folder diversity caps
- **Focus session** (default 20 minutes): one card at a time
  - Open · Archive (move, never delete) · Snooze · Skip
- **Daily schedule** (optional): remind when Obsidian is open; catch-up on next launch
- **Streak** when you complete ≥ 50% of the session target
- **Privacy:** all processing is local; no telemetry; no LLM

## Install

### From GitHub Release (recommended for testers)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest Release](https://github.com/reallygood83/obsidian-pulse/releases).
2. Create folder `<vault>/.obsidian/plugins/obsidian-pulse/`.
3. Copy the three files into that folder.
4. Enable **Vault Pulse** in Settings → Community plugins.

### BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat).
2. Add `reallygood83/obsidian-pulse`.

### Community plugins

Once accepted: Settings → Community plugins → Browse → **Vault Pulse**.

## Usage

1. Open the **Vault Pulse** view (ribbon activity icon or command **Open Pulse view**).
2. Click **Rebuild queue** after first install (or **Rescan vault index**).
3. **Start session** and process cards for your timebox.
4. Optionally enable a daily schedule in settings (e.g. `21:00`).

### Commands

| Command | Action |
|---------|--------|
| Start Pulse session | Timed triage modal |
| Open Pulse view | Side panel queue |
| Rescan vault index | Full local reindex |

## Settings (highlights)

| Setting | Default |
|---------|---------|
| Stale days | 90 |
| Session minutes | 20 |
| Target count | auto (~minutes/1.5, 5–20) |
| Exclude folders | Archive, Templates, attachments, .trash |
| Archive folder | Archive/Pulse |
| Snooze days | 7 |

## Safety

- **Archive** uses Obsidian’s vault rename/move API into `Archive/Pulse/YYYY-MM/`.
- **No auto-delete.**
- Plugin data (index cache, snooze map, streak) lives in Obsidian plugin data storage — not rewritten into your notes.

## Development

```bash
npm install
npm run build   # produces main.js
```

Requires Node 18+.

## Spec

See [SPEC.md](./SPEC.md) for product/technical design and community submission checklist.

## License

MIT © reallygood83
