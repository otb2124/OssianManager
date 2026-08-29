import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VectorControl } from './vector-control';

describe('VectorControl', () => {
  let component: VectorControl;
  let fixture: ComponentFixture<VectorControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VectorControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VectorControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
