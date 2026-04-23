import { Component } from '@angular/core';
import { UrlControl } from "../url-control/url-control";
import { AppTitleAlt } from "../app-title-alt/app-title-alt";

@Component({
  selector: 'app-bottombar',
  imports: [UrlControl, AppTitleAlt],
  templateUrl: './bottombar.html',
  styleUrl: './bottombar.css',
})
export class Bottombar {

}
