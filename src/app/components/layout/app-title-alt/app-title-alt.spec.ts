import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTitleAlt } from './app-title-alt';

describe('AppTitleAlt', () => {
  let component: AppTitleAlt;
  let fixture: ComponentFixture<AppTitleAlt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTitleAlt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppTitleAlt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
