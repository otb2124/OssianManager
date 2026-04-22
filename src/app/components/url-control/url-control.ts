import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UrlBreadcrumbComponent } from '../url-breadcrumb/url-breadcrumb';

@Component({
  selector: 'app-url-control',
  imports: [ButtonModule, UrlBreadcrumbComponent],
  templateUrl: './url-control.html',
  styleUrl: './url-control.css',
})
export class UrlControl {

  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }

  goForward() {
    this.location.forward();
  }

  refreshPage() {
    window.location.reload();
  }
}