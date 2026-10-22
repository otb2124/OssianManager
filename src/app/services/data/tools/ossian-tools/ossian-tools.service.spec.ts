import { TestBed } from '@angular/core/testing';

import { OssianToolsService } from './ossian-tools.service';

describe('OssianToolsService', () => {
  let service: OssianToolsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OssianToolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
