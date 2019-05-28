import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'firstWord'})
export class FirstWordPipe implements PipeTransform {
  transform(value: string = ''): any {
    return value.replace(/ .*/g, '');
  }
}

@Pipe({ name: 'reverse' })
export class ReversePipe implements PipeTransform {
  transform(value: unknown[]) {
    return value.slice().reverse();
  }
}