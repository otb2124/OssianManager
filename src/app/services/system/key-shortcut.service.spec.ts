import { TestBed } from '@angular/core/testing';

import { KeyShortcutService } from './key-shortcut.service';

describe('KeyShortcutService', () => {
  let service: KeyShortcutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyShortcutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
