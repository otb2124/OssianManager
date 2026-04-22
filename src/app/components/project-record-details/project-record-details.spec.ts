import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRecordDetails } from './project-record-details';

describe('ProjectDetails', () => {
  let component: ProjectRecordDetails;
  let fixture: ComponentFixture<ProjectRecordDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectRecordDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectRecordDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
