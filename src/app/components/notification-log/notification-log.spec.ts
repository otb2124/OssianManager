import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationLog } from './notification-log';

describe('NotificationLog', () => {
  let component: NotificationLog;
  let fixture: ComponentFixture<NotificationLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
