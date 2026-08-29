import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccordionControl } from './accordion-control';

describe('AccordionControl', () => {
  let component: AccordionControl;
  let fixture: ComponentFixture<AccordionControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccordionControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccordionControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
