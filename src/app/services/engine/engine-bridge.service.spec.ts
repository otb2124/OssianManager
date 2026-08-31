import { TestBed } from '@angular/core/testing';

import { EngineBridgeService } from './engine-bridge.service';

describe('EngineBridgeService', () => {
  let service: EngineBridgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EngineBridgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
