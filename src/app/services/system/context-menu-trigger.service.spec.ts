import { TestBed } from '@angular/core/testing';

import { ContextMenuTriggerService } from './context-menu-trigger.service';

describe('ContextMenuTriggerService', () => {
  let service: ContextMenuTriggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContextMenuTriggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
