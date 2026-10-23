import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRecordOverview } from './project-record-overview';

describe('ProjectOverview', () => {
  let component: ProjectRecordOverview;
  let fixture: ComponentFixture<ProjectRecordOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectRecordOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectRecordOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
