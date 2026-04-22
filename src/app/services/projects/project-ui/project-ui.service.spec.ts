import { TestBed } from '@angular/core/testing';

import { ProjectUiService } from './project-ui.service';

describe('ProjectUiService', () => {
  let service: ProjectUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
