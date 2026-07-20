# Vault Pulse — Community Plugin Review Checklist

Pass/fail checklist for reviewing a build before tagging a release or opening
the `obsidian-releases` community-plugins.json PR. Mirrors what Obsidian
reviewers and BRAT/community installers actually check. See `SPEC.md` §9 for
rationale on each item.

Mark each `PASS` / `FAIL` / `N/A` before release.

## Manifest & versioning

- [ ] `manifest.json` present at repo root with: `id`, `name`, `version`,
      `minAppVersion`, `description`, `author`, `isDesktopOnly`
- [ ] `id` is lowercase kebab-case, matches repo name, unchanged from any
      prior release
- [ ] `version` has no `v` prefix and matches the git release tag exactly
- [ ] `minAppVersion` verified against actual Obsidian API calls used (not
      guessed)
- [ ] `isDesktopOnly` is `false` unless a genuine Node/Electron-only API is
      used
- [ ] `description` is one plain sentence, no superlative marketing language
- [ ] `versions.json` has an entry for this `version` → `minAppVersion`, old
      entries preserved

## Naming

- [ ] Decision made per SPEC §13 (keep `obsidian-pulse` or rename to
      `vault-pulse`) and applied consistently in `manifest.json` id/name,
      repo name, README, and package name

## Build & release assets

- [ ] `npm run build` succeeds from a clean clone (no local-only state)
- [ ] `main.js` is emitted at repo root, not a subfolder
- [ ] GitHub Release has `main.js`, `manifest.json`, and `styles.css` (if
      present) attached as **individual binary assets**, not only inside the
      auto-generated source zip/tarball
- [ ] `node_modules/`, `.git/`, and `.ts` source are not part of the release
      assets
- [ ] Repo root has no leftover `dist/`/build artifacts committed

## Security

- [ ] No `eval()` / `new Function()` / dynamic `require`/`import` of
      remote or user-supplied strings anywhere in source or bundled `main.js`
- [ ] No network calls anywhere (`fetch`, `XMLHttpRequest`, `http`/`https`
      modules, analytics/telemetry SDKs) — grep `main.js` for `fetch(` /
      `XMLHttpRequest` / `http.request` and confirm zero real hits
- [ ] All file I/O goes through Obsidian's Vault/Adapter API — no direct
      Node `fs` calls, no hardcoded absolute/OS-specific paths
- [ ] Note-derived strings (titles, tags, explain strings) rendered via
      `createEl`/`setText`, never `innerHTML`/`outerHTML` with raw content
- [ ] Bundled `main.js` is readable/traceable back to the TS source in the
      repo (not hand-obfuscated separately from source)

## Mobile safety

- [ ] Plugin loads on mobile (iOS/Android or mobile emulator) without
      throwing
- [ ] No Node-only APIs (`fs`, `path`, `child_process`, `os`) reachable from
      any code path, including the scheduler
- [ ] Daily schedule feature no-ops or shows a `Notice` on mobile instead of
      crashing when a desktop-only capability is missing
- [ ] Views/modals render usably at phone screen widths

## Lifecycle & code quality

- [ ] `onunload()` reverses everything `onload()` registers (intervals,
      manually-added DOM listeners, open views/leaves)
- [ ] Repeated disable/enable (or hot reload) does not duplicate intervals,
      listeners, or views
- [ ] Settings UI extends `PluginSettingTab`
- [ ] `styles.css` (if present) uses Obsidian theme CSS variables/classes,
      not hardcoded colors — correct in light, dark, and custom themes
- [ ] TypeScript strict mode on; no `any` used to bypass real type errors

## Docs & licensing

- [ ] README covers: what it does, install (community list + manual/BRAT),
      usage, full settings reference, explicit privacy statement (local-only,
      no network, no telemetry)
- [ ] LICENSE file present at repo root (MIT)
- [ ] `.gitignore` excludes `node_modules/`, build intermediates, OS files
- [ ] `SPEC.md` reflects what's actually shipped in this release (no stale
      claims)

## Functional acceptance (manual, see SPEC §11)

- [ ] Empty vault: queue empty, no crash
- [ ] 100+ note vault: rescan completes, scores populate
- [ ] Session timer completes → wrap-up summary shown
- [ ] Archive action moves file under `archiveFolder`, never deletes
- [ ] Snooze removes note from queue until snooze date elapses
- [ ] Excluded folders never surface in the queue
- [ ] Schedule catch-up Notice appears after restart when a session was
      missed

## Sign-off

- [ ] All FAILs above resolved or explicitly accepted as known risk with a
      reason recorded here
- [ ] Reviewer/date: ______________________
