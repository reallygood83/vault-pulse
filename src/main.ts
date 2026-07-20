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
import { ActiveSession } from "./session/active-session";
import { PulseSettingTab } from "./settings";
import { t } from "./i18n";
import {
  DEFAULT_SETTINGS,
  type PulseIndexData,
  type PulseSettings,
  type ScoredNote,
  type SessionStats,
} from "./types";
import { SessionModal, type SessionAction } from "./ui/session-modal";
import { PULSE_VIEW_TYPE, PulseView } from "./ui/pulse-view";
import { UpdateInfoModal } from "./ui/update-info-modal";
import { runInfoUpdate } from "./obsigravity-bridge";
import { archiveTargetPath } from "./utils/paths";
import { addDaysIso, todayKey } from "./utils/text";

interface PluginData {
  settings: PulseSettings;
  index: PulseIndexData | null;
}

export default class VaultPulsePlugin extends Plugin {
  settings: PulseSettings = {
    ...DEFAULT_SETTINGS,
    weights: { ...DEFAULT_SETTINGS.weights },
    snoozeUntil: {},
    excludeFolders: [...DEFAULT_SETTINGS.excludeFolders],
  };
  private index!: VaultIndex;
  private scheduleTimer: number | null = null;
  private cachedQueue: ScoredNote[] = [];
  /** Live session (survives modal close) */
  private active: ActiveSession | null = null;
  private modal: SessionModal | null = null;
  private statusEl: HTMLElement | null = null;
  private statusTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.index = new VaultIndex(
      this.app,
      () => this.settings,
      async (data) => {
        await this.saveData({
          settings: this.settings,
          index: data,
        } satisfies PluginData);
      },
      async () => {
        const raw = (await this.loadData()) as PluginData | null;
        return raw?.index ?? null;
      }
    );
    await this.index.init();

    this.registerView(PULSE_VIEW_TYPE, (leaf) => {
      const view = new PulseView(leaf);
      view.setLocale(this.settings.locale);
      view.setHandlers({
        onStart: () => void this.startSession(),
        onRefresh: async () => {
          await this.rebuildQueue(true);
          this.refreshOpenViews();
        },
        onOpenNote: (path) => void this.openNotePath(path),
        onDeleteNote: (path) => void this.deleteNotePath(path),
        onUpdateInfo: (path, title) => this.openUpdateInfoModal(path, title),
      });
      return view;
    });

    this.addRibbonIcon("activity", "Vault Pulse", () => {
      if (this.active && !this.active.ended) {
        this.resumeSession();
      } else {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "pulse-start-session",
      name: t(this.settings.locale, "cmdStart"),
      callback: () => void this.startSession(),
    });

    this.addCommand({
      id: "pulse-resume-session",
      name: t(this.settings.locale, "cmdResume"),
      checkCallback: (checking) => {
        const ok = !!(this.active && !this.active.ended);
        if (ok && !checking) this.resumeSession();
        return ok;
      },
    });

    this.addCommand({
      id: "pulse-open-view",
      name: t(this.settings.locale, "cmdOpenView"),
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "pulse-rescan",
      name: t(this.settings.locale, "cmdRescan"),
      callback: () => void this.rescan(),
    });

    this.addSettingTab(new PulseSettingTab(this.app, this));

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass("pulse-status-bar");
    this.statusEl.hide();
    this.statusEl.onclick = () => this.resumeSession();

    void this.app.workspace.onLayoutReady(async () => {
      await this.index.ensureReady();
      await this.rebuildQueue(false);
      this.refreshOpenViews();
      this.reschedule();

      if (shouldOfferCatchUpSession(this.settings)) {
        if (this.settings.scheduleAutoStart) {
          new Notice(t(this.settings.locale, "catchUp"));
          window.setTimeout(() => void this.startSession(), 600);
        } else {
          new Notice(t(this.settings.locale, "catchUpManual"));
        }
      }
    });
  }

