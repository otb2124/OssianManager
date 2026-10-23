import { TestBed } from '@angular/core/testing';

import { EditorTabsService } from './editor-tabs.service';

describe('EditorTabsService', () => {
  let service: EditorTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
