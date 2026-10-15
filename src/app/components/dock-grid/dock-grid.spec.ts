import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DockGrid } from './dock-grid';

describe('DockGrid', () => {
  let component: DockGrid;
  let fixture: ComponentFixture<DockGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DockGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DockGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
