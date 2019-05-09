import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  public setCookie(cname: string, cvalue: string, exdays: number) {
    let cookie = `${cname}=${cvalue};`;
    const attrs: Map<string, string> = new Map();
    attrs.set('domain', environment.origin);
    attrs.set('path', '/');
    attrs.set('expires', new Date(Date.now() + exdays * 24 * 60 * 60 * 1000).toUTCString());
    attrs.forEach((value: string, key: string) => cookie += `${key}=${value};`);
    document.cookie = cookie;
  }

  public getCookieValue(cname: string): string {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].replace(/^\s+/gm, '');
      if (c.indexOf(name) === 0) {
        return c.substr(name.length);
      }
    }
  }

}
