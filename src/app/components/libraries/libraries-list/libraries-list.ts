import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { LibraryEntry } from '../../../model/library.model';
import { LibrariesService } from '../../../services/data/libraries/libraries.service';

@Component({
  selector: 'app-libraries-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TabsModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './libraries-list.html',
})
export class LibrariesList {
  protected readonly libraries = inject(LibrariesService);
  private readonly router = inject(Router);

  protected readonly activeTab = signal<string>('installed');
  protected readonly query = signal('');

  protected readonly installedItems = computed(() => this.filter(this.libraries.installed()));
  protected readonly communityItems = computed(() => this.filter(this.libraries.libraries()));

  protected onTabChange(value: string | number | undefined): void {
    this.activeTab.set(String(value ?? 'installed'));
  }

  protected open(lib: LibraryEntry): void {
    this.router.navigate(['/tools', 'library', lib.id]);
  }

  protected toggleInstall(lib: LibraryEntry, event: Event): void {
    event.stopPropagation();
    if (this.libraries.isInstalled(lib.id)) this.libraries.uninstall(lib.id);
    else this.libraries.install(lib.id);
  }

  private filter(list: LibraryEntry[]): LibraryEntry[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return list;
    return list.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.publisher.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q) ||
      l.tags.some(t => t.toLowerCase().includes(q)));
  }
}