// file-inspector-panel.ts
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { FileExplorerService, InspectTarget } from '../../../services/persistence/file-explorer.service';
import { EntryInfo, FsEntry, PersistenceService } from '../../../services/persistence/persistence.service';
import { ResourceCatalogService } from '../../../services/data/resources/resource-catalog.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { RESOURCE_GROUP_META, ResourceEntry, resourceGroupOf } from '../../../model/resource.model';

export interface InfoRow {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}

export interface ResourceDataItem {
  kind: 'ref' | 'file' | 'literal' | 'value';
  text: string;
  /** kind 'ref': the referenced resource. */
  entry?: ResourceEntry;
  /** kind 'file': absolute path (null when the engine path is unknown). */
  absolute?: string | null;
}

interface FileKind { label: string; icon: string; }

const kind = (label: string, icon: string): FileKind => ({ label, icon });

const FILE_KINDS: Record<string, FileKind> = {
  fbx: kind('3D model / animation (FBX)', 'pi pi-box'),
  obj: kind('3D model (OBJ)', 'pi pi-box'),
  gltf: kind('3D model (glTF)', 'pi pi-box'),
  glb: kind('3D model (GLB)', 'pi pi-box'),
  png: kind('PNG image', 'pi pi-image'),
  jpg: kind('JPEG image', 'pi pi-image'),
  jpeg: kind('JPEG image', 'pi pi-image'),
  tga: kind('TGA image', 'pi pi-image'),
  tif: kind('TIFF image', 'pi pi-image'),
  tiff: kind('TIFF image', 'pi pi-image'),
  bmp: kind('BMP image', 'pi pi-image'),
  gif: kind('GIF image', 'pi pi-image'),
  webp: kind('WebP image', 'pi pi-image'),
  dds: kind('DDS texture', 'pi pi-image'),
  svg: kind('SVG image', 'pi pi-image'),
  ico: kind('Icon', 'pi pi-image'),
  ogg: kind('Ogg audio', 'pi pi-volume-up'),
  wav: kind('WAV audio', 'pi pi-volume-up'),
  mp3: kind('MP3 audio', 'pi pi-volume-up'),
  cs: kind('C# script', 'pi pi-code'),
  json: kind('JSON data', 'pi pi-file'),
  xml: kind('XML data', 'pi pi-file'),
  vert: kind('Vertex shader', 'pi pi-sliders-h'),
  frag: kind('Fragment shader', 'pi pi-sliders-h'),
  glsl: kind('GLSL shader', 'pi pi-sliders-h'),
  hlsl: kind('HLSL shader', 'pi pi-sliders-h'),
  comp: kind('Compute shader', 'pi pi-sliders-h'),
  shader: kind('Shader', 'pi pi-sliders-h'),
  txt: kind('Text file', 'pi pi-file'),
  md: kind('Markdown document', 'pi pi-file'),
  dll: kind('Library (DLL)', 'pi pi-cog'),
  exe: kind('Executable', 'pi pi-cog'),
  pdb: kind('Debug symbols', 'pi pi-cog'),
};

/** Extensions a webview can draw in an <img>. */
const PREVIEW_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
};
const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

