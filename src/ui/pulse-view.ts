import { ItemView, WorkspaceLeaf } from "obsidian";
import type { ScoredNote } from "../types";

export const PULSE_VIEW_TYPE = "vault-pulse-view";

export class PulseView extends ItemView {
  private queue: ScoredNote[] = [];
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

  setQueue(queue: ScoredNote[]): void {
    this.queue = queue;
    this.render();
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("pulse-view");

    root.createEl("h2", { text: "Vault Pulse" });
    root.createEl("p", {
      cls: "pulse-muted",
      text: "Local radar for notes worth triaging. No AI. No network.",
    });

    const toolbar = root.createDiv({ cls: "pulse-toolbar" });
    const startBtn = toolbar.createEl("button", {
      text: "Start session",
      cls: "mod-cta",
    });
    startBtn.onclick = () => this.onStart?.();
    const refreshBtn = toolbar.createEl("button", { text: "Rebuild queue" });
    refreshBtn.onclick = () => void this.onRefresh?.();

    root.createEl("h3", { text: `Today’s queue (${this.queue.length})` });
    if (this.queue.length === 0) {
      root.createEl("p", {
        text: "No signals right now. Rescan after more notes age, or lower Stale days in settings.",
      });
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
        text: `score ${n.score.toFixed(1)}`,
      });
    }
  }
}
