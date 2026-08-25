import { TestBed } from '@angular/core/testing';

import { SidebarNavService } from './sidebar-nav.service';

describe('SidebarNavService', () => {
  let service: SidebarNavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarNavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
