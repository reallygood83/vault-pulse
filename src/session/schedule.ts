import type { PulseSettings } from "../types";
import { parseScheduleTime, todayKey } from "../utils/text";

export function shouldOfferCatchUpSession(settings: PulseSettings, now = new Date()): boolean {
  if (!settings.scheduleEnabled) return false;
  if (settings.lastSessionDate === todayKey(now) && settings.lastSessionCompleted) {
    return false;
  }
  const t = parseScheduleTime(settings.scheduleTime);
  if (!t) return false;
  const scheduled = new Date(now);
  scheduled.setHours(t.h, t.m, 0, 0);
  return now.getTime() >= scheduled.getTime();
}

export function msUntilNextSchedule(settings: PulseSettings, now = new Date()): number | null {
  if (!settings.scheduleEnabled) return null;
  const t = parseScheduleTime(settings.scheduleTime);
  if (!t) return null;
  const next = new Date(now);
  next.setHours(t.h, t.m, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}
