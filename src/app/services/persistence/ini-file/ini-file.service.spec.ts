import { TestBed } from '@angular/core/testing';

import { IniFileService } from './ini-file.service';

describe('IniFileService', () => {
  let service: IniFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IniFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
