import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransformControl } from './transform-control';

describe('TransformControl', () => {
  let component: TransformControl;
  let fixture: ComponentFixture<TransformControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransformControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransformControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
