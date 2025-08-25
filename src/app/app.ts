import { Component } from '@angular/core';
import { Combobox } from './component/combobox/combobox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Combobox, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  title = 'Angular Combobox';

  animals = ['Cat', 'Dog', 'Ferret', 'Fish', 'Hamster', 'Snake'];

  selectedPet: string | null = null;

  onPetSelected(pet: string) {
    this.selectedPet = pet;
    console.log('Selected pet:', pet);
  }
}
