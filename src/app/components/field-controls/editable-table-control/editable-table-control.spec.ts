import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableTableControl } from './editable-table-control';

describe('EditableTableControl', () => {
  let component: EditableTableControl;
  let fixture: ComponentFixture<EditableTableControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditableTableControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableTableControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
