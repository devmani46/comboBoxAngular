import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
  Renderer2,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subject, takeUntil } from 'rxjs';
import { ComboboxOption } from '@/types/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkMenuModule } from '@angular/cdk/menu';

let _uniqueComboboxIdCounter = 0;

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    ScrollingModule,
    CdkMenuModule
  ],
  selector: 'app-combobox',
  templateUrl: './combobox.component.html',
  styleUrls: ['./combobox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Combobox implements ControlValueAccessor, AfterViewInit, OnInit, OnDestroy, OnChanges {
  disabled = false;
  addedOptions: ComboboxOption[] = [];
  filteredOptions: ComboboxOption[] = [];
  groupOptions: { label: string; value: any; options: ComboboxOption[] }[] = [];
  id = `fw-combobox-${_uniqueComboboxIdCounter++}`;
  inputCtrl = new FormControl('');
  displayFn = (option: ComboboxOption) => option.label;
  onChange = (_: any) => { };
  onTouched = () => { };
  private _dark = false;
  private _disableClear = false;
  private _flat = false;
  private _groups: { label: string; value: any; options: ComboboxOption[] }[] = [];
  private _hideTags = false;
  private _max?: number;
  private _multiple = false;
  private _native = false;
  private _options: ComboboxOption[] = [];
  private _placeholder = 'Search...';
  private _selectedValues: any[] = [];
  private _selectedOptions: ComboboxOption[] = [];
  private _small = false;
  private _sub$ = new Subject();
  private _taggable = false;

  @Input() icon = '';
  @Input() suffix = '';
  @Input() label = '';
  @Input() title = '';
  @Input() wrapperClass = '';
  @Input() compareWith = (o1: any, o2: any) => o1 == o2;
  @Input()
  set dark(value: any) {
    this._dark = coerceBooleanProperty(value);
  }
  get dark() {
    return this._dark;
  }
  @Input()
  set disableClear(value: any) {
    this._disableClear = coerceBooleanProperty(value);
  }
  get disableClear() {
    return this._disableClear;
  }
  @Input()
  set flat(value: any) {
    this._flat = coerceBooleanProperty(value)
  }
  get flat() {
    return this._flat;
  }
  @Input()
  set groups(groups: { label: string; value: any; options: ComboboxOption[] }[]) {
    this._groups = groups || [];
  }
  get groups() {
    return this._groups;
  }
  @Input()
  set hideTags(value: any) {
    this._hideTags = coerceBooleanProperty(value);
  }
  get hideTags() {
    return this._hideTags;
  }
  @Input()
  set max(value: any) {
    this._max = coerceNumberProperty(value);
  }
  get max() {
    return this._max;
  }
  @Input()
  set multiple(value: any) {
    this._multiple = coerceBooleanProperty(value);
  }
  get multiple() {
    return this._multiple;
  }
  @Input()
  set native(value: any) {
    this._native = coerceBooleanProperty(value);
  }
  get native() {
    return this._native;
  }
  @Input()
  set options(options: ComboboxOption[]) {
    this._options = options || [];
  }
  get options() {
    return this._options;
  }
  @Input()
  set placeholder(value: string) {
    this._placeholder = value;
  }
  get placeholder() {
    return this._placeholder;
  }
  @Input()
  set small(value: any) {
    this._small = coerceBooleanProperty(value);
  }
  get small() {
    return this._small;
  }
  @Input()
  set taggable(value: any) {
    this._taggable = coerceBooleanProperty(value);
  }
  get taggable() {
    return this._taggable;
  }
  @Output() selectChange = new EventEmitter<{ selectedOptions: ComboboxOption[], selected?: ComboboxOption }>();
  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('comboboxRef') comboboxRef?: ElementRef<HTMLDivElement>;
  @ViewChild(MatAutocompleteTrigger) matAutocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatAutocomplete) matAutocomplete?: MatAutocomplete;
  @HostListener('focusout')
  onFocusout(): void {
    if (!this.taggable) this.setLabel();
    this.onTouched();
  }

  constructor(@Optional() @Self() public ngControl: NgControl, private renderer: Renderer2) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    };
  }

  ngOnInit(): void {
    this.displayFn = (option: ComboboxOption) => {
      const label = option ? (typeof option == "string" ? option : option.label) : '';
      return this.multiple ? '' : label;
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['groups']) {
      // Re-evaluate selected options when options/groups change
      if (this._groups.length) {
        this._selectedOptions = this._groups.flatMap(g => g.options).filter(o => this.isSelected(o.value));
      } else {
        this._selectedOptions = this._options.filter(o => this.isSelected(o.value));
      }
      this.setLabel();
    }
  }

  ngAfterViewInit(): void {
    this.ngControl?.control?.valueChanges?.pipe(takeUntil(this._sub$)).subscribe(_ => this.setLabel());

    if (!this.matAutocomplete) return;
    this.matAutocomplete.classList = 'fw-listbox fw-combobox-listbox';
    this.matAutocomplete._keyManager.skipPredicate((item: any) => {
      return item?.value?.disabled;
    });
  }

  ngOnDestroy(): void {
    this._sub$.next(true);
    this._sub$.complete();
  }

  filter(): void {
    const filterValue = (this.inputRef?.nativeElement.value || '').toLowerCase();
    if (this._groups.length) {
      this.groupOptions = this._groups.map(g => ({
        ...g,
        options: g.options.filter(option => `${option.value}◬${option.label}`.toLowerCase().includes(filterValue))
      })).filter(group => group.options.length > 0);
    } else {
      this.filteredOptions = this._options.concat(this.addedOptions).filter(option => `${option.value}◬${option.label}`.toLowerCase().includes(filterValue));
    }
  }

  clear($event?: MouseEvent, focus: boolean = true) {
    $event?.preventDefault();
    $event?.stopPropagation();
    if (this.disabled) return;
    this.inputCtrl.reset();
    if (focus) this.inputRef?.nativeElement.focus();
    if (!(this.multiple || this.disableClear)) {
      this._selectedOptions = [];
      this._selectedValues = [];
      this.onChange('');
      this.selectChange.emit({ selectedOptions: [] });
    }
  }

  close() {
    this.matAutocompleteTrigger?.closePanel();
  }

  isSelected(value: any): boolean {
    return this._selectedValues.findIndex(s => this.compareWith(s, value)) >= 0;
  }

  onFocusin() {
    this.filteredOptions = this._options.concat(this.addedOptions);
    this.groupOptions = this._groups.slice();
  }

  onSelect(option: ComboboxOption) {
    this.selected(option);
  }

  onTagClick(option: ComboboxOption) {
    if (this.disabled) return;
    this.toggleMultiSelection(option);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  selected(option: any): void {
    let tempOption = option;
    if (!this.isSelected(option.value)) {
      if ((this.max >= 0) && this.selectedOptions.length >= this.max) return;
    }
    if (tempOption.extra == 'appended' && option.label && option.value) {
      tempOption = { label: option.label.trim(), value: option.value.trim() };
      let addedOptions = new Set([tempOption, ...this.addedOptions]);
      this.addedOptions = Array.from(addedOptions);
    }
    this.multiple ? this.toggleMultiSelection(tempOption) : this.toggleSelection(tempOption);
  }

  setLabel() {
    const selectedOption = this._selectedOptions[0];
    if (!this.multiple) {
      this.inputCtrl.setValue(selectedOption ? selectedOption.label : '');
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.inputCtrl.disable();
    } else {
      this.inputCtrl.enable();
    }
  }

  toggleSelection(option: ComboboxOption): void {
    const exists = this.options.find(o => this.compareWith(o, option));
    if (!exists && option.extra == 'appended') this.options = [option, ...this.options];
    this._selectedOptions = [option];
    this._selectedValues = [option.value];
    this.onChange(this._selectedValues[0]);
    this.selectChange.emit({ selectedOptions: this._selectedOptions, selected: option });
  }

  toggleMultiSelection(option: ComboboxOption): void {
    if (this.isSelected(option.value)) {
      const i = this._selectedOptions.findIndex(o => this.compareWith(o.value, option.value));
      const j = this._selectedValues.findIndex(v => this.compareWith(v, option.value));
      this._selectedOptions.splice(i, 1);
      this._selectedValues.splice(j, 1);
    } else {
      this._selectedOptions.push(option);
      this._selectedValues.push(option.value);
    }
    this.onChange(this._selectedValues);
    this.selectChange.emit({ selectedOptions: this._selectedOptions, selected: option });
  }

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this._selectedValues = value;
    }
    else if (typeof value == "string" || typeof value == "number" || typeof value == "object") {
      this._selectedValues = [value];
    }

    if (this._selectedValues.length) {
      if (this._groups.length) {
        this._selectedOptions = this._groups.flatMap(g => g.options).filter(o => this.isSelected(o.value));
      }
      else {
        this._selectedOptions = this._options.filter(o => this.isSelected(o.value));
      }
    } else {
      this._selectedOptions = [];
    }
    this.setLabel();
  }

  get invalid() { return (this.ngControl?.control?.touched && this.ngControl?.control?.invalid) || false; }
  get selectedOptions() { return this._selectedOptions; }
}
