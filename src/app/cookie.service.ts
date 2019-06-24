import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  public setItem(cname: string, cvalue: string, exdays: number) {
    document.cookie = new CookieBuilder(cname, cvalue, exdays).get();
  }

  public getItem(cname: string): string {
    return CookieReader.get(cname);
  }

  public hasItem(cname: string): boolean {
    return !!CookieReader.get(cname);
  }
}

class CookieBuilder {
  private cookieAttrs: Map<string, string> = new Map();
  private _cookie: string;

  constructor(cname: string, cvalue: string, exdays: number) {
    this._cookie = `${encodeURIComponent(cname)}=${encodeURIComponent(cvalue)};`;
    this.cookieAttrs.set('domain', environment.origin);
    this.cookieAttrs.set('path', '/');
    this.cookieAttrs.set('expires', new Date(Date.now() + exdays * 24 * 60 * 60 * 1000).toUTCString());
    this.cookieAttrs.forEach((value: string, key: string) => this._cookie += `${key}=${value};`);
  }

  get() {
    return this._cookie;
  }
}

class CookieReader {
  static get(cname: string): string {
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
