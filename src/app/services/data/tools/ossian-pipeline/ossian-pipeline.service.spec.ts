import { TestBed } from '@angular/core/testing';

import { OssianPipelineService } from './ossian-pipeline.service';

describe('OssianPipelineService', () => {
  let service: OssianPipelineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OssianPipelineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
