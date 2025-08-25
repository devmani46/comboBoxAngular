import { Component, Input, Output, EventEmitter, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combobox.html',
  styleUrls: ['./combobox.scss']
})
export class Combobox implements OnDestroy {
  @Input() options: string[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() searchable: boolean = true;
  @Input() disabledOptions: string[] = [];

  @Output() valueChange = new EventEmitter<string>();

  searchText: string = '';
  isOpen: boolean = false;
  selected: string | null = null;

  constructor(private elementRef: ElementRef) {}

  get filteredOptions(): string[] {
    if (!this.searchable || !this.searchText.trim()) {
      return this.options;
    }
    return this.options.filter(o =>
      o.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openDropdown(): void {
    this.isOpen = true;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectOption(option: string): void {
    if (this.disabledOptions.includes(option)) return;
    this.selected = option;
    this.valueChange.emit(option);
    this.closeDropdown();
    this.searchText = '';
  }

  isDisabled(option: string): boolean {
    return this.disabledOptions.includes(option);
  }

  // Close on outside click
  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null) {
    if (this.isOpen && target instanceof HTMLElement && !this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }
  // Close on ESC key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: Event) {
    if (event instanceof KeyboardEvent && this.isOpen) {
      this.closeDropdown();
      event.stopPropagation();
    }
  }

  ngOnDestroy(): void {
    this.closeDropdown();
  }
}
