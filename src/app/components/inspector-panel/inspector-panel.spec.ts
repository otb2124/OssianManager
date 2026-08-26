import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorPanel } from './inspector-panel';

describe('InspectorPanel', () => {
  let component: InspectorPanel;
  let fixture: ComponentFixture<InspectorPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
