import { TestBed } from '@angular/core/testing';

import { SceneCatalogService } from './scene-catalog.service';

describe('SceneCatalogService', () => {
  let service: SceneCatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneCatalogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
