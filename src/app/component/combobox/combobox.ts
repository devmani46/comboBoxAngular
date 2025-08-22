import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combobox.html',
  styleUrls: ['./combobox.scss']
})
export class Combobox {
  @Input() options: string[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() searchable: boolean = true; // 🔹 enable/disable search
  @Input() disabledOptions: string[] = []; // 🔹 disable some options

  @Output() valueChange = new EventEmitter<string>();

  searchText: string = '';   // ✅ use this consistently
  isOpen: boolean = false;
  selected: string | null = null;

  get filteredOptions(): string[] {
    if (!this.searchable || !this.searchText.trim()) {
      return this.options;
    }
    return this.options.filter(o =>
      o.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: string): void {
    if (this.disabledOptions.includes(option)) return;
    this.selected = option;
    this.valueChange.emit(option);
    this.isOpen = false;
    this.searchText = '';
  }

  isDisabled(option: string): boolean {
    return this.disabledOptions.includes(option);
  }

  
}


