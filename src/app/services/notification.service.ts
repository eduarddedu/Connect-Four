import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

export interface Msg {
  content: string;
  style: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _msgSource = new Subject<Msg | null>();

  msg = this._msgSource.asObservable();

  constructor(private ngZone: NgZone) {}

  update(content: string, style: 'danger' | 'info' | 'success' | 'warning') {
    const msg: Msg = { content, style };
    this.ngZone.run(() =>  this._msgSource.next(msg));
  }

  clear() {
    this.ngZone.run(() =>  this._msgSource.next(null));
  }
}
