import { TestBed } from '@angular/core/testing';

import { InspectorSyncService } from './inspector-sync.service';

describe('InspectorSyncService', () => {
  let service: InspectorSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InspectorSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
