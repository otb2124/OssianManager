import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScenePage } from './scene-page';

describe('ScenePage', () => {
  let component: ScenePage;
  let fixture: ComponentFixture<ScenePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScenePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
