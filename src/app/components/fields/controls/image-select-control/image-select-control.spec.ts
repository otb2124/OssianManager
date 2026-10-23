import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSelectControl } from './image-select-control';

describe('ImageSelectControl', () => {
  let component: ImageSelectControl;
  let fixture: ComponentFixture<ImageSelectControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageSelectControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageSelectControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
