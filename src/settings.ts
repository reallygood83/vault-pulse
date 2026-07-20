import { App, PluginSettingTab, Setting } from "obsidian";
import type VaultPulsePlugin from "./main";
import type { PulseSettings } from "./types";

export class PulseSettingTab extends PluginSettingTab {
  plugin: VaultPulsePlugin;

  constructor(app: App, plugin: VaultPulsePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Vault Pulse" });
    containerEl.createEl("p", {
      text: "All processing is local. No AI. No network calls.",
    });

    const s = this.plugin.settings;

    new Setting(containerEl)
      .setName("Stale days")
      .setDesc("Notes not modified for at least this many days can be flagged stale.")
      .addText((t) =>
        t.setValue(String(s.staleDays)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.staleDays = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Session minutes")
      .setDesc("Default focus session length (habit timebox).")
      .addText((t) =>
        t.setValue(String(s.sessionMinutes)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.sessionMinutes = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Session target count")
      .setDesc('Number of cards per session, or "auto" (~minutes/1.5, clamped 5–20).')
      .addText((t) =>
        t
          .setValue(
            s.sessionTargetCount === "auto"
              ? "auto"
              : String(s.sessionTargetCount)
          )
          .onChange(async (v) => {
            if (v.trim().toLowerCase() === "auto") {
              s.sessionTargetCount = "auto";
            } else {
              const n = Number(v);
              if (!Number.isNaN(n) && n > 0) s.sessionTargetCount = Math.floor(n);
            }
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exclude folders")
      .setDesc("Comma-separated folder prefixes to ignore (e.g. Archive, Templates).")
      .addText((t) =>
        t.setValue(s.excludeFolders.join(", ")).onChange(async (v) => {
          s.excludeFolders = v
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Archive folder")
      .setDesc("Archive action moves notes under this folder (year-month subfolder).")
      .addText((t) =>
        t.setValue(s.archiveFolder).onChange(async (v) => {
          s.archiveFolder = v.trim() || "Archive/Pulse";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Snooze days")
      .setDesc("How long Snooze hides a note from the queue.")
      .addText((t) =>
        t.setValue(String(s.snoozeDays)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.snoozeDays = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Max notes per folder")
      .setDesc("Diversity cap so one folder does not fill the queue.")
      .addText((t) =>
        t.setValue(String(s.maxPerFolder)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.maxPerFolder = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    containerEl.createEl("h3", { text: "Daily habit schedule" });

    new Setting(containerEl)
      .setName("Enable daily schedule")
      .setDesc("When Obsidian is open at the set time, offer a session. Catch-up on next launch.")
      .addToggle((t) =>
        t.setValue(s.scheduleEnabled).onChange(async (v) => {
          s.scheduleEnabled = v;
          await this.plugin.saveSettings();
          this.plugin.reschedule();
        })
      );

    new Setting(containerEl)
      .setName("Schedule time")
      .setDesc("Local 24h time, e.g. 21:00")
      .addText((t) =>
        t.setValue(s.scheduleTime).onChange(async (v) => {
          s.scheduleTime = v.trim();
          await this.plugin.saveSettings();
          this.plugin.reschedule();
        })
      );

    containerEl.createEl("h3", { text: "Signal weights" });
    this.weightSetting(containerEl, s, "stale", "Stale weight");
    this.weightSetting(containerEl, s, "orphan", "Orphan weight");
    this.weightSetting(containerEl, s, "duplicate", "Duplicate weight");
    this.weightSetting(containerEl, s, "avoidance", "Avoidance weight");

    containerEl.createEl("p", {
      cls: "pulse-muted",
      text: `Streak: ${s.streakDays} day(s). Last session: ${s.lastSessionDate || "—"}`,
    });
  }

  private weightSetting(
    containerEl: HTMLElement,
    s: PulseSettings,
    key: keyof PulseSettings["weights"],
    name: string
  ): void {
    new Setting(containerEl)
      .setName(name)
      .addText((t) =>
        t.setValue(String(s.weights[key])).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n >= 0) {
            s.weights[key] = n;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}
