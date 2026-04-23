import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bottombar } from './bottombar';

describe('Bottombar', () => {
  let component: Bottombar;
  let fixture: ComponentFixture<Bottombar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bottombar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bottombar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
