/** Normalize title for duplicate detection */
export function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePrefix(text: string, maxLen = 120): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
    .toLowerCase();
}

/** Simple non-crypto hash for prefix clustering */
export function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

const AVOIDANCE_RE =
  /(?:#someday|\bsomeday\b|\btodo\b|\blater\b|나중에|언젠가|할일|미루)/i;

export function hasAvoidanceMarkers(text: string): boolean {
  return AVOIDANCE_RE.test(text);
}

export function parentFolder(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

export function basenameTitle(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.md$/i, "");
}

export function daysBetween(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseScheduleTime(hhmm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

export function addDaysIso(days: number, from = new Date()): string {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isSnoozed(untilIso: string | undefined, now = Date.now()): boolean {
  if (!untilIso) return false;
  const t = Date.parse(untilIso);
  return !Number.isNaN(t) && t > now;
}
