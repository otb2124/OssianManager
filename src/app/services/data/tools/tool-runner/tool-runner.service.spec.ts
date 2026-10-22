import { TestBed } from '@angular/core/testing';

import { ToolRunnerService } from './tool-runner.service';

describe('ToolRunnerService', () => {
  let service: ToolRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolRunnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
