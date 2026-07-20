import {
  Notice,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { VaultIndex } from "./index/vault-index";
import { scoreNotes } from "./engine/scorer";
import { buildTodayQueue } from "./engine/queue";
import {
  msUntilNextSchedule,
  shouldOfferCatchUpSession,
} from "./session/schedule";
import { PulseSettingTab } from "./settings";
import {
  DEFAULT_SETTINGS,
  type PulseIndexData,
  type PulseSettings,
  type ScoredNote,
  type SessionStats,
} from "./types";
import { SessionModal, type SessionAction } from "./ui/session-modal";
import { PULSE_VIEW_TYPE, PulseView } from "./ui/pulse-view";
import { archiveTargetPath } from "./utils/paths";
import { addDaysIso, todayKey } from "./utils/text";

interface PluginData {
  settings: PulseSettings;
  index: PulseIndexData | null;
}

export default class VaultPulsePlugin extends Plugin {
  settings: PulseSettings = { ...DEFAULT_SETTINGS, weights: { ...DEFAULT_SETTINGS.weights }, snoozeUntil: {}, excludeFolders: [...DEFAULT_SETTINGS.excludeFolders] };
  private index!: VaultIndex;
  private scheduleTimer: number | null = null;
  private cachedQueue: ScoredNote[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();

    this.index = new VaultIndex(
      this.app,
      () => this.settings,
      async (data) => {
        await this.saveData({ settings: this.settings, index: data } satisfies PluginData);
      },
      async () => {
        const raw = (await this.loadData()) as PluginData | null;
        return raw?.index ?? null;
      }
    );
    await this.index.init();

    this.registerView(PULSE_VIEW_TYPE, (leaf) => {
      const view = new PulseView(leaf);
      view.setHandlers({
        onStart: () => void this.startSession(),
        onRefresh: async () => {
          await this.rebuildQueue(true);
          this.refreshOpenViews();
        },
      });
      return view;
    });

    this.addRibbonIcon("activity", "Vault Pulse", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "pulse-start-session",
      name: "Start Pulse session",
      callback: () => void this.startSession(),
    });

    this.addCommand({
      id: "pulse-open-view",
      name: "Open Pulse view",
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "pulse-rescan",
      name: "Rescan vault index",
      callback: () => void this.rescan(),
    });

    this.addSettingTab(new PulseSettingTab(this.app, this));

    // Background first index
    void this.app.workspace.onLayoutReady(async () => {
      await this.index.ensureReady();
      await this.rebuildQueue(false);
      this.refreshOpenViews();
      this.reschedule();
      if (shouldOfferCatchUpSession(this.settings)) {
        new Notice("Vault Pulse: catch-up session available. Run “Start Pulse session”.");
      }
    });
  }

  onunload(): void {
    if (this.scheduleTimer != null) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    // Detach pulse leaves so hot-reload does not stack views
    for (const leaf of this.app.workspace.getLeavesOfType(PULSE_VIEW_TYPE)) {
      leaf.detach();
    }
  }

  async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) as PluginData | null;
    if (raw?.settings) {
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...raw.settings,
        weights: { ...DEFAULT_SETTINGS.weights, ...raw.settings.weights },
        excludeFolders:
          raw.settings.excludeFolders ?? [...DEFAULT_SETTINGS.excludeFolders],
        snoozeUntil: raw.settings.snoozeUntil ?? {},
      };
    }
  }

  async saveSettings(): Promise<void> {
    const raw = (await this.loadData()) as PluginData | null;
    await this.saveData({
      settings: this.settings,
      index: raw?.index ?? null,
    } satisfies PluginData);
  }

  reschedule(): void {
    if (this.scheduleTimer != null) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    const ms = msUntilNextSchedule(this.settings);
    if (ms == null) return;
    this.scheduleTimer = window.setTimeout(() => {
      new Notice("Vault Pulse: scheduled triage time.");
      void this.startSession();
      this.reschedule();
    }, ms);
  }

  async rescan(): Promise<void> {
    new Notice("Vault Pulse: scanning vault…");
    await this.index.fullRebuild();
    await this.rebuildQueue(false);
    this.refreshOpenViews();
    new Notice("Vault Pulse: scan complete.");
  }

  async rebuildQueue(forceRescan: boolean): Promise<void> {
    if (forceRescan) await this.index.fullRebuild();
    else await this.index.ensureReady();
    const scored = scoreNotes(this.index.entries, this.settings);
    this.cachedQueue = buildTodayQueue(scored, this.settings);
  }

  private refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(PULSE_VIEW_TYPE)) {
      const v = leaf.view;
      if (v instanceof PulseView) v.setQueue(this.cachedQueue);
    }
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const existing = workspace.getLeavesOfType(PULSE_VIEW_TYPE);
    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: PULSE_VIEW_TYPE, active: true });
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
      await this.rebuildQueue(false);
      this.refreshOpenViews();
    }
  }

  async startSession(): Promise<void> {
    await this.rebuildQueue(false);
    if (this.cachedQueue.length === 0) {
      new Notice("Vault Pulse: nothing to triage right now.");
      return;
    }
    const queue = [...this.cachedQueue];
    new SessionModal(this.app, queue, {
      minutes: this.settings.sessionMinutes,
      onAction: (note, action) => this.handleAction(note, action),
      onComplete: (stats, completed) => void this.finishSession(stats, completed),
    }).open();
  }

  private async handleAction(
    note: ScoredNote,
    action: SessionAction
  ): Promise<void> {
    if (action === "open") {
      const file = this.app.vault.getAbstractFileByPath(note.path);
      if (file instanceof TFile) {
        await this.app.workspace.getLeaf(false).openFile(file);
      }
      return;
    }
    if (action === "snooze") {
      this.settings.snoozeUntil[note.path] = addDaysIso(this.settings.snoozeDays);
      await this.saveSettings();
      return;
    }
    if (action === "skip") return;
    if (action === "archive") {
      const file = this.app.vault.getAbstractFileByPath(note.path);
      if (!(file instanceof TFile)) return;
      const dest = archiveTargetPath(note.path, this.settings.archiveFolder);
      const folder = dest.slice(0, dest.lastIndexOf("/"));
      await this.ensureFolder(folder);
      let finalDest = dest;
      if (this.app.vault.getAbstractFileByPath(finalDest)) {
        const stamp = Date.now();
        const base = note.path.split("/").pop()!.replace(/\.md$/i, "");
        finalDest = `${folder}/${base}-${stamp}.md`;
      }
      await this.app.fileManager.renameFile(file, finalDest);
      new Notice(`Archived → ${finalDest}`);
    }
  }

  private async ensureFolder(path: string): Promise<void> {
    const parts = path.split("/").filter(Boolean);
    let cur = "";
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      if (!this.app.vault.getAbstractFileByPath(cur)) {
        await this.app.vault.createFolder(cur);
      }
    }
  }

  private async finishSession(
    stats: SessionStats,
    completed: boolean
  ): Promise<void> {
    const today = todayKey();
    if (completed) {
      if (this.settings.lastSessionDate === today) {
        // same day re-run: keep streak
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (this.settings.lastSessionDate === todayKey(yesterday)) {
          this.settings.streakDays += 1;
        } else {
          this.settings.streakDays = 1;
        }
      }
    }
    this.settings.lastSessionDate = today;
    this.settings.lastSessionCompleted = completed;
    await this.saveSettings();
    await this.rebuildQueue(false);
    this.refreshOpenViews();

    const done =
      stats.opened + stats.archived + stats.snoozed + stats.skipped;
    new Notice(
      `Pulse done: ${done}/${stats.target} · open ${stats.opened} · archive ${stats.archived} · snooze ${stats.snoozed} · skip ${stats.skipped} · streak ${this.settings.streakDays}`
    );
  }
}
