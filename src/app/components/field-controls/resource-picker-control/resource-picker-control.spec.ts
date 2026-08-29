import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePickerControl } from './resource-picker-control';

describe('ResourcePickerControl', () => {
  let component: ResourcePickerControl;
  let fixture: ComponentFixture<ResourcePickerControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcePickerControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePickerControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
