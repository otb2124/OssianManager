import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputNumberControl } from './input-number-control';

describe('InputNumberControl', () => {
  let component: InputNumberControl;
  let fixture: ComponentFixture<InputNumberControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputNumberControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputNumberControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
