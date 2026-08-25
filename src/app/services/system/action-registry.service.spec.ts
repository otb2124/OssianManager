import { TestBed } from '@angular/core/testing';

import { ActionRegistryService } from './action-registry.service';

describe('ActionRegistryService', () => {
  let service: ActionRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
