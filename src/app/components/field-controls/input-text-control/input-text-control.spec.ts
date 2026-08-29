import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTextControl } from './input-text-control';

describe('InputTextControl', () => {
  let component: InputTextControl;
  let fixture: ComponentFixture<InputTextControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTextControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputTextControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
