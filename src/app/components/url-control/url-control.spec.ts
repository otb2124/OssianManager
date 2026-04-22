import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrlControl } from './url-control';

describe('UrlControl', () => {
  let component: UrlControl;
  let fixture: ComponentFixture<UrlControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UrlControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UrlControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
