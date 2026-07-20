# Vault Pulse — Architecture Notes

Short implementer reference. Full product/functional spec: `../SPEC.md`.

## Data flow

```
vault events (modify/create/delete/rename)
  -> index/vault-index.ts   incremental scan, builds NoteRecord[] + link graph
  -> engine/scorer.ts       pure fn: NoteRecord[] + settings -> ScoredNote[]
  -> engine/queue.ts        pure fn: ScoredNote[] + settings -> TodayQueue
  -> ui/pulse-view.ts        renders TodayQueue
  -> session/session.ts     timer + one-card-at-a-time actions
  -> user action (open/archive/snooze/skip)
  -> index/vault-index.ts   persist snooze/streak state, update cache
```

## Module boundaries

- **`index/vault-index.ts`** — the only module that touches `Vault`/`MetadataCache`
  APIs for scanning. Owns the on-disk cache (`pulse-index.json`) and the
  incremental update lifecycle. Nothing else reads vault files directly.
- **`engine/scorer.ts`** and **`engine/queue.ts`** — pure functions, no
  Obsidian API calls, no I/O. Take data in, return data out. This is what
  makes them unit-testable without a live vault.
- **`session/session.ts`** — owns the timer and streak/stat mutations. Calls
  into `vault-index` for archive/snooze persistence, never touches raw files.
- **`session/schedule.ts`** — desktop: local time check + catch-up on load.
  Mobile: must degrade to no-op or a single `Notice`, never throw (see
  `SPEC.md` §9.5).
- **`ui/*`** — presentation only; no scoring/business logic. Views call into
  `engine/queue.ts` output and `session/session.ts` actions.

## State & persistence

- Everything lives under the plugin's own data file (`loadData`/`saveData`),
  scoped to the vault. No writes outside plugin data except explicit user
  actions (archive = `fileManager.renameFile`/move).
- Snooze/streak state is plugin data, not frontmatter, per `SPEC.md` §10.

## Why this split

Keeping `scorer`/`queue` pure and Obsidian-API-free means the ranking logic
can be tested with plain arrays and no mocked `Vault`, and keeps the one
module that talks to the real filesystem (`vault-index`) small enough to
audit for the security requirements in `SPEC.md` §9.4.
