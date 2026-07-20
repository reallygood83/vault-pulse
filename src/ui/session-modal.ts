import { App, Modal, Notice, Setting } from "obsidian";
import { t, type PulseLocale } from "../i18n";
import type { ScoredNote, SessionStats } from "../types";

export type SessionAction = "open" | "archive" | "snooze" | "skip";

export interface SessionModalHandlers {
  onAction: (note: ScoredNote, action: SessionAction) => Promise<void>;
  onComplete: (stats: SessionStats, completed: boolean) => void;
  minutes: number;
  locale: PulseLocale;
}

export class SessionModal extends Modal {
  private queue: ScoredNote[];
  private index = 0;
  private remainingSec: number;
  private timerId: number | null = null;
  private stats: SessionStats;
  private handlers: SessionModalHandlers;
  private locale: PulseLocale;
  private statusEl!: HTMLElement;
  private cardEl!: HTMLElement;
  private timerEl!: HTMLElement;
  private closed = false;

  constructor(
    app: App,
    queue: ScoredNote[],
    handlers: SessionModalHandlers
  ) {
    super(app);
    this.queue = queue;
    this.handlers = handlers;
    this.locale = handlers.locale;
    this.remainingSec = Math.max(60, handlers.minutes * 60);
    this.stats = {
      opened: 0,
      archived: 0,
      snoozed: 0,
      skipped: 0,
      target: queue.length,
    };
  }

  onOpen(): void {
    const { contentEl } = this;
    const L = this.locale;
    contentEl.empty();
    contentEl.addClass("pulse-session-modal");

    contentEl.createEl("h2", { text: t(L, "sessionTitle") });
    this.timerEl = contentEl.createDiv({ cls: "pulse-timer" });
    this.statusEl = contentEl.createDiv({ cls: "pulse-status" });
    this.cardEl = contentEl.createDiv({ cls: "pulse-card" });

    const actions = contentEl.createDiv({ cls: "pulse-actions" });
    new Setting(actions)
      .addButton((b) =>
        b
          .setButtonText(t(L, "open"))
          .setCta()
          .onClick(() => void this.act("open"))
      )
      .addButton((b) =>
        b
          .setButtonText(t(L, "archive"))
          .onClick(() => void this.act("archive"))
      )
      .addButton((b) =>
        b.setButtonText(t(L, "snooze")).onClick(() => void this.act("snooze"))
      )
      .addButton((b) =>
        b.setButtonText(t(L, "skip")).onClick(() => void this.act("skip"))
      );

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText(t(L, "endSession"))
        .onClick(() => this.finish(false))
    );

    this.renderCard();
    this.tickTimer();
    this.timerId = window.setInterval(() => this.tickTimer(), 1000);
  }

  onClose(): void {
    if (this.timerId != null) window.clearInterval(this.timerId);
    if (!this.closed) {
      this.closed = true;
      this.handlers.onComplete(this.stats, this.isSuccess());
    }
  }

  private tickTimer(): void {
    if (this.remainingSec <= 0) {
      this.finish(true);
      return;
    }
    const m = Math.floor(this.remainingSec / 60);
    const s = this.remainingSec % 60;
    this.timerEl.setText(
      `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${t(this.locale, "remaining")}`
    );
    this.remainingSec -= 1;
  }

  private renderCard(): void {
    const L = this.locale;
    const done =
      this.stats.opened +
      this.stats.archived +
      this.stats.snoozed +
      this.stats.skipped;
    this.statusEl.setText(
      t(L, "cardProgress", {
        current: Math.min(this.index + 1, this.queue.length),
        total: this.queue.length,
        done,
      })
    );

    this.cardEl.empty();
    if (this.index >= this.queue.length) {
      this.cardEl.createEl("p", { text: t(L, "queueComplete") });
      return;
    }
    const note = this.queue[this.index];
    this.cardEl.createEl("h3", { text: note.title });
    this.cardEl.createEl("p", { cls: "pulse-explain", text: note.explain });
    this.cardEl.createEl("p", {
      cls: "pulse-path",
      text: note.path,
    });
  }

  private async act(action: SessionAction): Promise<void> {
    if (this.index >= this.queue.length) return;
    const note = this.queue[this.index];
    try {
      await this.handlers.onAction(note, action);
    } catch (e) {
      console.error(e);
      new Notice(t(this.locale, "actionFailed"));
      return;
    }
    if (action === "open") this.stats.opened += 1;
    if (action === "archive") this.stats.archived += 1;
    if (action === "snooze") this.stats.snoozed += 1;
    if (action === "skip") this.stats.skipped += 1;

    this.index += 1;
    if (this.index >= this.queue.length) {
      this.finish(true);
      return;
    }
    this.renderCard();
  }

  private isSuccess(): boolean {
    const done =
      this.stats.opened +
      this.stats.archived +
      this.stats.snoozed +
      this.stats.skipped;
    return this.stats.target > 0 && done / this.stats.target >= 0.5;
  }

  private finish(auto: boolean): void {
    if (this.closed) return;
    this.closed = true;
    if (this.timerId != null) window.clearInterval(this.timerId);
    this.handlers.onComplete(this.stats, this.isSuccess());
    if (auto) new Notice(t(this.locale, "timeUp"));
    this.close();
  }
}
