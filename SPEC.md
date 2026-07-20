# Obsidian Pulse (obsidian-pulse) — Product & Technical Spec

**Version:** 0.1.0  
**Author:** reallygood83  
**Repo:** https://github.com/reallygood83/obsidian-pulse  
**Target:** Obsidian Community Plugin submission  
**Language:** TypeScript (Obsidian plugin API). **No Python. No AI required for MVP.**

---

## 1. Problem

Large Obsidian vaults (thousands of notes) become **passive storage**:
notes are saved but never resurfaced. Users feel overwhelmed and do not know
what to organize. Graphs look impressive while knowledge freezes.

## 2. Solution (one sentence)

**Vault Pulse is a local radar + 20-minute triage habit:** scan the vault with
rule-based scores, recommend a small daily queue, and help users act
(open / archive / snooze / skip) without auto-deleting or mass-refiling.

## 3. Non-goals (MVP)

- AI / LLM / cloud calls
- Auto-delete notes
- Auto bulk folder restructure / PARA enforcement
- Forced methodology (Zettelkasten etc.)
- Semantic embeddings (optional later)
- Mobile background cron (desktop schedule + app-start catch-up only)

## 4. Users (ICP)

- Vault size 3k–50k+ notes
- Feels vault is a “digital graveyard”
- Wants a **habit**, not a weekend cleanup fantasy

## 5. Core loop

```
incremental index → score notes → diversity filter → Today queue
→ Focus session (timer) → user actions → update snooze/stats
```

## 6. Functional requirements

### 6.1 Index (local engine)

Build/maintain a cache of markdown notes (exclude binaries):

| Field | Source |
|-------|--------|
| path | vault relative path |
| mtime | file mtime ms |
| title | basename without `.md` (or first `#` heading optional) |
| size | bytes |
| outLinks | count of `[[wikilinks]]` + markdown links to vault notes |
| inLinks | reverse count from full graph pass |
| titleKey | normalized title for dup detection |
| prefixHash | hash of first ~120 visible chars (normalized) |
| tags | frontmatter tags + inline `#tags` (lightweight) |

**Performance (10k notes target):**
- Full scan on first load (background, non-blocking UI)
- Incremental update on `vault.on('modify'|'create'|'delete'|'rename')`
- Persist cache under plugin data dir (`data.json` or `pulse-index.json`)
- Skip folders: configurable exclude list (default below)
- Skip non-`.md` files

### 6.2 Signals & scoring

For each note, compute:

| Signal | Rule (defaults) | Score contribution |
|--------|-----------------|--------------------|
| stale | days since mtime ≥ `staleDays` (90) | up to 40, scaled by days capped at 365 |
| orphan | inLinks === 0 | +30 |
| duplicate | same titleKey or same prefixHash cluster size ≥ 2 | +25 |
| avoidance | body/title matches keywords (`나중에`, `someday`, `TODO`, `#someday`) | +10 |
| penalty | path under exclude; or snoozed; or mtime within 7 days | heavy negative / hard filter |

**score = sum(weighted signals)**  
Weights configurable in settings.

### 6.3 Today queue

1. Rank all eligible notes by score desc  
2. Diversity filter:
   - max N per parent folder (default 3)
   - max 2 per duplicate cluster
   - exclude snoozed until date
3. Cut to `sessionTargetCount` (from minutes: `clamp(floor(minutes/1.5), 5, 20)`)

Each queue item must include **explain string** in UI language (EN primary for community plugin; settings for locale later):

Example: `Stale 127d · Orphan · Inbox/`

### 6.4 Habit session (20 min)

- Command: `Start Pulse session`
- Optional daily schedule: local time HH:mm
- Timer countdown
- Focus mode: **one card at a time**
- Actions:
  - **Open** — open note in leaf
  - **Archive** — move to `archiveFolder` (default `Archive/Pulse/YYYY-MM`) or prepend path; never delete
  - **Snooze** — hide for N days (default 7)
  - **Skip** — dismiss for this session only
