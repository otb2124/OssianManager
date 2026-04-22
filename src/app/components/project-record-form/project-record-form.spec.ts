import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRecordForm } from './project-record-form';

describe('ProjectRecordForm', () => {
  let component: ProjectRecordForm;
  let fixture: ComponentFixture<ProjectRecordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectRecordForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectRecordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
