import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagSelector } from './tag-selector';

describe('TagSelector', () => {
  let component: TagSelector;
  let fixture: ComponentFixture<TagSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
