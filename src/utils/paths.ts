import type { PulseSettings } from "../types";

export function isExcludedPath(path: string, settings: PulseSettings): boolean {
  const lower = path.replace(/\\/g, "/");
  for (const folder of settings.excludeFolders) {
    const f = folder.replace(/^\/+|\/+$/g, "");
    if (!f) continue;
    if (lower === f || lower.startsWith(f + "/")) return true;
  }
  return false;
}

export function archiveTargetPath(
  notePath: string,
  archiveFolder: string,
  now = new Date()
): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const base = notePath.split("/").pop() ?? notePath;
  const folder = `${archiveFolder.replace(/\/+$/, "")}/${y}-${m}`;
  return `${folder}/${base}`;
}
