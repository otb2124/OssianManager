import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesPanel } from './resources-panel';

describe('ResourcesPanel', () => {
  let component: ResourcesPanel;
  let fixture: ComponentFixture<ResourcesPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcesPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
