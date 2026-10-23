import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPickerControl } from './color-picker-control';

describe('ColorPickerControl', () => {
  let component: ColorPickerControl;
  let fixture: ComponentFixture<ColorPickerControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPickerControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColorPickerControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
