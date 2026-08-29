import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { FieldConfig } from '../../components/field-list/field-list';

export interface DialogFormConfig {
  title: string;
  fields: FieldConfig[];
  model?: Record<string, any>;
  submitLabel?: string;
  cancelLabel?: string;
  width?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogFormService {
  readonly isOpen = signal(false);
  readonly config = signal<DialogFormConfig | null>(null);
  readonly currentModel = signal<Record<string, any>>({});

  private resultSubject?: Subject<Record<string, any> | null>;

  open(config: DialogFormConfig): Promise<Record<string, any> | null> {
    this.config.set(config);
    this.currentModel.set(structuredClone(config.model || {}));
    
    // Defer signal update to next microtask tick
    queueMicrotask(() => {
      this.isOpen.set(true);
    });

    this.resultSubject = new Subject<Record<string, any> | null>();
    return new Promise((resolve) => {
      this.resultSubject?.subscribe((result) => resolve(result));
    });
  }

  submit(model: Record<string, any>): void {
    const result = structuredClone(model);

    // Force hide asynchronously to break out of button event call stack
    setTimeout(() => {
      this.isOpen.set(false);
      
      if (this.resultSubject) {
        this.resultSubject.next(result);
        this.resultSubject.complete();
      }

      setTimeout(() => this.config.set(null), 200);
    }, 0);
  }

  cancel(): void {
    setTimeout(() => {
      this.isOpen.set(false);

      if (this.resultSubject) {
        this.resultSubject.next(null);
        this.resultSubject.complete();
      }

      setTimeout(() => this.config.set(null), 200);
    }, 0);
  }
}