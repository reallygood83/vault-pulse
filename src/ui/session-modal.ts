import { App, Modal, Setting } from "obsidian";
import { t, type PulseLocale } from "../i18n";
import type { ActiveSession } from "../session/active-session";
import type { ScoredNote } from "../types";

export type SessionAction =
  | "open"
  | "archive"
  | "snooze"
  | "skip"
  | "next"
  | "end"
  | "pause";

export interface SessionModalHandlers {
  locale: PulseLocale;
  session: ActiveSession;
  onAction: (note: ScoredNote, action: SessionAction) => Promise<void>;
  /** X / Escape / backdrop — pause, do NOT end session */
  onPause: () => void;
  /** Explicit end session button or timer handled outside */
  onRequestEnd: (auto: boolean) => void;
}

/**
 * Session UI only. Closing this modal pauses the session;
 * the plugin keeps timer + queue alive for resume.
 */
export class SessionModal extends Modal {
  private handlers: SessionModalHandlers;
  private locale: PulseLocale;
  private session: ActiveSession;
  private statusEl!: HTMLElement;
  private cardEl!: HTMLElement;
  private timerEl!: HTMLElement;
  private hintEl!: HTMLElement;
  /** true when we intentionally close without ending (pause / open minimize) */
  private suppressEnd = false;
  private finishing = false;

  constructor(app: App, handlers: SessionModalHandlers) {
    super(app);
    this.handlers = handlers;
    this.locale = handlers.locale;
    this.session = handlers.session;
  }

  onOpen(): void {
    const { contentEl } = this;
    const L = this.locale;
    contentEl.empty();
    contentEl.addClass("pulse-session-modal");

    contentEl.createEl("h2", { text: t(L, "sessionTitle") });
    this.timerEl = contentEl.createDiv({ cls: "pulse-timer" });
    this.statusEl = contentEl.createDiv({ cls: "pulse-status" });
    this.hintEl = contentEl.createDiv({ cls: "pulse-hint pulse-muted" });
    this.hintEl.setText(t(L, "sessionHint"));
    this.cardEl = contentEl.createDiv({ cls: "pulse-card" });

    const actions = contentEl.createDiv({ cls: "pulse-actions" });
    new Setting(actions)
      .addButton((b) =>
        b
          .setButtonText(t(L, "open"))
          .setCta()
          .setTooltip(t(L, "openTooltip"))
          .onClick(() => void this.act("open"))
      )
      .addButton((b) =>
        b
          .setButtonText(t(L, "next"))
          .setTooltip(t(L, "nextTooltip"))
          .onClick(() => void this.act("next"))
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

    const footer = contentEl.createDiv({ cls: "pulse-footer-actions" });
    new Setting(footer)
      .addButton((b) =>
        b
          .setButtonText(t(L, "pauseSession"))
          .setTooltip(t(L, "pauseTooltip"))
          .onClick(() => this.pauseAndClose())
      )
      .addButton((b) =>
        b
          .setButtonText(t(L, "endSession"))
          .setWarning()
          .onClick(() => this.requestEnd(false))
      );

    this.refresh();
    this.session.startTimer(
      () => this.refreshTimerOnly(),
      () => this.requestEnd(true)
    );
  }

  onClose(): void {
    // Do not stop the plugin timer here — only when ending session.
    if (this.finishing) return;
    if (this.suppressEnd) {
      this.suppressEnd = false;
      return;
    }
    // X button / Escape → pause, keep session
    this.handlers.onPause();
  }

  /** Public: refresh after resume or action */
  refresh(): void {
    this.refreshTimerOnly();
    this.renderCard();
  }

  private refreshTimerOnly(): void {
    const sec = this.session.remainingSec;
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    if (this.timerEl) {
      this.timerEl.setText(
        `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${t(this.locale, "remaining")}`
      );
    }
    if (this.statusEl) {
      this.statusEl.setText(
        t(this.locale, "cardProgress", {
          current: Math.min(
            this.session.index + 1,
            this.session.queue.length
          ),
          total: this.session.queue.length,
          done: this.session.doneCount,
        })
      );
    }
  }

  private renderCard(): void {
    const L = this.locale;
    if (!this.cardEl) return;
    this.cardEl.empty();
    const note = this.session.current;
    if (!note) {
      this.cardEl.createEl("p", { text: t(L, "queueComplete") });
      return;
    }
    this.cardEl.createEl("h3", { text: note.title });
    this.cardEl.createEl("p", { cls: "pulse-explain", text: note.explain });
    this.cardEl.createEl("p", { cls: "pulse-path", text: note.path });
  }

  private async act(action: SessionAction): Promise<void> {
    const note = this.session.current;
    if (!note && action !== "end") return;
    try {
      if (note) await this.handlers.onAction(note, action);
    } catch {
      return;
    }

    if (action === "open") {
      // Minimize so user can edit; session continues
      this.pauseAndClose();
      return;
    }

    if (
      action === "archive" ||
      action === "snooze" ||
      action === "skip" ||
      action === "next"
    ) {
      const finished = this.session.advanceAfterResolve(
        action === "next" ? "done" : action
      );
      if (finished) {
        this.requestEnd(false);
        return;
      }
      this.refresh();
    }
  }

  private pauseAndClose(): void {
    this.suppressEnd = true;
    this.session.paused = true;
    this.handlers.onPause();
    this.close();
  }

  private requestEnd(auto: boolean): void {
    if (this.finishing) return;
    this.finishing = true;
    this.suppressEnd = true;
    this.handlers.onRequestEnd(auto);
    this.close();
  }
}
