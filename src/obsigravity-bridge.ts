import { App, Notice, TFile } from "obsidian";
import { t, type PulseLocale } from "./i18n";

const OBSIGRAVITY_ID = "obsigravity";

interface ObsigravityPluginLike {
  activateView?: () => Promise<void>;
  pinNote?: (path: string) => Promise<void>;
  lastActiveMarkdownFile?: TFile | null;
}

interface AppWithCommands {
  commands?: {
    executeCommandById?: (id: string) => boolean | Promise<boolean>;
  };
}

function getObsigravity(app: App): ObsigravityPluginLike | null {
  const plugins = (
    app as unknown as {
      plugins?: {
        getPlugin?: (id: string) => unknown;
        plugins?: Record<string, unknown>;
      };
    }
  ).plugins;
  if (!plugins) return null;
  const p =
    (plugins.getPlugin?.(OBSIGRAVITY_ID) as ObsigravityPluginLike | null) ||
    (plugins.plugins?.[OBSIGRAVITY_ID] as ObsigravityPluginLike | undefined) ||
    null;
  return p ?? null;
}

export function showObsigravityInstallGuide(locale: PulseLocale): void {
  new Notice(t(locale, "obsigravityMissing"), 12000);
}

/**
 * Simple handoff: open the queue note as active, then open Obsigravity.
 * User types the request in Obsigravity chat (no prompt modal).
 */
export async function openNoteInObsigravity(
  app: App,
  locale: PulseLocale,
  notePath: string
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(notePath);
  if (!(file instanceof TFile)) {
    new Notice(t(locale, "deleteFailed"));
    return;
  }

  await app.workspace.getLeaf(false).openFile(file, { active: true });

  const og = getObsigravity(app);
  if (!og) {
    showObsigravityInstallGuide(locale);
    return;
  }

  try {
    if (typeof og.pinNote === "function") {
      await og.pinNote(notePath.replace(/\\/g, "/"));
    }
  } catch {
    // Optional pin — ignore if Obsigravity does not support it
  }

  try {
    if (typeof og.activateView === "function") {
      await og.activateView();
    } else {
      const commands = (app as App & AppWithCommands).commands;
      const exec = commands?.executeCommandById;
      if (typeof exec === "function") {
        await Promise.resolve(exec.call(commands, "obsigravity:open-obsigravity"));
      }
    }
    new Notice(t(locale, "obsigravityOpened"), 6000);
  } catch {
    new Notice(t(locale, "obsigravityUpdateFailed"), 8000);
  }
}
