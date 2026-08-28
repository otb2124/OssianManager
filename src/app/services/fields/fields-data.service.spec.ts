import { TestBed } from '@angular/core/testing';

import { FieldsDataService } from './fields-data.service';

describe('FieldsDataService', () => {
  let service: FieldsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
