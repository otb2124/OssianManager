import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { open } from '@tauri-apps/plugin-dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {

  pickFolder(): Observable<string | null> {
    return from(
      open({ directory: true, multiple: false }).then(result => {
        if (!result) return null;
        return typeof result === 'string' ? result : null;
      })
    );
  }

  pickFile(filters?: { name: string; extensions: string[] }[]): Observable<string | null> {
    return from(
      open({ directory: false, multiple: false, filters }).then(result => {
        if (!result) return null;
        return typeof result === 'string' ? result : null;
      })
    );
  }
}