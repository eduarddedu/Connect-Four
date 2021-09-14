import { Injectable } from '@angular/core';
import { User } from './util/models';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  getPoints(user: User): number {
   return +localStorage.getItem(user.id) || 0;
  }

  setPoints(user: User, points: number) {
    localStorage.setItem(user.id, `${points}`);
  }
}
