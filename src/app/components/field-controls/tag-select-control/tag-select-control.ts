import { Component, inject, OnInit, forwardRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { PopoverModule } from 'primeng/popover';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProjectRecordTag } from '../../../model/project-record.model';
import { NotificationService } from '../../../services/notifications/notification.service';
import { UserTagService } from '../../../services/data/user-tags/user-tag.service';

@Component({
  selector: 'app-tag-select-control',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ColorPickerModule, PopoverModule, TagModule, DividerModule],
  templateUrl: './tag-select-control.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagSelectControl),
      multi: true
    }
  ]
})
export class TagSelectControl implements OnInit, ControlValueAccessor {

  private tagService = inject(UserTagService);
  private notifications = inject(NotificationService);

  @Input() label?: string;

  @Input() set value(val: string[] | null | undefined) {
    this.selectedTagIds = val ?? [];
  }
  @Output() valueChange = new EventEmitter<string[]>();

  availableTags: ProjectRecordTag[] = [];
  selectedTagIds: string[] = [];

  activeTag: ProjectRecordTag | null = null;
  tagLabel = '';
  tagColor = '#6b7280';

  disabled = false;

  private onChange = (_: string[]) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.tagService.getAll().subscribe(tags => this.availableTags = tags);
  }

  // Model value is now an array of string IDs
  writeValue(tagIds: string[]): void {
    this.selectedTagIds = tagIds ?? [];
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  // Map selected IDs to full tag objects for template rendering
  get selectedTags(): ProjectRecordTag[] {
    return this.selectedTagIds
      .map(id => this.availableTags.find(t => t.id === id))
      .filter((t): t is ProjectRecordTag => t !== undefined);
  }

  get unselectedTags(): ProjectRecordTag[] {
    return this.availableTags.filter(t => !this.selectedTagIds.includes(t.id));
  }

  isSelected(tag: ProjectRecordTag): boolean {
    return this.selectedTagIds.includes(tag.id);
  }

  openTagPopover(tag: ProjectRecordTag, event: Event, popover: any): void {
    if (this.disabled) return;
    event.stopPropagation();
    this.activeTag = tag;
    this.tagLabel = tag.label;
    this.tagColor = tag.color ?? '#6b7280';
    popover.show(event);
  }

  openCreatePopover(event: Event, popover: any): void {
    if (this.disabled) return;
    event.stopPropagation();
    this.activeTag = null;
    this.tagLabel = '';
    this.tagColor = '#6b7280';
    popover.show(event);
  }

  selectTag(): void {
    if (!this.activeTag) return;
    this.selectedTagIds = [...this.selectedTagIds, this.activeTag.id];
    this.notifyChange();
  }

  deselectActiveTag(): void {
    if (!this.activeTag) return;
    this.selectedTagIds = this.selectedTagIds.filter(id => id !== this.activeTag!.id);
    this.notifyChange();
  }

  deselectTag(tag: ProjectRecordTag, event: Event): void {
    if (this.disabled) return;
    event.stopPropagation();
    this.selectedTagIds = this.selectedTagIds.filter(id => id !== tag.id);
    this.notifyChange();
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
        this.notifications.success('Tag updated');
      } else {
        // Automatically select newly created tag
        this.selectedTagIds = [...this.selectedTagIds, tag.id];
        this.onChange(this.selectedTagIds);
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
      this.selectedTagIds = this.selectedTagIds.filter(tagId => tagId !== id);
      this.onChange(this.selectedTagIds);
      this.loadTags();
      this.notifications.info('Tag deleted');
      popover.hide();
    });
  }

  private notifyChange(): void {
    this.onChange(this.selectedTagIds);
    this.valueChange.emit(this.selectedTagIds);
    this.onTouched();
  }
}