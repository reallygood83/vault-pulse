import { ItemView, WorkspaceLeaf } from "obsidian";
import { t, type PulseLocale } from "../i18n";
import type { ScoredNote } from "../types";

export const PULSE_VIEW_TYPE = "vault-pulse-view";

export class PulseView extends ItemView {
  private queue: ScoredNote[] = [];
  private locale: PulseLocale = "en";
  private onStart: (() => void) | null = null;
  private onRefresh: (() => Promise<void>) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return PULSE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Vault Pulse";
  }

  getIcon(): string {
    return "activity";
  }

  setHandlers(opts: {
    onStart: () => void;
    onRefresh: () => Promise<void>;
  }): void {
    this.onStart = opts.onStart;
    this.onRefresh = opts.onRefresh;
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
      const title = li.createEl("div", { cls: "pulse-q-title", text: n.title });
      title.setAttr("title", n.path);
      li.createEl("div", { cls: "pulse-q-explain", text: n.explain });
      li.createEl("div", {
        cls: "pulse-q-score",
        text: `${t(L, "score")} ${n.score.toFixed(1)}`,
      });
    }
  }
}
