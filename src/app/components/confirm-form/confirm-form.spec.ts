import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmForm } from './confirm-form';

describe('ConfirmForm', () => {
  let component: ConfirmForm;
  let fixture: ComponentFixture<ConfirmForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
