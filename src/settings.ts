import { App, PluginSettingTab, Setting } from "obsidian";
import { t, type PulseLocale } from "./i18n";
import type NoteSweepPlugin from "./main";
import type { PulseSettings } from "./types";

export class PulseSettingTab extends PluginSettingTab {
  plugin: NoteSweepPlugin;

  constructor(app: App, plugin: NoteSweepPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const L = this.plugin.settings.locale;
    const s = this.plugin.settings;

    new Setting(containerEl).setName(t(L, "settingsTitle")).setHeading();
    new Setting(containerEl).setDesc(t(L, "settingsIntro"));

    new Setting(containerEl).setName(t(L, "howToHeading")).setHeading();
    new Setting(containerEl).setDesc(t(L, "howToBody"));

    new Setting(containerEl)
      .setName(t(L, "language"))
      .setDesc(t(L, "languageDesc"))
      .addDropdown((d) =>
        d
          .addOption("en", "English")
          .addOption("ko", "한국어")
          .setValue(s.locale)
          .onChange(async (v) => {
            s.locale = v === "ko" ? "ko" : "en";
            await this.plugin.saveSettings();
            this.plugin.onLocaleChange();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName(t(L, "staleDays"))
      .setDesc(t(L, "staleDaysDesc"))
      .addText((inp) =>
        inp.setValue(String(s.staleDays)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.staleDays = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName(t(L, "sessionMinutes"))
      .setDesc(t(L, "sessionMinutesDesc"))
      .addText((inp) =>
        inp.setValue(String(s.sessionMinutes)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.sessionMinutes = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName(t(L, "sessionTarget"))
      .setDesc(t(L, "sessionTargetDesc"))
      .addText((inp) =>
        inp
          .setPlaceholder("auto 또는 1–100")
          .setValue(
            s.sessionTargetCount === "auto"
              ? "auto"
              : String(s.sessionTargetCount)
          )
          .onChange(async (v) => {
            const raw = v.trim().toLowerCase();
            if (raw === "auto" || raw === "") {
              s.sessionTargetCount = "auto";
            } else {
              const n = Number(raw);
              if (!Number.isNaN(n) && n > 0) {
                s.sessionTargetCount = Math.min(100, Math.max(1, Math.floor(n)));
              }
            }
            await this.plugin.saveSettings();
            // Refresh queue size so user sees the new count immediately
            await this.plugin.rebuildQueue(false);
            this.plugin.refreshOpenViewsPublic();
          })
      );

    new Setting(containerEl)
      .setName(t(L, "excludeFolders"))
      .setDesc(t(L, "excludeFoldersDesc"))
      .addText((inp) =>
        inp.setValue(s.excludeFolders.join(", ")).onChange(async (v) => {
          s.excludeFolders = v
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t(L, "archiveFolder"))
      .setDesc(t(L, "archiveFolderDesc"))
      .addText((inp) =>
        inp.setValue(s.archiveFolder).onChange(async (v) => {
          s.archiveFolder = v.trim() || "Archive/Pulse";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t(L, "snoozeDays"))
      .setDesc(t(L, "snoozeDaysDesc"))
      .addText((inp) =>
        inp.setValue(String(s.snoozeDays)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.snoozeDays = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName(t(L, "maxPerFolder"))
      .setDesc(t(L, "maxPerFolderDesc"))
      .addText((inp) =>
        inp.setValue(String(s.maxPerFolder)).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) {
            s.maxPerFolder = Math.floor(n);
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl).setName(t(L, "scheduleHeading")).setHeading();

    new Setting(containerEl)
      .setName(t(L, "scheduleEnabled"))
      .setDesc(t(L, "scheduleEnabledDesc"))
      .addToggle((tog) =>
        tog.setValue(s.scheduleEnabled).onChange(async (v) => {
          s.scheduleEnabled = v;
          await this.plugin.saveSettings();
          this.plugin.reschedule();
        })
      );

    new Setting(containerEl)
      .setName(t(L, "scheduleTime"))
      .setDesc(t(L, "scheduleTimeDesc"))
      .addText((inp) =>
        inp.setValue(s.scheduleTime).onChange(async (v) => {
          s.scheduleTime = v.trim();
          await this.plugin.saveSettings();
          this.plugin.reschedule();
        })
      );

    new Setting(containerEl)
      .setName(t(L, "scheduleAutoStart"))
      .setDesc(t(L, "scheduleAutoStartDesc"))
      .addToggle((tog) =>
        tog.setValue(s.scheduleAutoStart).onChange(async (v) => {
          s.scheduleAutoStart = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName(t(L, "weightsHeading")).setHeading();
    this.weightSetting(containerEl, s, L, "stale", "weightStale");
    this.weightSetting(containerEl, s, L, "orphan", "weightOrphan");
    this.weightSetting(containerEl, s, L, "duplicate", "weightDuplicate");
    this.weightSetting(containerEl, s, L, "avoidance", "weightAvoidance");

    new Setting(containerEl).setDesc(
      t(L, "streakLine", {
        days: s.streakDays,
        last: s.lastSessionDate || "—",
      })
    );
  }

  private weightSetting(
    containerEl: HTMLElement,
    s: PulseSettings,
    locale: PulseLocale,
    key: keyof PulseSettings["weights"],
    nameKey: string
  ): void {
    new Setting(containerEl)
      .setName(t(locale, nameKey))
      .addText((inp) =>
        inp.setValue(String(s.weights[key])).onChange(async (v) => {
          const n = Number(v);
          if (!Number.isNaN(n) && n >= 0) {
            s.weights[key] = n;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}
