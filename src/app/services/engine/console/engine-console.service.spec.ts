import { TestBed } from '@angular/core/testing';

import { EngineConsoleService } from './engine-console.service';

describe('EngineConsoleService', () => {
  let service: EngineConsoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EngineConsoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
