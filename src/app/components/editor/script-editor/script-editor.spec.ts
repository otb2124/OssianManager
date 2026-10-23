import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptEditor } from './script-editor';

describe('ScriptEditor', () => {
  let component: ScriptEditor;
  let fixture: ComponentFixture<ScriptEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