- Wrap-up summary: processed counts + streak update
- Streak: +1 if resolved ≥ 50% of target cards

### 6.5 Schedule (cron-like)

- Setting: enable daily reminder + time
- When Obsidian is open at that time: open session modal/view + optional Notice
- When closed: on next app load, if today’s session not completed and time passed → offer session
- No OS-level hard cron requirement for MVP

### 6.6 Commands & ribbon

- Start Pulse session  
- Open Pulse view (Today board list)  
- Rescan vault index  
- Ribbon icon optional

### 6.7 Settings

| Key | Type | Default |
|-----|------|---------|
| staleDays | number | 90 |
| sessionMinutes | number | 20 |
| sessionTargetCount | number \| "auto" | auto |
| excludeFolders | string[] | `["Archive", "Templates", "attachments", ".trash"]` |
| archiveFolder | string | `Archive/Pulse` |
| snoozeDays | number | 7 |
| scheduleEnabled | boolean | false |
| scheduleTime | string | `"21:00"` |
| weights.stale | number | 1 |
| weights.orphan | number | 1 |
| weights.duplicate | number | 1 |
| weights.avoidance | number | 1 |
| maxPerFolder | number | 3 |

## 7. UI

### Views
1. **Pulse View** (ItemView): list of today queue + “Start session”  
2. **Session modal or dedicated mode**: timer + single card + action buttons  

Use Obsidian-native styles (`mod-cta`, settings tab, etc.). No external CSS frameworks.

## 8. Architecture (TypeScript modules)

```
src/
  main.ts              # Plugin lifecycle
  settings.ts          # defaults + settings tab
  types.ts             # interfaces
  index/vault-index.ts # scan + cache + link graph
  engine/scorer.ts     # signals + score
  engine/queue.ts      # diversity + today queue
  session/session.ts   # timer, actions, streak
  session/schedule.ts  # daily schedule + catch-up
  ui/pulse-view.ts
  ui/session-modal.ts
  utils/paths.ts
  utils/text.ts
```

## 9. Community plugin requirements (must pass)

- `manifest.json` with correct id `obsidian-pulse`, version, minAppVersion, author, description  
- `main.js` built from TypeScript  
- `styles.css` if needed  
- No `node_modules` in release  
- README with install, usage, privacy (local-only, no network)  
- LICENSE MIT  
- `.gitignore` proper  
- No remote code fetch  
- No eval of user notes as code  
- Safe file operations only via Vault API  
- Desktop-first; mobile should not crash (schedule can no-op or Notice only)  
- Follow [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin) patterns  
- `versions.json` for release tooling  
- GitHub Actions optional: build on tag  
- Semantic version tags for releases (`0.1.0`)  
- Release assets: `main.js`, `manifest.json`, `styles.css` (required by BRAT/community)

## 10. Privacy & safety

- All processing local  
- No telemetry  
- Archive = move, not delete  
- Never modify note content without explicit future feature  
- Snooze stored in plugin data, not frontmatter (unless user opts later)

## 11. Acceptance tests (manual)

1. Empty vault: queue empty, no crash  
2. 100+ notes: rescan completes, scores show  
3. Session timer ends → wrap-up  
4. Archive moves file under Archive/Pulse  
5. Snooze removes from next queue until date  
6. Exclude folder notes never appear  
7. Schedule catch-up notice after restart  

## 12. Release checklist

- [ ] `npm run build` produces `main.js`  
- [ ] manifest version = git tag  
- [ ] GitHub Release with 3 assets  
- [ ] README community install instructions  
- [ ] Spec aligned with shipped features  

## 13. Naming

- Plugin display name: **Vault Pulse**  
- Plugin id: **obsidian-pulse**  
- Package name: **obsidian-pulse**

## 14. Implementation priority

P0: index + scorer + queue + session actions + settings + build/release  
P1: schedule + streak + pulse view list  
P2: duplicate clusters polish, i18n, AI optional (out of scope for 0.1.0)
