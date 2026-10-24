import { getCurrentWindow } from '@tauri-apps/api/window';
import type { WindowKind } from '../../../model/window-kind.model';

export type { WindowKind };

export const windowKind: WindowKind =
  getCurrentWindow().label === 'editor' ? 'editor' : 'launcher';

/** Set by Rust's initialization_script when the editor window is created. */
export const launchProjectId: string | null =
  (window as unknown as { __OSSIAN_PROJECT_ID__?: string }).__OSSIAN_PROJECT_ID__ ?? null;
