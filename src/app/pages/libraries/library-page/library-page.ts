import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Library } from '../../../components/library/library';

@Component({
  selector: 'app-library-page',
  imports: [Library],
  templateUrl: './library-page.html',
})
export class LibraryPage {
  private route = inject(ActivatedRoute);

  readonly libraryId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id'))),
    { initialValue: null }
  );
}