import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown-selector.component.html',
  styleUrls: ['./dropdown-selector.component.css']
})
export class DropdownSelectorComponent {

  @Input() items: {key: string, selected: boolean, value: any}[];

  @Output() select$: EventEmitter<any> = new EventEmitter();

  onSelectItem(i: number) {
    this.select$.emit(this.items[i].value);
  }

}
