import { KeyboardShortcut } from "../../system/key-shortcut.service";
import { WindowKind } from "../../system/windows/window-kind";


export interface MenuEntry {
  id: string;
  label?: string;
  icon?: string;
  /** Registered in ActionRegistryService. Leaf items only. */
  actionId?: string;
  shortcut?: KeyboardShortcut | null;
  /** Omitted = visible in every window. */
  windows?: WindowKind[];
  requiresProject?: boolean;
  separator?: boolean;
  children?: MenuEntry[];
}

/** Drops entries not meant for this window / project state. Menus left empty disappear. */
export function resolveMenu(entries: MenuEntry[], kind: WindowKind, hasProject: boolean): MenuEntry[] {
  const out: MenuEntry[] = [];
  for (const e of entries) {
    if (e.windows && !e.windows.includes(kind)) continue;
    if (e.requiresProject && !hasProject) continue;

    if (e.children) {
      const children = resolveMenu(e.children, kind, hasProject);
      if (!children.some(c => !c.separator)) continue;
      out.push({ ...e, children });
    } else {
      out.push(e);
    }
  }
  return out;
}

export interface MenuShortcut {
  shortcut: KeyboardShortcut;
  actionId: string;
}

export function collectMenuShortcuts(entries: MenuEntry[]): MenuShortcut[] {
  return entries.flatMap(e => [
    ...(e.shortcut && e.actionId ? [{ shortcut: e.shortcut, actionId: e.actionId }] : []),
    ...collectMenuShortcuts(e.children ?? []),
  ]);
}

const sep = (id: string): MenuEntry => ({ id, separator: true });

export const MENU: MenuEntry[] = [
  {
    id: 'file', label: 'File',
    children: [
      { id: 'file.new',    label: 'New Project',      actionId: 'new_project',    windows: ['launcher'] },
      { id: 'file.import', label: 'Import Project...', actionId: 'import_project', windows: ['launcher'] },
      { id: 'file.scan',   label: 'Scan Project...',   actionId: 'scan_project',   windows: ['launcher'] },
      { id: 'file.save',   label: 'Save',    actionId: 'save_project',    shortcut: { key: 's', ctrl: true },              windows: ['editor'] },
      { id: 'file.saveAs', label: 'Save as', actionId: 'save_project_as', shortcut: { key: 's', ctrl: true, shift: true }, windows: ['editor'] },
      sep('file.sep'),
      { id: 'file.exit', label: 'Exit', actionId: 'exit_app' },
    ],
  },
  {
    id: 'edit', label: 'Edit', windows: ['editor'],
    children: [
      { id: 'edit.undo',   label: 'Undo',   actionId: 'undo' },
      { id: 'edit.redo',   label: 'Redo',   actionId: 'redo' },
      sep('edit.sep1'),
      { id: 'edit.cut',    label: 'Cut',    actionId: 'cut_selection' },
      { id: 'edit.copy',   label: 'Copy',   actionId: 'copy_selection',    shortcut: { key: 'c', ctrl: true } },
      { id: 'edit.copyRef',label: 'Copy as Reference', actionId: 'copy_as_reference', shortcut: { key: 'c', ctrl: true, alt: true } },
      { id: 'edit.paste',  label: 'Paste',  actionId: 'paste_selection' },
      { id: 'edit.dup',    label: 'Duplicate', actionId: 'duplicate_selection' },
      { id: 'edit.delete', label: 'Delete', actionId: 'delete_selection' },
      sep('edit.sep2'),
      { id: 'edit.selectAll', label: 'Select All', actionId: 'select_all' },
      { id: 'edit.find',      label: 'Find',       actionId: 'find' },
      { id: 'edit.replace',   label: 'Replace',    actionId: 'replace' },
    ],
  },
  {
    id: 'view', label: 'View', windows: ['editor'],
    children: [
      { id: 'view.files',     label: 'File Explorer', actionId: 'toggle_file_explorer', shortcut: { key: 'e', ctrl: true, shift: true } },
      { id: 'view.inspector', label: 'Inspector',     actionId: 'toggle_inspector',     shortcut: { key: 'i', ctrl: true, shift: true } },
      { id: 'view.console',   label: 'Console',       actionId: 'toggle_console',       shortcut: { key: 'y', ctrl: true, shift: true } },
      { id: 'view.errors',    label: 'Error List',    actionId: 'toggle_error_list',    shortcut: { key: 'm', ctrl: true, shift: true } },
    ],
  },
  {
    id: 'build', label: 'Build', windows: ['editor'],
    children: [
      { id: 'build.buildRun', label: 'Build & Run',  actionId: 'build_and_run',  shortcut: { key: 'F5' } },
      { id: 'build.build',    label: 'Build',        actionId: 'build_project',  shortcut: { key: 'b', ctrl: true, shift: true } },
      { id: 'build.cook',     label: 'Cook Content', actionId: 'cook_content' },
      { id: 'build.run',      label: 'Run',          actionId: 'run_project',    shortcut: { key: 'F5', ctrl: true } },
      { id: 'build.clean',    label: 'Clean',        actionId: 'clean_project' },
    ],
  },
];