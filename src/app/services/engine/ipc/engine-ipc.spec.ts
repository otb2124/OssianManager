import { TestBed } from '@angular/core/testing';

import { EngineIpc } from './engine-ipc';

describe('EngineIpc', () => {
  let service: EngineIpc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EngineIpc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
