import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectManagementPanel } from './project-management-panel';

describe('ProjectManagementPanel', () => {
  let component: ProjectManagementPanel;
  let fixture: ComponentFixture<ProjectManagementPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectManagementPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectManagementPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
