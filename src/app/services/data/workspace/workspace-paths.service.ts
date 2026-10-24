import { Injectable, computed, inject } from '@angular/core';
import { AppConfigService } from '../app-config/app-config.service';
import { ProjectService } from '../projects/project.service';
import { joinPath } from '../../utils/path.util';

/**
 * Where the engine content lives right now: the open project's res folder, else the engine's own
 * Content folder (launcher, no project open). One place for that fallback, so every consumer agrees.
 */
@Injectable({ providedIn: 'root' })
export class WorkspacePathsService {

  private readonly project = inject(ProjectService);
  private readonly appConfig = inject(AppConfigService);

  /** Content folder of the engine, relative to `engineProjectPath` (which may be the exe or its folder). */
  private readonly engineContentRelative = computed(
    () => this.appConfig.config()?.editor.engineContentRelative ?? '../Content');

  private readonly configRelative = ['ConfigFiles', 'Core'] as const;

  readonly contentRoot = computed<string | null>(() => {
    const projectContent = this.project.resDirectory();
    if (projectContent) return projectContent;
  
    const enginePath = this.appConfig.engineProjectPath();
    return enginePath ? joinPath(enginePath, this.engineContentRelative()) : null;
  });

  /** ConfigFiles/Core/tree.json of the open project, else of the engine. */
  readonly engineConfigPath = computed<string | null>(() => this.coreConfigPath('tree.json'));

  /** ConfigFiles/Core/resources.json of the open project, else of the engine. */
  readonly resourcesPath = computed<string | null>(() => this.coreConfigPath('resources.json'));

  /** Absolute path of a file referenced relative to Content/ (as written in resources.json). */
  contentPath(relative: string): string | null {
    const root = this.contentRoot();
    return root ? joinPath(root, relative) : null;
  }

  private coreConfigPath(fileName: string): string | null {
    const root = this.contentRoot();
    return root ? joinPath(root, ...this.configRelative, fileName) : null;
  }
}
