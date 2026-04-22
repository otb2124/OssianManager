import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngineConfigForm } from './engine-config-form';

describe('EngineConfigForm', () => {
  let component: EngineConfigForm;
  let fixture: ComponentFixture<EngineConfigForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EngineConfigForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EngineConfigForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
