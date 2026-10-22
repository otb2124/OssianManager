import { TestBed } from '@angular/core/testing';

import { OssianIniService } from './ossian-ini.service';

describe('OssianIniService', () => {
  let service: OssianIniService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OssianIniService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
