import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanControl } from './boolean-control';

describe('BooleanControl', () => {
  let component: BooleanControl;
  let fixture: ComponentFixture<BooleanControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BooleanControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BooleanControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