function parentOf(path: string): string {
  return path.replace(/[\\/][^\\/]*$/, '');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

function relativeTime(ms: number): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const diffSec = Math.round((ms - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000], ['month', 2_592_000], ['day', 86_400], ['hour', 3_600], ['minute', 60],
  ];
  for (const [unit, secs] of steps) {
    if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return rtf.format(diffSec, 'second');
}

function formatDate(ms: number): string {
  return `${new Date(ms).toLocaleString()} · ${relativeTime(ms)}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

@Component({
  selector: 'app-file-inspector-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './file-inspector-panel.html',
})
export class FileInspectorPanel {
  protected readonly explorerService = inject(FileExplorerService);
  protected readonly catalog = inject(ResourceCatalogService);
  private readonly persistence = inject(PersistenceService);
  private readonly notifications = inject(NotificationService);

  protected readonly target = this.explorerService.inspected;
  protected readonly fsEntry = computed<FsEntry | null>(() => {
    const t = this.target();
    return t?.kind === 'fs' ? t.entry : null;
  });
  protected readonly resource = computed<ResourceEntry | null>(() => {
    const t = this.target();
    return t?.kind === 'resource' ? t.resource : null;
  });

  // ── file state ─────────────────────────────────────────────────────────

  protected readonly info = signal<EntryInfo | null>(null);
  protected readonly infoError = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly hash = signal<{ state: 'idle' | 'busy' | 'done' | 'error'; value?: string; error?: string }>({ state: 'idle' });

  protected readonly renaming = signal(false);
  protected readonly renameValue = signal('');
  protected readonly copied = signal<string | null>(null);

  private token = 0;

  // ── resource state ─────────────────────────────────────────────────────

  /** absolute path -> info (null = missing on disk). Absent key = still loading. */
  protected readonly fileStatus = signal<Record<string, EntryInfo | null>>({});
  private fileToken = 0;

  constructor() {
    effect(() => {
      const t = this.target();
      untracked(() => void this.load(t));
    });

    effect(() => {
      const view = this.resourceView();
      untracked(() => void this.loadResourceFiles(view));
    });

    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  // ── file view ──────────────────────────────────────────────────────────

  protected readonly kind = computed<FileKind | null>(() => {
    const entry = this.fsEntry();
    if (!entry) return null;
    if (entry.isDirectory) return kind('Folder', 'pi pi-folder');
    const ext = extensionOf(entry.name);
    return FILE_KINDS[ext] ?? kind(ext ? `${ext.toUpperCase()} file` : 'File', 'pi pi-file');
  });

  protected readonly generalRows = computed<InfoRow[]>(() => {
    const entry = this.fsEntry();
    if (!entry) return [];
    const info = this.info();

    const rows: InfoRow[] = [
      { label: 'Name', value: entry.name },
      { label: 'Kind', value: this.kind()?.label ?? '' },
    ];
    if (info?.extension) rows.push({ label: 'Extension', value: `.${info.extension}` });
    rows.push({ label: 'Location', value: info?.parent ?? parentOf(entry.path), mono: true, copyable: true });

    const relative = this.relativeToRoot(entry.path);
    if (relative) rows.push({ label: 'Relative path', value: relative, mono: true, copyable: true });

    if (!entry.isDirectory) {
      const size = info?.size ?? entry.size;
      rows.push({ label: 'Size', value: `${formatBytes(size)} (${size.toLocaleString()} bytes)` });
    }
    return rows;
  });

  protected readonly dateRows = computed<InfoRow[]>(() => {
    const entry = this.fsEntry();
    if (!entry) return [];
    const info = this.info();

    const modified = info?.modifiedMs ?? (entry.modified ? parseInt(entry.modified, 10) * 1000 : null);
    const rows: InfoRow[] = [];
    if (info?.createdMs != null) rows.push({ label: 'Created', value: formatDate(info.createdMs) });
    if (modified != null) rows.push({ label: 'Modified', value: formatDate(modified) });
    if (info?.accessedMs != null) rows.push({ label: 'Accessed', value: formatDate(info.accessedMs) });
    return rows;
  });

  protected readonly attributeRows = computed<InfoRow[]>(() => {
    const info = this.info();
    if (!info) return [];
    const rows: InfoRow[] = [
      { label: 'Read-only', value: info.readonly ? 'Yes' : 'No' },
      { label: 'Hidden', value: info.hidden ? 'Yes' : 'No' },
    ];
    if (info.isSymlink) {
      rows.push({ label: 'Symbolic link', value: info.symlinkTarget ?? 'Yes', mono: true });
    }
    return rows;
  });

  protected readonly contentRows = computed<InfoRow[]>(() => {
    const info = this.info();
    if (!info || info.isDirectory) return [];

    const rows: InfoRow[] = [];
    if (info.detectedType) rows.push({ label: 'Detected type', value: info.detectedType });
    if (info.isText !== null) rows.push({ label: 'Content', value: info.isText ? 'Text' : 'Binary' });
    if (info.encoding) rows.push({ label: 'Encoding', value: info.encoding });
    if (info.lineCount !== null) rows.push({ label: 'Lines', value: info.lineCount.toLocaleString() });
    if (info.lineEndings) rows.push({ label: 'Line endings', value: info.lineEndings });

    if (info.image) {
      const { width, height } = info.image;
      const g = gcd(width, height);
      const ratio = width / g <= 32 && height / g <= 32
        ? `${width / g}:${height / g}`
        : (width / height).toFixed(2);
      rows.push({ label: 'Dimensions', value: `${width} × ${height} px` });
      rows.push({ label: 'Aspect ratio', value: ratio });
      rows.push({ label: 'Megapixels', value: `${((width * height) / 1_000_000).toFixed(2)} MP` });
    }
    return rows;
  });

  protected readonly directoryRows = computed<InfoRow[]>(() => {
    const dir = this.info()?.dir;
    if (!dir) return [];
    const partial = dir.truncated ? ' (partial)' : '';
    return [
      { label: 'Direct children', value: `${dir.directFiles.toLocaleString()} files, ${dir.directFolders.toLocaleString()} folders` },
      { label: 'Total contents', value: `${dir.files.toLocaleString()} files, ${dir.folders.toLocaleString()} folders${partial}` },
      { label: 'Total size', value: `${formatBytes(dir.totalSize)}${dir.truncated ? '+' : ''}` },
    ];
  });

  // ── resource view ──────────────────────────────────────────────────────

  protected readonly resourceView = computed(() => {
    const res = this.resource();
    if (!res) return null;

    const catalogEntry = this.catalog.get(res.id);
    const type = res.type || catalogEntry?.type || '';
    const raw = res.data ?? catalogEntry?.data ?? [];
    const groupKey = resourceGroupOf(type);
    const isFileType = groupKey === 'files';

    const items: ResourceDataItem[] = raw.map((value): ResourceDataItem => {
      if (typeof value !== 'string') return { kind: 'value', text: JSON.stringify(value) };
      const ref = this.catalog.get(value);
      if (ref) return { kind: 'ref', text: value, entry: ref };
      if (isFileType) return { kind: 'file', text: value, absolute: this.catalog.contentPath(value) };
      return { kind: 'literal', text: value };
    });

    const rows: InfoRow[] = [
      { label: 'Id', value: res.id, mono: true, copyable: true },
      { label: 'Type', value: type || 'unknown', mono: true },
      { label: 'Group', value: RESOURCE_GROUP_META.find(m => m.key === groupKey)?.label ?? 'Other' },
      { label: 'Data entries', value: String(items.length) },
    ];
    if (catalogEntry) rows.push({ label: 'Defined in', value: 'ConfigFiles/Core/resources.json', mono: true });

    return {
      resource: res,
      type,
      icon: RESOURCE_GROUP_META.find(m => m.key === groupKey)?.icon ?? 'pi pi-circle',
      inCatalog: !!catalogEntry,
      rows,
      items,
      usedBy: this.catalog.usedBy(res.id),
    };
  });

  // ── template helpers ───────────────────────────────────────────────────

  protected fmtBytes(bytes: number): string {
    return formatBytes(bytes);
  }

  protected statusOf(item: ResourceDataItem): EntryInfo | null | undefined {
    return item.absolute ? this.fileStatus()[item.absolute] : undefined;
  }

  protected reload(): void {
    void this.load(this.target());
  }

  protected openResource(entry: ResourceEntry): void {
    this.explorerService.selectResource(entry);
  }

  protected openFile(info: EntryInfo): void {
    this.explorerService.select({
      name: info.name,
      path: info.path,
      isDirectory: info.isDirectory,
      size: info.size,
      modified: info.modifiedMs != null ? String(Math.floor(info.modifiedMs / 1000)) : null,
    });
  }

  protected async reveal(path: string): Promise<void> {
    try {
      await invoke('reveal_in_explorer', { path });
    } catch (err) {
      this.notifications.error('Could not reveal in file explorer', String(err));
    }
  }

  protected async copy(value: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(key);
      setTimeout(() => {
        if (this.copied() === key) this.copied.set(null);
      }, 1200);
    } catch (err) {
      this.notifications.error('Copy failed', String(err));
    }
  }

  protected async computeHash(): Promise<void> {
    const info = this.info();
    if (!info || info.isDirectory) return;
    const token = this.token;
    this.hash.set({ state: 'busy' });
    try {
      const value = await firstValueFrom(this.persistence.hashFile(info.path));
      if (token === this.token) this.hash.set({ state: 'done', value });
    } catch (err) {
      if (token === this.token) this.hash.set({ state: 'error', error: String(err) });
    }
  }

  // ── rename ─────────────────────────────────────────────────────────────

  protected startRename(): void {
    const entry = this.fsEntry();
    if (!entry) return;
    this.renameValue.set(entry.name);
    this.renaming.set(true);
  }

  protected confirmRename(): void {
    const entry = this.fsEntry();
    const newName = this.renameValue().trim();
    if (!entry || !newName || newName === entry.name) {
      this.renaming.set(false);
      return;
    }

    this.explorerService.rename(entry.path, newName).subscribe({
      next: (newPath: string) => {
        this.explorerService.select({ ...entry, name: newName, path: newPath });
        this.renaming.set(false);
      },
      error: err => {
        this.renaming.set(false);
        this.notifications.error(`Could not rename ${entry.name}`, String(err));
      },
    });
  }

  protected cancelRename(): void {
    this.renaming.set(false);
  }

  // ── loading ────────────────────────────────────────────────────────────

  private async load(target: InspectTarget | null): Promise<void> {
    const token = ++this.token;

    this.revokePreview();
    this.info.set(null);
    this.infoError.set(null);
    this.hash.set({ state: 'idle' });
    this.renaming.set(false);
    this.loading.set(false);

    if (target?.kind !== 'fs') return;

    this.loading.set(true);
    try {
      const info = await firstValueFrom(this.persistence.inspectEntry(target.entry.path));
      if (token !== this.token) return;
      this.info.set(info);

      const mime = info.extension ? PREVIEW_MIME[info.extension] : undefined;
      if (mime && !info.isDirectory && info.size <= PREVIEW_MAX_BYTES) {
        await this.loadPreview(info, mime, token);
      }
    } catch (err) {
      if (token === this.token) this.infoError.set(String(err));
    } finally {
      if (token === this.token) this.loading.set(false);
    }
  }

  private async loadPreview(info: EntryInfo, mime: string, token: number): Promise<void> {
    try {
      const bytes = await firstValueFrom(this.persistence.readFileBytes(info.path, PREVIEW_MAX_BYTES));
      if (token !== this.token) return;
      this.previewUrl.set(URL.createObjectURL(new Blob([bytes], { type: mime })));
    } catch {
      // No preview is not an error worth surfacing.
    }
  }

  private async loadResourceFiles(view: ReturnType<FileInspectorPanel['resourceView']>): Promise<void> {
    const token = ++this.fileToken;
    this.fileStatus.set({});

    const paths = (view?.items ?? [])
      .filter(item => item.kind === 'file' && item.absolute)
      .map(item => item.absolute as string);
    if (!paths.length) return;

    const results = await Promise.all(paths.map(async (path): Promise<[string, EntryInfo | null]> => {
      try {
        return [path, await firstValueFrom(this.persistence.inspectEntry(path))];
      } catch {
        return [path, null];
      }
    }));

    if (token === this.fileToken) this.fileStatus.set(Object.fromEntries(results));
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }

  private relativeToRoot(path: string): string | null {
    const root = this.explorerService.rootPath();
    if (!root) return null;
    const norm = (s: string) => s.replace(/\\/g, '/').replace(/\/+$/, '');
    const r = norm(root);
    const p = norm(path);
    if (p.toLowerCase() === r.toLowerCase()) return '.';
    if (!p.toLowerCase().startsWith(`${r.toLowerCase()}/`)) return null;
    return p.slice(r.length + 1);
  }
}