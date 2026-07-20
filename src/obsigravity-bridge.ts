import { App, Notice, TFile } from "obsidian";
import { t, type PulseLocale } from "./i18n";

const OBSIGRAVITY_ID = "obsigravity";
const BRAT_URL = "https://github.com/TfTHacker/obsidian42-brat";
const OBSIGRAVITY_REPO = "https://github.com/reallygood83/obsigravity";

interface ObsigravityPluginLike {
  startNoteUpdateFromPulse?: (
    notePath: string,
    userPrompt: string
  ) => Promise<void>;
  queuePulseUpdate?: (path: string, prompt: string) => void;
  activateView?: () => Promise<void>;
}

function getObsigravity(app: App): ObsigravityPluginLike | null {
  const plugins = (
    app as unknown as {
      plugins?: { getPlugin?: (id: string) => unknown; plugins?: Record<string, unknown> };
    }
  ).plugins;
  if (!plugins) return null;
  const p =
    (plugins.getPlugin?.(OBSIGRAVITY_ID) as ObsigravityPluginLike | null) ||
    (plugins.plugins?.[OBSIGRAVITY_ID] as ObsigravityPluginLike | undefined) ||
    null;
  return p ?? null;
}

export function isObsigravityInstalled(app: App): boolean {
  return getObsigravity(app) != null;
}

export function showObsigravityInstallGuide(locale: PulseLocale): void {
  new Notice(t(locale, "obsigravityMissing"), 12000);
  // Also log install steps for console / support
  console.info(
    `[Vault Pulse] Install Obsigravity via BRAT:\n1) Install BRAT: ${BRAT_URL}\n2) Add plugin: reallygood83/obsigravity\n3) Repo: ${OBSIGRAVITY_REPO}`
  );
}

/**
 * P1 soft + P2 hard bridge.
 * Prefer public API startNoteUpdateFromPulse; fall back to open note + command + notice.
 */
export async function runInfoUpdate(
  app: App,
  locale: PulseLocale,
  notePath: string,
  userPrompt: string
): Promise<void> {
  const og = getObsigravity(app);
  if (!og) {
    showObsigravityInstallGuide(locale);
    // Still open the note so user can work manually
    const file = app.vault.getAbstractFileByPath(notePath);
    if (file instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(file);
    }
    return;
  }

  if (typeof og.startNoteUpdateFromPulse === "function") {
    try {
      await og.startNoteUpdateFromPulse(notePath, userPrompt);
    } catch (e) {
      console.error("[Vault Pulse] Obsigravity update failed", e);
      new Notice(t(locale, "obsigravityUpdateFailed"), 8000);
      // Still open the note so the user can retry manually
      const file = app.vault.getAbstractFileByPath(notePath);
      if (file instanceof TFile) {
        await app.workspace.getLeaf(false).openFile(file);
      }
    }
    return;
  }

  // Soft fallback for older Obsigravity
  try {
    if (typeof og.queuePulseUpdate === "function") {
      og.queuePulseUpdate(notePath, userPrompt);
    }
    const file = app.vault.getAbstractFileByPath(notePath);
    if (file instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(file);
    }
    if (typeof og.activateView === "function") {
      await og.activateView();
    }
    try {
      // @ts-expect-error Obsidian command API
      await app.commands.executeCommandById(
        "obsigravity:update-note-from-pulse"
      );
    } catch {
      /* command may be missing on older builds */
    }
    new Notice(t(locale, "obsigravitySoftHandoff"), 8000);
  } catch (e) {
    console.error("[Vault Pulse] Obsigravity soft handoff failed", e);
    new Notice(t(locale, "obsigravityUpdateFailed"), 8000);
  }
}
