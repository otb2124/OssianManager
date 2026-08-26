import { TestBed } from '@angular/core/testing';

import { BabylonsceneServiceTs } from './babylonscene.service.ts';

describe('BabylonsceneServiceTs', () => {
  let service: BabylonsceneServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BabylonsceneServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
