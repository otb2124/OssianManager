import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagSelectControl } from './tag-select-control';

describe('TagSelectControl', () => {
  let component: TagSelectControl;
  let fixture: ComponentFixture<TagSelectControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagSelectControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagSelectControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
