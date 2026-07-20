export interface PulseWeights {
  stale: number;
  orphan: number;
  duplicate: number;
  avoidance: number;
}

export interface PulseSettings {
  staleDays: number;
  sessionMinutes: number;
  sessionTargetCount: number | "auto";
  excludeFolders: string[];
  archiveFolder: string;
  snoozeDays: number;
  scheduleEnabled: boolean;
  scheduleTime: string;
  weights: PulseWeights;
  maxPerFolder: number;
  /** path -> ISO date until which note is snoozed */
  snoozeUntil: Record<string, string>;
  streakDays: number;
  lastSessionDate: string;
  lastSessionCompleted: boolean;
}

export interface NoteIndexEntry {
  path: string;
  mtime: number;
  title: string;
  size: number;
  outLinks: number;
  inLinks: number;
  titleKey: string;
  prefixHash: string;
  tags: string[];
  hasAvoidance: boolean;
}

export interface PulseIndexData {
  version: number;
  updatedAt: number;
  notes: Record<string, NoteIndexEntry>;
}

export type PulseSignal =
  | "stale"
  | "orphan"
  | "duplicate"
  | "avoidance";

export interface ScoredNote {
  path: string;
  title: string;
  score: number;
  signals: PulseSignal[];
  explain: string;
  daysStale: number;
  inLinks: number;
  clusterKey?: string;
}

export interface SessionStats {
  opened: number;
  archived: number;
  snoozed: number;
  skipped: number;
  target: number;
}

export const DEFAULT_SETTINGS: PulseSettings = {
  staleDays: 90,
  sessionMinutes: 20,
  sessionTargetCount: "auto",
  excludeFolders: ["Archive", "Templates", "attachments", ".trash"],
  archiveFolder: "Archive/Pulse",
  snoozeDays: 7,
  scheduleEnabled: false,
  scheduleTime: "21:00",
  weights: {
    stale: 1,
    orphan: 1,
    duplicate: 1,
    avoidance: 1,
  },
  maxPerFolder: 3,
  snoozeUntil: {},
  streakDays: 0,
  lastSessionDate: "",
  lastSessionCompleted: false,
};
