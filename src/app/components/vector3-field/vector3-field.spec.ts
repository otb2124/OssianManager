import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vector3Field } from './vector3-field';

describe('Vector3Field', () => {
  let component: Vector3Field;
  let fixture: ComponentFixture<Vector3Field>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vector3Field]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vector3Field);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
