import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibrariesPage } from './libraries-page';

describe('LibrariesPage', () => {
  let component: LibrariesPage;
  let fixture: ComponentFixture<LibrariesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibrariesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibrariesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
