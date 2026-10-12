import { TestBed } from '@angular/core/testing';

import { Graphstore } from './graphstore';

describe('Graphstore', () => {
  let service: Graphstore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Graphstore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
