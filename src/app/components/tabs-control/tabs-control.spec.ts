import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsControl } from './tabs-control';

describe('TabsControl', () => {
  let component: TabsControl;
  let fixture: ComponentFixture<TabsControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
