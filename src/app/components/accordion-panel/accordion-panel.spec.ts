import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccordionPanel } from './accordion-panel';

describe('AccordionPanel', () => {
  let component: AccordionPanel;
  let fixture: ComponentFixture<AccordionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccordionPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccordionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
