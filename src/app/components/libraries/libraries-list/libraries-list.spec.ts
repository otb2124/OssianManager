import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrariesList } from './libraries-list';

describe('LibrariesList', () => {
  let component: LibrariesList;
  let fixture: ComponentFixture<LibrariesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrariesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibrariesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
