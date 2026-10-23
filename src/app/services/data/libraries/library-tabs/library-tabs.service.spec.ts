import { TestBed } from '@angular/core/testing';

import { LibraryTabsService } from './library-tabs.service';

describe('LibraryTabsService', () => {
  let service: LibraryTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LibraryTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
