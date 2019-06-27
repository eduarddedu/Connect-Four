import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  getPoints(): number {
    const points = localStorage.getItem('points');
    if (points) {
      return +points;
    } else {
      return 0;
    }
  }

  setPoints(points: number) {
    localStorage.setItem('points', `${points}`);
  }
}
