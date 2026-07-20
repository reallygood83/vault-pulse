import type { ScoredNote, SessionStats } from "../types";

/**
 * Session lives in the plugin, not only in the Modal.
 * Closing the modal pauses; timer continues; resume reopens UI.
 */
export class ActiveSession {
  queue: ScoredNote[];
  index = 0;
  remainingSec: number;
  stats: SessionStats;
  paused = false;
  ended = false;
  private timerId: number | null = null;
  private onTick: (() => void) | null = null;
  private onTimeUp: (() => void) | null = null;

  constructor(queue: ScoredNote[], minutes: number) {
    this.queue = queue;
    this.remainingSec = Math.max(60, minutes * 60);
    this.stats = {
      opened: 0,
      archived: 0,
      snoozed: 0,
      skipped: 0,
      target: queue.length,
    };
  }

  get current(): ScoredNote | null {
    if (this.index >= this.queue.length) return null;
    return this.queue[this.index];
  }

  get doneCount(): number {
    return (
      this.stats.opened +
      this.stats.archived +
      this.stats.snoozed +
      this.stats.skipped
    );
  }

  isSuccess(): boolean {
    return this.stats.target > 0 && this.doneCount / this.stats.target >= 0.5;
  }

  startTimer(onTick: () => void, onTimeUp: () => void): void {
    this.onTick = onTick;
    this.onTimeUp = onTimeUp;
    if (this.timerId != null) window.clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      if (this.ended) return;
      if (this.remainingSec <= 0) {
        this.stopTimer();
        this.onTimeUp?.();
        return;
      }
      this.remainingSec -= 1;
      this.onTick?.();
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerId != null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Open note: count once, do NOT advance card (user may edit then return). */
  markOpened(): void {
    this.stats.opened += 1;
  }

  advanceAfterResolve(
    kind: "archive" | "snooze" | "skip" | "done"
  ): boolean {
    if (kind === "archive") this.stats.archived += 1;
    if (kind === "snooze") this.stats.snoozed += 1;
    if (kind === "skip") this.stats.skipped += 1;
    // "done" = user finished with opened note without archive
    this.index += 1;
    return this.index >= this.queue.length;
  }

  end(): void {
    this.ended = true;
    this.stopTimer();
  }
}
