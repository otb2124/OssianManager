import { Injectable, inject } from '@angular/core';
import { defer, map, Observable, switchMap } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { GitCommit, RawGitCommit } from '../../model/git.model';
import { AppStoreService } from '../data/app-config/app-store.service';

@Injectable({ providedIn: 'root' })
export class GitService {
  private readonly store = inject(AppStoreService);

  getLatestCommit(): Observable<GitCommit> {
    return defer(() => this.store.load()).pipe(
      switchMap(app => invoke<RawGitCommit>('get_latest_commit', { path: app.git.repoPath })),
      map(raw => ({
        hash: raw.hash,
        hashShort: raw.hashShort,
        message: raw.message,
        author: raw.author,
        date: new Date(raw.date),
        branch: raw.branch,
      })),
    );
  }
}