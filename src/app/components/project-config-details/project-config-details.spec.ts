import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectConfigDetails } from './project-config-details';

describe('ProjectConfigDetails', () => {
  let component: ProjectConfigDetails;
  let fixture: ComponentFixture<ProjectConfigDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectConfigDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectConfigDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
