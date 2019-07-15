import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  getUserPoints(): number {
    const points = localStorage.getItem('points');
    if (points) {
      return +points;
    } else {
      return 0;
    }
  }

  setUserPoints(points: number) {
    localStorage.setItem('points', `${points}`);
  }

  getBotPoints(): number {
    const points = localStorage.getItem('aipoints');
    if (points) {
      return +points;
    } else {
      return 0;
    }
  }

  setBotPoints(points: number) {
    localStorage.setItem('aipoints', `${points}`);
  }
}
