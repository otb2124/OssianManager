import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListControl } from './list-control';

describe('ListControl', () => {
  let component: ListControl;
  let fixture: ComponentFixture<ListControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
