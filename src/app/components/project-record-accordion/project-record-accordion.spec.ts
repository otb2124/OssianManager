import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRecordAccordion } from './project-record-accordion';

describe('ProjectAccordion', () => {
  let component: ProjectRecordAccordion;
  let fixture: ComponentFixture<ProjectRecordAccordion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectRecordAccordion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectRecordAccordion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
