import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTreePanel } from './file-tree-panel';

describe('FileTreePanel', () => {
  let component: FileTreePanel;
  let fixture: ComponentFixture<FileTreePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreePanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
