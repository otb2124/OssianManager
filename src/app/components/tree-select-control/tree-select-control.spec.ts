import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeSelectControl } from './tree-select-control';

describe('TreeSelectControl', () => {
  let component: TreeSelectControl;
  let fixture: ComponentFixture<TreeSelectControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeSelectControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeSelectControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
