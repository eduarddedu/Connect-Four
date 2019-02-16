import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  public setCookie(cname: string, cvalue: string, exdays: number) {
    const date = new Date();
    date.setTime(date.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';' + 'path=/';
  }

  public getCookie(cname: string): string {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].replace(/^\s+/gm, '');
      if (c.indexOf(name) === 0) {
        return c.substr(name.length);
      }
    }
    return '';
  }

}
