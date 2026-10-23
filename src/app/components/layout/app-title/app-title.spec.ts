import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTitle } from './app-title';

describe('AppTitle', () => {
  let component: AppTitle;
  let fixture: ComponentFixture<AppTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTitle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppTitle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
