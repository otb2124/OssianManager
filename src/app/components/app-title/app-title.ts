import { Component, inject } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { AppConfigService } from '../../services/data/app-config/app-config.service';
import { EngineService } from '../../services/data/engine-config/engine.service';

@Component({
  selector: 'app-title',
  imports: [TagModule, CommonModule],
  templateUrl: './app-title.html',
})
export class AppTitle {
  protected appConfigService = inject(AppConfigService);
  protected engineConfigService = inject(EngineService);
}