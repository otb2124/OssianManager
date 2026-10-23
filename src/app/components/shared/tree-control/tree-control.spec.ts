import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeControl } from './tree-control';

describe('TreeControl', () => {
  let component: TreeControl;
  let fixture: ComponentFixture<TreeControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
