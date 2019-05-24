import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parseFirstWord'
})
export class ParseFirstWordPipe implements PipeTransform {
  transform(value: string = ''): any {
    return value.replace(/ .*/g, '');
  }
}
