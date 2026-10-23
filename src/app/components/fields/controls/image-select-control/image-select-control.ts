import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FloatLabelModule } from 'primeng/floatlabel';

export interface ImageSelectOption {
  label?: string;
  value: any;
  imageUrl: string;
}

export type ImageSelectSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

@Component({
  selector: 'app-image-select-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectButtonModule, FloatLabelModule],
  templateUrl: './image-select-control.html',
})
export class ImageSelectControl {
  @Input() label = '';
  @Input() value: any = null;
  @Input() options: ImageSelectOption[] = [];
  @Input() readonly = false;
  @Input() size: ImageSelectSize = 'md';
  @Input() showItemLabels = true;

  @Output() valueChange = new EventEmitter<any>();

  onChange(newValue: any): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  get imageSizeClass(): string {
    switch (this.size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-24 h-24';
      case '2xl': return 'w-32 h-32';
      case 'md':
      default: return 'w-12 h-12';
    }
  }

  get labelMaxWidthClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-[2rem]';
      case 'lg': return 'max-w-[4rem]';
      case 'xl': return 'max-w-[6rem]';
      case '2xl': return 'max-w-[8rem]';
      case 'md':
      default: return 'max-w-[3rem]';
    }
  }
}