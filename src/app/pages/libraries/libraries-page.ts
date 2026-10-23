import { Component } from '@angular/core';
import { LibrariesList } from '../../components/libraries/libraries-list/libraries-list';

@Component({
  selector: 'app-libraries-page',
  imports: [LibrariesList],
  templateUrl: './libraries-page.html',
  styleUrl: './libraries-page.css',
})
export class LibrariesPage {

}