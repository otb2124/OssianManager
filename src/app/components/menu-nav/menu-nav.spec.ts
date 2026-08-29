import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleControl } from './module-control';

describe('ModuleControl', () => {
  let component: ModuleControl;
  let fixture: ComponentFixture<ModuleControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
