import type { PulseSettings, ScoredNote } from "../types";
import { parentFolder } from "../utils/text";

/** Daily queue / session card count. auto ≈ minutes/1.5 (5–30). Custom: 1–100. */
export function targetCount(settings: PulseSettings): number {
  if (settings.sessionTargetCount === "auto") {
    return Math.min(30, Math.max(5, Math.floor(settings.sessionMinutes / 1.5)));
  }
  return Math.min(100, Math.max(1, settings.sessionTargetCount));
}

/**
 * Ranked scored notes → diversified Today queue.
 */
export function buildTodayQueue(
  scored: ScoredNote[],
  settings: PulseSettings
): ScoredNote[] {
  const limit = targetCount(settings);
  const perFolder = new Map<string, number>();
  const perCluster = new Map<string, number>();
  const out: ScoredNote[] = [];

  for (const note of scored) {
    if (out.length >= limit) break;

    const folder = parentFolder(note.path) || "(root)";
    const fCount = perFolder.get(folder) ?? 0;
    if (fCount >= settings.maxPerFolder) continue;

    if (note.clusterKey) {
      const c = perCluster.get(note.clusterKey) ?? 0;
      if (c >= 2) continue;
      perCluster.set(note.clusterKey, c + 1);
    }

    perFolder.set(folder, fCount + 1);
    out.push(note);
  }

  return out;
}