  onunload(): void {
    if (this.scheduleTimer != null) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.clearStatusBar();
    if (this.active) {
      this.active.end();
      this.active = null;
    }
    this.modal = null;
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
        locale: raw.settings.locale === "ko" ? "ko" : "en",
        scheduleAutoStart:
          raw.settings.scheduleAutoStart ?? DEFAULT_SETTINGS.scheduleAutoStart,
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

  onLocaleChange(): void {
    void this.rebuildQueue(false).then(() => this.refreshOpenViews());
  }

  reschedule(): void {
    if (this.scheduleTimer != null) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (!this.settings.scheduleEnabled) return;
    const ms = msUntilNextSchedule(this.settings);
    if (ms == null) return;
    this.scheduleTimer = window.setTimeout(() => {
      void this.onScheduledFire();
      this.reschedule();
    }, ms);
  }

  private async onScheduledFire(): Promise<void> {
    const L = this.settings.locale;
    if (
      this.settings.lastSessionDate === todayKey() &&
      this.settings.lastSessionCompleted
    ) {
      return;
    }
    new Notice(t(L, "scheduledTime"));
    if (this.settings.scheduleAutoStart) {
      await this.startSession();
    }
  }

  async rescan(): Promise<void> {
    const L = this.settings.locale;
    new Notice(t(L, "scanning"));
    await this.index.fullRebuild();
    await this.rebuildQueue(false);
    this.refreshOpenViews();
    new Notice(t(L, "scanComplete"));
  }

  async rebuildQueue(forceRescan: boolean): Promise<void> {
    if (forceRescan) await this.index.fullRebuild();
    else await this.index.ensureReady();
    const scored = scoreNotes(
      this.index.entries,
      this.settings,
      Date.now(),
      this.settings.locale
    );
    this.cachedQueue = buildTodayQueue(scored, this.settings);
  }

  /** Used by settings tab after changing daily note count */
  refreshOpenViewsPublic(): void {
    this.refreshOpenViews();
  }

  private refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(PULSE_VIEW_TYPE)) {
      const v = leaf.view;
      if (v instanceof PulseView) {
        v.setLocale(this.settings.locale);
        v.setQueue(this.cachedQueue);
      }
    }
  }

  private async openNotePath(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  private async deleteNotePath(path: string): Promise<void> {
    const L = this.settings.locale;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      new Notice(t(L, "deleteFailed"));
      return;
    }
    const ok = window.confirm(t(L, "deleteConfirm", { path }));
    if (!ok) return;
    try {
      await this.app.vault.trash(file, true);
      new Notice(t(L, "deleted", { path }));
      await this.rebuildQueue(true);
      this.refreshOpenViews();
    } catch (e) {
      console.error(e);
      new Notice(t(L, "deleteFailed"));
    }
  }

  private openUpdateInfoModal(path: string, title: string): void {
    const L = this.settings.locale;
    new UpdateInfoModal(this.app, {
      locale: L,
      noteTitle: title,
      notePath: path,
      onSubmit: (prompt) => {
        void runInfoUpdate(this.app, L, path, prompt);
      },
    }).open();
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
    // Resume if already active
    if (this.active && !this.active.ended) {
      this.resumeSession();
      return;
    }
    await this.rebuildQueue(false);
    const L = this.settings.locale;
    if (this.cachedQueue.length === 0) {
      new Notice(t(L, "nothingToTriage"));
      return;
    }
    this.active = new ActiveSession(
      [...this.cachedQueue],
      this.settings.sessionMinutes
    );
    this.showStatusBar();
    this.openSessionModal();
  }

  resumeSession(): void {
    if (!this.active || this.active.ended) {
      void this.startSession();
      return;
    }
    this.active.paused = false;
    this.showStatusBar();
    this.openSessionModal();
  }

  private openSessionModal(): void {
    if (!this.active || this.active.ended) return;
    // Avoid stacking modals
    if (this.modal) {
      try {
        this.modal.close();
      } catch {
        /* ignore */
      }
      this.modal = null;
    }
    const session = this.active;
    const modal = new SessionModal(this.app, {
      locale: this.settings.locale,
      session,
      onAction: (note, action) => this.handleAction(note, action),
      onPause: () => this.onSessionPaused(),
      onRequestEnd: (auto) => this.endActiveSession(auto),
    });
    this.modal = modal;
    modal.open();
  }

  private onSessionPaused(): void {
    if (!this.active || this.active.ended) return;
    this.active.paused = true;
    this.modal = null;
    this.showStatusBar();
    const time = this.formatTime(this.active.remainingSec);
    new Notice(t(this.settings.locale, "sessionPaused", { time }));
  }

  private endActiveSession(auto: boolean): void {
    if (!this.active) return;
    const stats = { ...this.active.stats };
    const completed = this.active.isSuccess();
    this.active.end();
    this.active = null;
    this.modal = null;
    this.clearStatusBar();
    if (auto) new Notice(t(this.settings.locale, "timeUp"));
    void this.finishSession(stats, completed);
  }

  private formatTime(sec: number): string {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  private showStatusBar(): void {
    if (!this.statusEl || !this.active) return;
    this.statusEl.show();
    this.updateStatusBar();
    if (this.statusTimer != null) window.clearInterval(this.statusTimer);
    this.statusTimer = window.setInterval(() => this.updateStatusBar(), 1000);
  }

  private updateStatusBar(): void {
    if (!this.statusEl || !this.active || this.active.ended) {
      this.clearStatusBar();
      return;
    }
    const time = this.formatTime(this.active.remainingSec);
    const key = this.active.paused ? "statusBarPaused" : "statusBarActive";
    this.statusEl.setText(t(this.settings.locale, key, { time }));
    this.statusEl.setAttr(
      "aria-label",
      t(this.settings.locale, "cmdResume")
    );
  }

  private clearStatusBar(): void {
    if (this.statusTimer != null) {
      window.clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    if (this.statusEl) {
      this.statusEl.setText("");
      this.statusEl.hide();
    }
  }

  private async handleAction(
    note: ScoredNote,
    action: SessionAction
  ): Promise<void> {
    const L = this.settings.locale;
    if (!this.active) return;

    if (action === "open") {
      const file = this.app.vault.getAbstractFileByPath(note.path);
      if (file instanceof TFile) {
        await this.app.workspace.getLeaf(false).openFile(file);
      }
      this.active.markOpened();
      // Modal will pause itself after open
      return;
    }

    if (action === "next") {
      // just advance — already handled in modal via advanceAfterResolve
      return;
    }

    if (action === "snooze") {
      this.settings.snoozeUntil[note.path] = addDaysIso(
        this.settings.snoozeDays
      );
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
      new Notice(t(L, "archived", { path: finalDest }));
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
      if (this.settings.lastSessionDate !== today) {
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
      t(this.settings.locale, "sessionDone", {
        done,
        target: stats.target,
        opened: stats.opened,
        archived: stats.archived,
        snoozed: stats.snoozed,
        skipped: stats.skipped,
        streak: this.settings.streakDays,
      })
    );
  }
}
