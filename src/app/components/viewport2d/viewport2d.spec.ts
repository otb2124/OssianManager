import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Viewport2d } from './viewport2d';

describe('Viewport2d', () => {
  let component: Viewport2d;
  let fixture: ComponentFixture<Viewport2d>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Viewport2d]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Viewport2d);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
