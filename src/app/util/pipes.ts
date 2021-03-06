import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'surname'})
export class SurnamePipe implements PipeTransform {
  transform(value: string = ''): any {
    return value.replace(/ .*/g, '');
  }
}

@Pipe({ name: 'reverse' })
export class ReversePipe implements PipeTransform {
  transform(array: unknown[]) {
    return array.slice().reverse();
  }
}
