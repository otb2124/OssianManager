import { TestBed } from '@angular/core/testing';

import { ResourceCatalogService } from './resource-catalog.service';

describe('ResourceCatalogService', () => {
  let service: ResourceCatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourceCatalogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
