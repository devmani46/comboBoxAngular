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

  highlightedIndex: number = -1;
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
    this.highlightedIndex = -1;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.highlightedIndex = -1;
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.highlightedIndex = -1;
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

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null) {
    if (this.isOpen && target instanceof HTMLElement && !this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }
@HostListener('document:keydown.escape', ['$event'])
onEscapePress(event: Event) {
  const keyboardEvent = event as KeyboardEvent;
  if (this.isOpen) {
    this.closeDropdown();
    keyboardEvent.stopPropagation();
  }
}

@HostListener('document:keydown', ['$event'])
onKeyDown(event: Event) {
  if (!this.isOpen) return;

  const keyboardEvent = event as KeyboardEvent;
  const options = this.filteredOptions;

  if (keyboardEvent.key === 'ArrowDown') {
    keyboardEvent.preventDefault();
    if (this.highlightedIndex < options.length - 1) {
      this.highlightedIndex++;
    } else {
      this.highlightedIndex = 0;
    }
  }

  if (keyboardEvent.key === 'ArrowUp') {
    keyboardEvent.preventDefault();
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
    } else {
      this.highlightedIndex = options.length - 1;
    }
  }

  if (keyboardEvent.key === 'Enter') {
    keyboardEvent.preventDefault();
    if (this.highlightedIndex >= 0 && this.highlightedIndex < options.length) {
      this.selectOption(options[this.highlightedIndex]);
    }
  }
}

  ngOnDestroy(): void {
    this.closeDropdown();
  }
}
