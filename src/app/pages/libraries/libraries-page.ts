import { Component, inject } from '@angular/core';
import { LibrariesList } from '../../components/libraries/libraries-list/libraries-list';
import { Library } from '../../components/libraries/library/library';
import { LibrarySelectionService } from '../../services/data/libraries/library-tabs/library-tabs.service';

@Component({
  selector: 'app-libraries-page',
  imports: [LibrariesList, Library],
  templateUrl: './libraries-page.html',
  styleUrl: './libraries-page.css',
  host: { class: 'block h-full w-full' },
})
export class LibrariesPage {
  protected readonly selection = inject(LibrarySelectionService);
}