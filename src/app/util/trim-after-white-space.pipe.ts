import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimAfterWhiteSpace'
})
export class TrimAfterWhiteSpacePipe implements PipeTransform {

  transform(value: string = ''): any {
    return value.replace(/ .*/g, '');
  }

}
