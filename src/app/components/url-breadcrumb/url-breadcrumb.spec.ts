import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrlBreadcrumb } from './url-breadcrumb';

describe('UrlBreadcrumb', () => {
  let component: UrlBreadcrumb;
  let fixture: ComponentFixture<UrlBreadcrumb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UrlBreadcrumb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UrlBreadcrumb);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
