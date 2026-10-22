import { Injectable, inject } from '@angular/core';
import { IniFileService } from '../../../persistence/ini-file/ini-file.service';
import { ToolsLayout } from '../ossian-tools/ossian-tools.service';


const HEADER = '; Ossian.ini - [Content] is kept in sync by OssianManager each time a project is opened.\r\n; Other keys and sections are left untouched.';

/**
 * Ossian.ini next to the engine exe. The engine reads it ONCE at startup (CookerLink.InitializeResources),
 * so this has to run before the engine is spawned.
 */
@Injectable({ providedIn: 'root' })
export class OssianIniService {
  private readonly ini = inject(IniFileService);

  /** Points the engine at a project's raw Content folder. Returns true when the file changed. */
  setRawContent(layout: ToolsLayout, contentDir: string): Promise<boolean> {
    return this.ini.patch(layout.ossianIni, [
      { section: 'Content', key: 'Mode', value: 'raw' },
      { section: 'Content', key: 'Path', value: contentDir },
    ], HEADER);
  }
}