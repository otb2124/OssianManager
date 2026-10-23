import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShaderBackground } from './shader-background';

describe('ShaderBackground', () => {
  let component: ShaderBackground;
  let fixture: ComponentFixture<ShaderBackground>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShaderBackground]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShaderBackground);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
