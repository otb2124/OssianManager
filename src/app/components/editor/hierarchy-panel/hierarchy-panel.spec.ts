import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HierarchyPanel } from './hierarchy-panel';

describe('HierarchyPanel', () => {
  let component: HierarchyPanel;
  let fixture: ComponentFixture<HierarchyPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HierarchyPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HierarchyPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
