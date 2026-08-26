// file-inspector-panel.ts
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';

@Component({
  selector: 'app-file-inspector-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './file-inspector-panel.html',
})
export class FileInspectorPanel {
  protected readonly explorerService = inject(FileExplorerService);

  protected readonly selected = this.explorerService.selectedEntry;

  protected readonly renaming = signal(false);
  protected readonly renameValue = signal('');

  protected readonly formattedSize = computed(() => {
    const bytes = this.selected()?.size ?? 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  });

  protected readonly formattedModified = computed(() => {
    const raw = this.selected()?.modified;
    if (!raw) return '—';
    return new Date(parseInt(raw, 10) * 1000).toLocaleString();
  });

  startRename(): void {
    const entry = this.selected();
    if (!entry) return;
    this.renameValue.set(entry.name);
    this.renaming.set(true);
  }

  confirmRename(): void {
    const entry = this.selected();
    const newName = this.renameValue().trim();
    if (!entry || !newName || newName === entry.name) {
      this.renaming.set(false);
      return;
    }

    this.explorerService.rename(entry.path, newName).subscribe({
      next: (newPath: any) => {
        this.explorerService.select({ ...entry, name: newName, path: newPath });
        this.renaming.set(false);
      },
      error: () => this.renaming.set(false), // real error surfacing (toast/notification) is a separate concern — not wired here
    });
  }

  cancelRename(): void {
    this.renaming.set(false);
  }
}