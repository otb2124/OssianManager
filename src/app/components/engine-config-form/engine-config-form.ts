import { appConfig } from './../../app.config';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { DialogService } from '../../services/persistence/dialog.service';
import { EngineService } from '../../services/engine-config/engine.service';
import { AppConfigService } from '../../services/app-config/app-config.service';

@Component({
  selector: 'app-engine-config-form',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ChipModule,
  ],
  templateUrl: './engine-config-form.html',
})
export class EngineConfigForm implements OnInit {

  private engineService = inject(EngineService);
  private appConfigService = inject(AppConfigService);

  private dialog = inject(DialogService);

  version = '';
  versionTags: string[] = [];
  title = '';
  newTag = '';
  executablePath = '';
  engineProjectPath = '';

  ngOnInit(): void {
    const config = this.engineService.config();
    if (!config) return;
    this.version = config.version;
    this.versionTags = [...config.versionTags];
    this.title = config.appTitle;
    this.executablePath = config.executablePath ?? '';

    const appConfig = this.appConfigService.config();
    if (!appConfig) return;

    this.engineProjectPath = appConfig.engineProjectPath ?? '';
  }

  pickExecutablePath(): void {
    this.dialog.pickFile([{ name: 'Visual Studio Solution', extensions: ['sln'] }]).subscribe(path => {
      if (path) this.executablePath = path;
    });
  }

  pickEnginePath(): void {
    this.dialog.pickFolder().subscribe(path => {
      if (path) this.executablePath = path;
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
    this.engineService.update({
      version: this.version,
      versionTags: [...this.versionTags],
      appTitle: this.title,
      executablePath: this.executablePath || undefined,
    }).subscribe();

    this.appConfigService.update({
      engineProjectPath: this.engineProjectPath
    }).subscribe();
  }
}