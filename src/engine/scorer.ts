import type {
  NoteIndexEntry,
  PulseSettings,
  PulseSignal,
  ScoredNote,
} from "../types";
import { daysBetween, isSnoozed } from "../utils/text";

export function buildDuplicateClusters(
  notes: Record<string, NoteIndexEntry>
): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  for (const n of Object.values(notes)) {
    if (n.titleKey) {
      const k = `t:${n.titleKey}`;
      const arr = byKey.get(k) ?? [];
      arr.push(n.path);
      byKey.set(k, arr);
    }
    if (n.prefixHash && n.size > 40) {
      const k = `p:${n.prefixHash}`;
      const arr = byKey.get(k) ?? [];
      arr.push(n.path);
      byKey.set(k, arr);
    }
  }
  // only clusters size >= 2, unique paths
  const clusters = new Map<string, string[]>();
  for (const [k, paths] of byKey) {
    const uniq = [...new Set(paths)];
    if (uniq.length >= 2) clusters.set(k, uniq);
  }
  return clusters;
}

export function scoreNotes(
  notes: Record<string, NoteIndexEntry>,
  settings: PulseSettings,
  now = Date.now()
): ScoredNote[] {
  const clusters = buildDuplicateClusters(notes);
  const pathToCluster = new Map<string, string>();
  for (const [ck, paths] of clusters) {
    for (const p of paths) {
      // prefer title clusters over prefix if both
      if (!pathToCluster.has(p) || ck.startsWith("t:")) {
        pathToCluster.set(p, ck);
      }
    }
  }

  const scored: ScoredNote[] = [];

  for (const n of Object.values(notes)) {
    if (isSnoozed(settings.snoozeUntil[n.path], now)) continue;

    const daysStale = daysBetween(n.mtime, now);
    const signals: PulseSignal[] = [];
    let score = 0;
    const w = settings.weights;

    // hard skip: very fresh
    if (daysStale < 3) continue;

    if (daysStale >= settings.staleDays) {
      signals.push("stale");
      const capped = Math.min(daysStale, 365);
      const staleScore =
        40 * ((capped - settings.staleDays) / (365 - settings.staleDays + 1) + 0.3);
      score += w.stale * Math.min(40, Math.max(12, staleScore));
    }

    if (n.inLinks === 0) {
      signals.push("orphan");
      score += w.orphan * 30;
    }

    const ck = pathToCluster.get(n.path);
    if (ck) {
      signals.push("duplicate");
      score += w.duplicate * 25;
    }

    if (n.hasAvoidance) {
      signals.push("avoidance");
      score += w.avoidance * 10;
    }

    // recent activity soft penalty already via skip <3d; extra for <14d
    if (daysStale < 14) score *= 0.5;

    if (signals.length === 0 || score <= 0) continue;

    scored.push({
      path: n.path,
      title: n.title,
      score,
      signals,
      explain: buildExplain(signals, daysStale, n.inLinks, n.path),
      daysStale,
      inLinks: n.inLinks,
      clusterKey: ck,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function buildExplain(
  signals: PulseSignal[],
  daysStale: number,
  inLinks: number,
  path: string
): string {
  const parts: string[] = [];
  if (signals.includes("stale")) parts.push(`Stale ${daysStale}d`);
  if (signals.includes("orphan")) parts.push("Orphan");
  if (signals.includes("duplicate")) parts.push("Duplicate");
  if (signals.includes("avoidance")) parts.push("Avoidance");
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "/";
  parts.push(folder === "" ? "root" : folder);
  void inLinks;
  return parts.join(" · ");
}
