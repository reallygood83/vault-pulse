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

### 9.1 `manifest.json` (required fields)

| Field | Requirement |
|-------|-------------|
| `id` | `obsidian-pulse` — lowercase, kebab-case, must match repo name, must not change after first release |
| `name` | `Vault Pulse` — display name |
| `version` | semver, no `v` prefix, must match the git release tag exactly |
| `minAppVersion` | lowest Obsidian version using APIs we call (verify against actual API usage, don't guess) |
| `description` | one sentence, no marketing fluff, no "the best/ultimate" language |
| `author` | `reallygood83` |
| `authorUrl` | optional, GitHub profile |
| `fundingUrl` | optional |
| `isDesktopOnly` | **`false`** — MVP must run on mobile without crashing (see 9.4). Only set `true` if a real Node/Electron-only API is used |

⚠️ **Naming risk:** Obsidian's plugin review guidelines discourage using the word
"Obsidian" in a plugin's `id`/`name` (it reads as official/redundant and can be
rejected or require a rename during review). Current id `obsidian-pulse` and repo
name `obsidian-pulse` both contain it. Decide before submitting the review PR:
keep as-is and accept possible reviewer pushback, or rename id/repo/display name
(e.g. `vault-pulse`) before the first tagged release — **id cannot change after
the plugin is accepted into the community list.**

### 9.2 `versions.json`

Maps each released plugin `version` → minimum Obsidian `minAppVersion` required
for that version, e.g.:

```json
{ "0.1.0": "1.4.0" }
```

Required so Obsidian can offer the right version to users on older app builds.
Update on every release; do not delete old entries.

### 9.3 Build & release process

- `npm run build` runs esbuild (`esbuild.config.mjs`, following the
  [sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin) setup)
  and emits `main.js` at repo root — no bundler output in a `dist/` subfolder
  gets shipped as the release asset.
- `main.js`, `manifest.json`, and `styles.css` (if present) must be uploaded as
  **individual binary attachments** on the GitHub Release — not only inside the
  source `.zip`/`.tar.gz` GitHub generates automatically. BRAT and the
  community plugin installer fetch these files directly by name.
- Release tag = exact `version` string in `manifest.json` (no `v` prefix, e.g.
  tag `0.1.0` not `v0.1.0`).
- A `version-bump.mjs` script (per sample plugin convention) should sync
  `package.json` → `manifest.json` + `versions.json` on release to avoid
  manual drift.
- GitHub Actions workflow (optional but recommended): build + attach assets on
  tag push, so releases are reproducible and not hand-assembled.
- `node_modules/`, `.git`, source `.ts` files are **not** part of the release
  assets (already excluded via `.gitignore` for the repo; release assets are
  the 2–3 built files only).

### 9.4 Security (hard requirements, reviewer will check)

- No `eval()`, `new Function()`, or dynamic `require()`/`import()` of remote
  or user-supplied code.
- No network calls of any kind (`fetch`, `XMLHttpRequest`, `require('http')`,
  telemetry/analytics SDKs) — MVP is fully offline; this must remain true even
  in error paths (no silent crash reporting pings).
- No obfuscated/minified-only source in the repo — `main.js` may be bundled,
  but the readable TypeScript source producing it must be in the repo and
  match what's shipped.
- Vault note content is data, never executed. Note text feeding into
  scoring/keyword matching (`avoidance` signal, titles, etc.) is treated as
  plain text only.
- All file reads/writes go through the Obsidian **Vault/Adapter API**
  (`vault.read`, `vault.modify`, `fileManager.renameFile`, etc.) — no direct
  Node `fs` calls, no OS-specific absolute paths.
- Rendering note-derived strings (titles, explain strings) into the DOM uses
  `createEl`/`setText`, never `innerHTML`/`outerHTML` with unsanitized
  content, to stay CSP-safe and avoid injected-note-title XSS.

### 9.5 Mobile safety

- `isDesktopOnly: false` — plugin must load without throwing on iOS/Android.
- No Node-only APIs (`fs`, `path`, `child_process`, `os`) anywhere in the
  bundle; use Obsidian's `normalizePath` and Vault API instead.
- The daily **schedule** (§6.5) has no OS-level cron on mobile: on mobile it
  either no-ops or shows a `Notice` on next app-open catch-up — it must never
  throw/crash the app when a scheduler API is unavailable.
- Session timer must use `setInterval`/`setTimeout` (both work on mobile),
  not any desktop-only timer/notification API.
- All views/modals must render usably on small screens (no fixed pixel
  widths that overflow on phone screens).

### 9.6 Code & repo conventions

- Follow [Obsidian sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
  file layout and `package.json` scripts (`dev`, `build`).
- `onunload()` cleans up everything `onload()` registered (intervals, DOM
  listeners not added via `registerEvent`/`registerDomEvent`, open views) —
  no leaks on plugin disable/reload.
- Settings UI extends `PluginSettingTab`; no custom global CSS that overrides
  Obsidian theme variables — use Obsidian's CSS classes (`mod-cta`, etc.) and
  theme-variable-based `styles.css` so the plugin looks correct in both light
  and dark themes and with custom community themes.
- TypeScript strict mode on; no `any` used to silence real type errors.
- README documents: what it does, install (community list + manual/BRAT),
  usage, all settings, and an explicit **privacy statement** (local-only, no
  network, no telemetry).
- LICENSE: MIT, present at repo root.
- No `node_modules` committed; `.gitignore` already covers this.

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
8. Mobile (iOS/Android or mobile emulation): plugin loads without error,
   session view usable, schedule no-ops or shows Notice only  
9. Disable/re-enable plugin (or reload) repeatedly: no duplicate intervals,
   listeners, or leaked views

## 12. Release checklist

- [ ] `npm run build` produces `main.js` at repo root (no stray `dist/`)
- [ ] `manifest.json` version, `versions.json` entry, and git tag all match exactly
- [ ] `isDesktopOnly` reflects actual API usage (`false` unless a real
      Node/Electron-only API is used)
- [ ] GitHub Release with 3 individually-attached binary assets: `main.js`,
      `manifest.json`, `styles.css` (if used) — not just the auto-generated
      source archive
- [ ] README: install (community + manual/BRAT), usage, full settings list,
      privacy statement (local-only, no network, no telemetry)
- [ ] LICENSE (MIT) present at repo root
- [ ] No `eval`/remote code fetch/network calls anywhere in `main.js`
- [ ] Mobile smoke test passed (see Acceptance test 8)
- [ ] Spec aligned with shipped features
- [ ] Naming decision (see §13) made and applied consistently across
      `manifest.json` id/name, repo name, and README before submitting the
      community-plugins.json review PR

## 13. Naming

- Plugin display name: **Vault Pulse**  
- Plugin id: **obsidian-pulse**  
- Package name: **obsidian-pulse**

⚠️ See §9.1 naming risk: id/repo name containing "obsidian" may draw reviewer
pushback. This is an open decision, not yet resolved — pick one before the
first tagged release since the id is immutable after community-list
acceptance:
- **Option A:** keep `obsidian-pulse` everywhere, accept review risk.
- **Option B:** rename id/repo/package to `vault-pulse` (display name
  "Vault Pulse" stays either way) before first release.

## 14. Implementation priority

P0: index + scorer + queue + session actions + settings + build/release  
P1: schedule + streak + pulse view list  
P2: duplicate clusters polish, i18n, AI optional (out of scope for 0.1.0)
