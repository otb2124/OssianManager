import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { GitCommit, RawGitCommit } from '../../model/git.model';


@Injectable({ providedIn: 'root' })
export class GitService {

  private readonly repoPath = '../';

  getLatestCommit(): Observable<GitCommit> {
    return from(invoke<RawGitCommit>('get_latest_commit', { path: this.repoPath })).pipe(
      map(raw => ({
        hash: raw.hash,
        hashShort: raw.hashShort,
        message: raw.message,
        author: raw.author,
        date: new Date(raw.date),
        branch: raw.branch,
      }))
    );
  }
}

