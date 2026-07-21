import { App, TFile, debounce } from "obsidian";
import type { NoteIndexEntry, PulseIndexData, PulseSettings } from "../types";
import { isExcludedPath } from "../utils/paths";
import {
  basenameTitle,
  hasAvoidanceMarkers,
  normalizePrefix,
  normalizeTitleKey,
  simpleHash,
} from "../utils/text";

const INDEX_VERSION = 1;
const WIKILINK_RE = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;

export class VaultIndex {
  private data: PulseIndexData = {
    version: INDEX_VERSION,
    updatedAt: 0,
    notes: {},
  };
  private building = false;

  constructor(
    private app: App,
    private getSettings: () => PulseSettings,
    private persist: (data: PulseIndexData) => Promise<void>,
    private load: () => Promise<PulseIndexData | null>
  ) {}

  get entries(): Record<string, NoteIndexEntry> {
    return this.data.notes;
  }

  async init(): Promise<void> {
    const loaded = await this.load();
    if (loaded?.version === INDEX_VERSION && loaded.notes) {
      this.data = loaded;
    }
    const debounced = debounce(() => void this.fullRebuild(), 800, true);
    this.app.vault.on("create", (f) => {
      if (f instanceof TFile && f.extension === "md") debounced();
    });
    this.app.vault.on("modify", (f) => {
      if (f instanceof TFile && f.extension === "md") debounced();
    });
    this.app.vault.on("delete", (f) => {
      if (f instanceof TFile && f.extension === "md") debounced();
    });
    this.app.vault.on("rename", () => debounced());
  }

  async fullRebuild(): Promise<void> {
    if (this.building) return;
    this.building = true;
    try {
      const settings = this.getSettings();
      const files = this.app.vault.getMarkdownFiles();
      const notes: Record<string, NoteIndexEntry> = {};
      const outMap: Record<string, Set<string>> = {};

      for (const file of files) {
        if (isExcludedPath(file.path, settings)) continue;
        const content = await this.app.vault.cachedRead(file);
        const title = this.extractTitle(file, content);
        const titleKey = normalizeTitleKey(title);
        const prefix = normalizePrefix(this.stripFrontmatter(content));
        const out = this.extractOutLinks(content, file.path);
        outMap[file.path] = out;

        notes[file.path] = {
          path: file.path,
          mtime: file.stat.mtime,
          title,
          size: file.stat.size,
          outLinks: out.size,
          inLinks: 0,
          titleKey,
          prefixHash: simpleHash(prefix),
          tags: this.extractTags(content),
          hasAvoidance: hasAvoidanceMarkers(content) || hasAvoidanceMarkers(title),
        };
      }

      // Resolve in-links
      const pathByBasename = new Map<string, string[]>();
      for (const p of Object.keys(notes)) {
        const base = basenameTitle(p).toLowerCase();
        const arr = pathByBasename.get(base) ?? [];
        arr.push(p);
        pathByBasename.set(base, arr);
      }

      for (const [from, targets] of Object.entries(outMap)) {
        for (const raw of targets) {
          const resolved = this.resolveLink(raw, from, notes, pathByBasename);
          if (resolved && notes[resolved] && resolved !== from) {
            notes[resolved].inLinks += 1;
          }
        }
      }

      this.data = {
        version: INDEX_VERSION,
        updatedAt: Date.now(),
        notes,
      };
      await this.persist(this.data);
    } finally {
      this.building = false;
    }
  }

  private extractTitle(file: TFile, content: string): string {
    const m = /^#\s+(.+)$/m.exec(content);
    if (m) return m[1].trim();
    return basenameTitle(file.path);
  }

  private stripFrontmatter(content: string): string {
    if (!content.startsWith("---")) return content;
    const end = content.indexOf("\n---", 3);
    if (end === -1) return content;
    return content.slice(end + 4);
  }

  private extractTags(content: string): string[] {
    const tags = new Set<string>();
    const fm = content.startsWith("---")
      ? content.slice(3, content.indexOf("\n---", 3) + 1)
      : "";
    const tagLine = /tags:\s*\[([^\]]*)\]/i.exec(fm);
    if (tagLine) {
      for (const t of tagLine[1].split(",")) {
        const v = t.trim().replace(/^["']|["']$/g, "");
        if (v) tags.add(v.replace(/^#/, ""));
      }
    }
    const inline = content.matchAll(/(^|\s)#([\w\p{L}\p{N}/_-]+)/gu);
    for (const m of inline) tags.add(m[2]);
    return [...tags];
  }

  private extractOutLinks(content: string, fromPath: string): Set<string> {
    const set = new Set<string>();
    let m: RegExpExecArray | null;
    const re = new RegExp(WIKILINK_RE.source, "g");
    while ((m = re.exec(content)) !== null) {
      const target = m[1].trim();
      if (target) set.add(target);
    }
    // markdown links to .md
    const md = content.matchAll(/\]\(([^)]+\.md)\)/gi);
    for (const x of md) set.add(x[1].replace(/^\.\//, ""));
    void fromPath;
    return set;
  }

  private resolveLink(
    raw: string,
    fromPath: string,
    notes: Record<string, NoteIndexEntry>,
    pathByBasename: Map<string, string[]>
  ): string | null {
    const cleaned = raw.replace(/\\/g, "/").replace(/\.md$/i, "");
    if (notes[cleaned + ".md"]) return cleaned + ".md";
    if (notes[cleaned]) return cleaned;

    // relative from folder
    const folder = fromPath.includes("/")
      ? fromPath.slice(0, fromPath.lastIndexOf("/"))
      : "";
    const rel = folder ? `${folder}/${cleaned}.md` : `${cleaned}.md`;
    if (notes[rel]) return rel;

    const base = cleaned.split("/").pop()!.toLowerCase();
    const candidates = pathByBasename.get(base);
    if (candidates?.length === 1) return candidates[0];
    return null;
  }

  /** Ensure index exists; rebuild if empty */
  async ensureReady(): Promise<void> {
    if (Object.keys(this.data.notes).length === 0) {
      await this.fullRebuild();
    }
  }
}
