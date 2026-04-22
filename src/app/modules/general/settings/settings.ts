import { Component } from '@angular/core';
import { AppConfigForm } from "../../../components/app-config-form/app-config-form";

@Component({
  selector: 'app-settings',
  imports: [AppConfigForm],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {

}
