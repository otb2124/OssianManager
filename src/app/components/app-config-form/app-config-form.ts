import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ChipModule } from 'primeng/chip';
import { AppConfigService } from '../../services/app-config/app-config.service';
import { DialogService } from '../../services/persistence/dialog.service';

@Component({
  selector: 'app-config-form',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ColorPickerModule,
    ChipModule,
  ],
  templateUrl: './app-config-form.html',
})
export class AppConfigForm implements OnInit {

  private appConfigService = inject(AppConfigService);
  private dialog = inject(DialogService);

  version = '';
  versionTags: string[] = [];
  newTag = '';
  themeColor = '';
  engineProjectPath = '';

  ngOnInit(): void {
    const config = this.appConfigService.config();
    if (!config) return;
    this.version = config.version;
    this.versionTags = [...config.versionTags];
    this.themeColor = config.settings.themeColor;
    this.engineProjectPath = config.engineProjectPath ?? '';
  }

  pickEnginePath(): void {
    this.dialog.pickFile([{ name: 'Solution', extensions: ['sln'] }]).subscribe(path => {
      if (path) this.engineProjectPath = path;
    });
  }

  addTag(): void {
    const tag = this.newTag.trim();
    if (!tag || this.versionTags.includes(tag)) return;
    this.versionTags = [...this.versionTags, tag];
    this.newTag = '';
  }

  removeTag(tag: string): void {
    this.versionTags = this.versionTags.filter(t => t !== tag);
  }

  submit(): void {
    this.appConfigService.update({
      version: this.version,
      versionTags: [...this.versionTags],
      engineProjectPath: this.engineProjectPath || undefined,
      settings: {
        themeColor: this.themeColor,
      },
    }).subscribe(x => console.log('saved', x));
  }
}