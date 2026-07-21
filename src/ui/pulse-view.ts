import { ItemView, WorkspaceLeaf } from "obsidian";
import { t, type PulseLocale } from "../i18n";
import type { ScoredNote } from "../types";

export const PULSE_VIEW_TYPE = "note-sweep-view";

export class PulseView extends ItemView {
  private queue: ScoredNote[] = [];
  private locale: PulseLocale = "en";
  private onStart: (() => void) | null = null;
  private onRefresh: (() => Promise<void>) | null = null;
  private onOpenNote: ((path: string) => void) | null = null;
  private onDeleteNote: ((path: string) => void) | null = null;
  private onUpdateInfo: ((path: string) => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return PULSE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Note Sweep";
  }

  getIcon(): string {
    return "activity";
  }

  setHandlers(opts: {
    onStart: () => void;
    onRefresh: () => Promise<void>;
    onOpenNote: (path: string) => void;
    onDeleteNote: (path: string) => void;
    onUpdateInfo: (path: string) => void;
  }): void {
    this.onStart = opts.onStart;
    this.onRefresh = opts.onRefresh;
    this.onOpenNote = opts.onOpenNote;
    this.onDeleteNote = opts.onDeleteNote;
    this.onUpdateInfo = opts.onUpdateInfo;
  }

  setLocale(locale: PulseLocale): void {
    this.locale = locale;
    this.render();
  }

  setQueue(queue: ScoredNote[]): void {
    this.queue = queue;
    this.render();
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private render(): void {
    const L = this.locale;
    const root = this.contentEl;
    root.empty();
    root.addClass("pulse-view");

    root.createEl("h2", { text: t(L, "pluginName") });
    root.createEl("p", {
      cls: "pulse-muted",
      text: t(L, "viewSubtitle"),
    });

    const toolbar = root.createDiv({ cls: "pulse-toolbar" });
    const startBtn = toolbar.createEl("button", {
      text: t(L, "startSession"),
      cls: "mod-cta",
    });
    startBtn.onclick = () => this.onStart?.();
    const refreshBtn = toolbar.createEl("button", {
      text: t(L, "rebuildQueue"),
    });
    refreshBtn.onclick = () => void this.onRefresh?.();

    root.createEl("h3", {
      text: `${t(L, "todayQueue")} (${this.queue.length})`,
    });
    if (this.queue.length === 0) {
      root.createEl("p", { text: t(L, "emptyQueue") });
      return;
    }

    const list = root.createEl("ul", { cls: "pulse-queue-list" });
    for (const n of this.queue) {
      const li = list.createEl("li");
      li.addClass("pulse-queue-item");

      const body = li.createDiv({ cls: "pulse-q-body" });
      body.setAttr("role", "button");
      body.setAttr("tabindex", "0");
      body.setAttr("title", t(L, "clickToOpen"));
      body.onclick = (e) => {
        e.preventDefault();
        this.onOpenNote?.(n.path);
      };
      body.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onOpenNote?.(n.path);
        }
      };

      const title = body.createDiv({
        cls: "pulse-q-title",
        text: n.title,
      });
      title.setAttr("title", n.path);
      body.createDiv({ cls: "pulse-q-explain", text: n.explain });
      body.createDiv({
        cls: "pulse-q-score",
        text: `${t(L, "score")} ${n.score.toFixed(1)}`,
      });

      const actions = li.createDiv({ cls: "pulse-q-actions" });

      const openBtn = actions.createEl("button", {
        text: t(L, "open"),
        cls: "pulse-mini-btn",
      });
      openBtn.onclick = (e) => {
        e.stopPropagation();
        this.onOpenNote?.(n.path);
      };

      const updateBtn = actions.createEl("button", {
        text: t(L, "updateInfo"),
        cls: "pulse-mini-btn mod-cta",
      });
      updateBtn.setAttr("title", t(L, "updateInfoTooltip"));
      updateBtn.onclick = (e) => {
        e.stopPropagation();
        this.onUpdateInfo?.(n.path);
      };

      const delBtn = actions.createEl("button", {
        text: t(L, "delete"),
        cls: "pulse-mini-btn pulse-danger",
      });
      delBtn.setAttr("title", t(L, "deleteTooltip"));
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.onDeleteNote?.(n.path);
      };
    }
  }
}
