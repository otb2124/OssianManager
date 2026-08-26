import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileInspectorPanel } from './file-inspector-panel';

describe('FileInspectorPanel', () => {
  let component: FileInspectorPanel;
  let fixture: ComponentFixture<FileInspectorPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileInspectorPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileInspectorPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
