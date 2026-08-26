import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTreeNode } from './file-tree-node';

describe('FileTreeNode', () => {
  let component: FileTreeNode;
  let fixture: ComponentFixture<FileTreeNode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeNode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreeNode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
