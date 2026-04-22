import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppConfigForm } from './app-config-form';

describe('AppConfigForm', () => {
  let component: AppConfigForm;
  let fixture: ComponentFixture<AppConfigForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppConfigForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppConfigForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
