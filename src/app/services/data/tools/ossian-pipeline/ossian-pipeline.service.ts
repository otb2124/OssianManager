import { Injectable, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { firstValueFrom } from 'rxjs';
import { ProjectService } from '../../projects/project.service';
import { PersistenceService } from '../../../persistence/persistence.service';
import { NotificationService } from '../../../notifications/notification.service';
import { joinPath } from '../../../utils/path.util';
import { OssianToolsService } from '../ossian-tools/ossian-tools.service';
import { OssianIniService } from '../ossian-ini/ossian-ini.service';
import { ToolRunnerService, ToolRunResult } from '../tool-runner/tool-runner.service';

const MANIFEST = 'ConfigFiles/Core/resources.json';
const PAK_NAME = 'Content.pak';

export interface BuildRequest {
  /** Defaults to the project title (ignored when the project has its own Build.ini). */
  name?: string;
  version?: string;
  company?: string;
  copyright?: string;
  description?: string;
  /** Absolute path of an .ico / .png. */
  icon?: string;
  noConsole?: boolean;
  zip?: boolean;
  /** Replace an output folder that does not look like a previous build. */
  force?: boolean;
  allowCookErrors?: boolean;
}

export interface BuiltGame {
  game: string;
  exe: string;
  pak: string;
}

const fmtBytes = (bytes: number): string =>
  bytes >= 1 << 20 ? `${(bytes / (1 << 20)).toFixed(1)} MB`
    : bytes >= 1 << 10 ? `${(bytes / (1 << 10)).toFixed(1)} KB`
    : `${bytes} B`;

const baseName = (path: string): string => path.replace(/^.*[\\/]/, '');

/**
 * Connects the open Ossian project to the engine's side tools:
 *  - Ossian.ini  -> the engine reads the project's Content folder (raw mode)
 *  - OssianCooker  -> <target>\Content.pak
 *  - OssianBuilder -> <target>\<exe name>\ (engine + pak + branded exe)
 * Folders come from the project's .ossian.project.json (resDirectory / targetDirectory).
 */
@Injectable({ providedIn: 'root' })
export class OssianPipelineService {
  private readonly project = inject(ProjectService);
  private readonly persistence = inject(PersistenceService);
  private readonly notifications = inject(NotificationService);
  private readonly tools = inject(OssianToolsService);
  private readonly ossianIni = inject(OssianIniService);
  private readonly runner = inject(ToolRunnerService);

  /** Live progress of the running tool (null when idle). */
  readonly status = this.runner.status;
  readonly busy = this.runner.running;

  private readonly _lastBuild = signal<BuiltGame | null>(null);
  readonly lastBuild = this._lastBuild.asReadonly();

  // ── engine (Ossian.ini) ──────────────────────────────────────────────────

  /**
   * Points Ossian.ini at the open project's content folder. Throws when the folder is unusable.
   * Must finish BEFORE the engine is spawned: it reads the ini once at startup.
   */
  async syncEngine(): Promise<void> {
    const { contentDir } = this.paths();
    await this.assertContent(contentDir);

    const layout = await this.tools.require();
    const changed = await this.ossianIni.setRawContent(layout, contentDir);
    console.log(`[Pipeline] ${layout.ossianIni} ${changed ? 'updated' : 'already up to date'} -> ${contentDir}`);
  }

  // ── cooker ───────────────────────────────────────────────────────────────

  async cook(): Promise<ToolRunResult | null> {
    return this.execute('Cook content', async () => {
      const { projectDir, contentDir, targetDir } = this.paths();
      await this.assertContent(contentDir);
      const layout = await this.requireTool('cooker');
      await this.ensureDir(targetDir);

      return this.runner.run('cooker', [
        'cook',
        '--content', contentDir,
        '--out', joinPath(targetDir, PAK_NAME),
        '--manifest', MANIFEST,
        '--engine-dir', layout.engineDir,   // scripts are compiled against the built engine
        '--json',
      ], { title: 'Cooking content', cwd: projectDir });
    }, result => {
      const assets = result.done?.['assets'];
      const bytes = result.done?.['packBytes'];
      return typeof assets === 'number' && typeof bytes === 'number'
        ? `${assets} assets, ${fmtBytes(bytes)}`
        : undefined;
    });
  }

  // ── builder ──────────────────────────────────────────────────────────────

  async build(request: BuildRequest = {}): Promise<ToolRunResult | null> {
    return this.execute('Build', async () => {
      const { projectDir, contentDir, targetDir, record } = this.paths();
      await this.assertContent(contentDir);
      await this.requireTool('builder');
      await this.ensureDir(targetDir);

      const args = ['build', '--content', contentDir, '--out', targetDir, '--json'];

      // A Build.ini in the project folder owns the app identity; otherwise it comes from the project record.
      const projectHasBuildIni = await this.exists(joinPath(projectDir, 'Build.ini'));
      if (request.name || !projectHasBuildIni) {
        args.push('--name', this.clean(request.name ?? record.title));
      }
      if (request.version) args.push('--version', request.version);
      if (request.company) args.push('--company', this.clean(request.company));
      if (request.copyright) args.push('--copyright', this.clean(request.copyright));
      const description = request.description ?? (projectHasBuildIni ? undefined : record.description);
      if (description) args.push('--description', this.clean(description));
      if (request.icon) args.push('--icon', request.icon);
      if (request.noConsole) args.push('--no-console');
      if (request.zip) args.push('--zip');
      if (request.force) args.push('--force');
      if (request.allowCookErrors) args.push('--allow-errors');

      const result = await this.runner.run('builder', args, { title: 'Building game', cwd: projectDir });

      const done = result.done;
      if (result.ok && done && typeof done['exe'] === 'string') {
        this._lastBuild.set({
          game: String(done['game'] ?? ''),
          exe: String(done['exe']),
          pak: String(done['pak'] ?? ''),
        });
      }
      return result;
    }, () => this._lastBuild()?.game);
  }

  async buildAndRun(request: BuildRequest = {}): Promise<void> {
    const result = await this.build(request);
    if (result?.ok) await this.run();
  }

  async run(): Promise<void> {
    const built = this._lastBuild();
    if (!built) {
      this.notifications.warn('Nothing to run', 'Build the project first.');
      return;
    }
    try {
      await invoke('launch_game', { exePath: built.exe });
    } catch (err) {
      this.notifications.error('Could not start the game', String(err));
    }
  }

  /** Removes <target>\<exe name>\ (only if it looks like a previous build). */
  async cleanBuild(): Promise<ToolRunResult | null> {
    return this.execute('Clean build', async () => {
      const { projectDir, targetDir, record } = this.paths();
      await this.requireTool('builder');

      const built = this._lastBuild();
      const args = ['clean', '--out', targetDir, '--json'];
      if (built) args.push('--exe-name', baseName(built.exe).replace(/\.exe$/i, ''));
      args.push('--name', this.clean(record.title));

      const result = await this.runner.run('builder', args, { title: 'Cleaning build output', cwd: projectDir });
      if (result.ok) this._lastBuild.set(null);
      return result;
    }, () => 'Build output removed');
  }

  async revealOutput(): Promise<void> {
    const target = this._lastBuild()?.exe ?? this.project.targetDirectory();
    if (target) await invoke('reveal_in_explorer', { path: target });
  }

  cancel(): Promise<boolean> {
    return this.runner.cancel();
  }

  // ── internals ────────────────────────────────────────────────────────────

  private paths() {
    const projectDir = this.project.currentDirectoryPath();
    const contentDir = this.project.resDirectory();
    const targetDir = this.project.targetDirectory();
    const record = this.project.currentProject();
    if (!projectDir || !contentDir || !targetDir || !record) throw new Error('Open a project first.');
    return { projectDir, contentDir, targetDir, record };
  }

  private async requireTool(kind: 'cooker' | 'builder') {
    const layout = await this.tools.resolve();   // re-read: the engine folder may have been rebuilt
    if (!layout) throw new Error('The engine was not found. Check the engine path in Tools > Settings > Engine.');

    const exe = kind === 'cooker' ? layout.cookerExe : layout.builderExe;
    if (!exe) {
      throw new Error(`Ossian${kind === 'cooker' ? 'Cooker' : 'Builder'} was not found next to the engine (${layout.engineDir}).`);
    }
    return layout;
  }

  /** The engine fails hard on a missing content folder or manifest, so check both first. */
  private async assertContent(contentDir: string): Promise<void> {
    try {
      await firstValueFrom(this.persistence.listDirectory(contentDir));
    } catch {
      throw new Error(`The project's content folder does not exist: ${contentDir}`);
    }

    const manifest = joinPath(contentDir, MANIFEST);
    if (!(await this.exists(manifest))) {
      throw new Error(`The project content has no resources manifest: ${manifest}`);
    }
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await firstValueFrom(this.persistence.inspectEntry(path));
      return true;
    } catch {
      return false;
    }
  }

  private ensureDir(path: string): Promise<void> {
    return invoke<void>('ensure_directory', { path });
  }

  /** The builder rejects double quotes in names and a single quoted ini value can't hold them. */
  private clean(text: string): string {
    return text.replace(/"/g, "'").trim();
  }

  /** Shared notification + error handling, so callers (menu actions) never see a rejection. */
  private async execute(
    title: string,
    work: () => Promise<ToolRunResult>,
    successDetail: (result: ToolRunResult) => string | undefined,
  ): Promise<ToolRunResult | null> {
    try {
      const result = await work();

      if (result.cancelled) {
        this.notifications.info(`${title} cancelled`);
      } else if (result.ok) {
        this.notifications.success(`${title} finished`, successDetail(result));
        if (result.warnings.length) {
          this.notifications.warn(`${title}: ${result.warnings.length} warning(s)`, result.warnings.slice(0, 5).join('\n'));
        }
      } else {
        const detail = result.errors.slice(0, 5).join('\n') || `Exit code ${result.code}`;
        this.notifications.error(`${title} failed`, detail);
      }
      return result;
    } catch (err) {
      this.notifications.error(`${title} failed`, err instanceof Error ? err.message : String(err));
      return null;
    }
  }
}