// inspector-section.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from "primeng/accordion";

@Component({
  selector: 'app-accordion-panel',
  standalone: true,
  imports: [CommonModule, AccordionModule],
  templateUrl: './accordion-panel.html',
})
export class AccordionPanel {
  @Input({ required: true }) value!: string;
}