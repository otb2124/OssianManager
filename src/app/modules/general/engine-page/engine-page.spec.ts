import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnginePage } from './engine-page';

describe('EnginePage', () => {
  let component: EnginePage;
  let fixture: ComponentFixture<EnginePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnginePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnginePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
