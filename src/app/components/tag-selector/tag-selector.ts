import { Component, inject, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProjectRecordTag } from '../../model/project-record.model';
import { NotificationService } from '../../services/notifications/notification.service';
import { UserTagService } from '../../services/data/user-tags/user-tag.service';

@Component({
  selector: 'app-tag-selector',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ColorPickerModule, PopoverModule, TagModule, DividerModule],
  templateUrl: './tag-selector.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagSelector),
      multi: true
    }
  ]
})
export class TagSelector implements OnInit, ControlValueAccessor {

  private tagService = inject(UserTagService);
  private notifications = inject(NotificationService);

  availableTags: ProjectRecordTag[] = [];
  selectedTags: ProjectRecordTag[] = [];

  activeTag: ProjectRecordTag | null = null;
  tagLabel = '';
  tagColor = '#6b7280';

  private onChange = (_: ProjectRecordTag[]) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.tagService.getAll().subscribe(tags => this.availableTags = tags);
  }

  writeValue(tags: ProjectRecordTag[]): void {
    this.selectedTags = tags ?? [];
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  isSelected(tag: ProjectRecordTag): boolean {
    return this.selectedTags.some(t => t.id === tag.id);
  }

  get unselectedTags(): ProjectRecordTag[] {
    return this.availableTags.filter(t => !this.isSelected(t));
  }

  openTagPopover(tag: ProjectRecordTag, event: Event, popover: any): void {
    event.stopPropagation();
    this.activeTag = tag;
    this.tagLabel = tag.label;
    this.tagColor = tag.color ?? '#6b7280';
    popover.show(event);
  }

  openCreatePopover(event: Event, popover: any): void {
    event.stopPropagation();
    this.activeTag = null;
    this.tagLabel = '';
    this.tagColor = '#6b7280';
    popover.show(event);
  }

  selectTag(): void {
    if (!this.activeTag) return;
    this.selectedTags = [...this.selectedTags, this.activeTag];
    this.onChange(this.selectedTags);
    this.onTouched();
  }

  deselectActiveTag(): void {
    if (!this.activeTag) return;
    this.selectedTags = this.selectedTags.filter(t => t.id !== this.activeTag!.id);
    this.onChange(this.selectedTags);
    this.onTouched();
  }

  deselectTag(tag: ProjectRecordTag, event: Event): void {
    event.stopPropagation();
    this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id);
    this.onChange(this.selectedTags);
    this.onTouched();
  }

  saveTag(popover: any): void {
    if (!this.tagLabel.trim()) return;
    const tag: ProjectRecordTag = {
      id: this.activeTag?.id ?? crypto.randomUUID(),
      label: this.tagLabel.trim(),
      color: this.tagColor,
    };
    this.tagService.save(tag).subscribe(() => {
      if (this.activeTag) {
        this.selectedTags = this.selectedTags.map(t => t.id === tag.id ? tag : t);
        this.onChange(this.selectedTags);
        this.notifications.success('Tag updated');
      } else {
        this.notifications.success('Tag created');
      }
      this.loadTags();
      popover.hide();
    });
  }

  deleteTag(popover: any): void {
    if (!this.activeTag) return;
    const id = this.activeTag.id;
    this.tagService.delete(id).subscribe(() => {
      this.selectedTags = this.selectedTags.filter(t => t.id !== id);
      this.onChange(this.selectedTags);
      this.loadTags();
      this.notifications.info('Tag deleted');
      popover.hide();
    });
  }
}