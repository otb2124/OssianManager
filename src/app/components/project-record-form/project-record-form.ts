import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { HydratedProjectRecord, ProjectRecordTag } from '../../model/project-record.model';
import { TagSelector } from '../tag-selector/tag-selector';

@Component({
  selector: 'app-project-record-form',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    ColorPickerModule,
    TagSelector
  ],
  templateUrl: './project-record-form.html',
})
export class ProjectRecordForm implements OnInit {

  readonly project = input<HydratedProjectRecord | null>(null);
  readonly submitted = output<Partial<HydratedProjectRecord>>();
  readonly cancelled = output<void>();

  title = '';
  description = '';
  color = '';
  isFavorite = false;
  selectedTags: ProjectRecordTag[] = [];

  ngOnInit(): void {
    const p = this.project();
    if (p) {
      this.title = p.title;
      this.description = p.description ?? '';
      this.color = p.color ?? '';
      this.isFavorite = p.isFavorite;
      this.selectedTags = p.tags;
    }
  }

  submit(): void {
    this.submitted.emit({
      title: this.title,
      description: this.description || undefined,
      color: this.color || undefined,
      isFavorite: this.isFavorite,
      tags: this.selectedTags,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}