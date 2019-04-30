import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-timer',
  template: `<span *ngIf="updateTime | async as time">{{time}}</span>`,
  styles: [
    `i {
      padding: 3px;
      vertical-align: 0.25px;
    }
    span {
      display: inline-block;
      font-size: inherit;
      width: 66px;
      line-height: normal;
      text-align: left;
    }`
  ]
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() startDate: Date;
  updateTime: Observable<string>;
  interval: any;

  ngOnInit() {
    this.updateTime = new Observable(subscriber => {
      const getElapsedTime = () => {
        const elapsed = new Date(Date.now() - this.startDate.getTime());
        elapsed.setHours(elapsed.getHours() - Math.abs(elapsed.getTimezoneOffset() / 60));
        return elapsed.toTimeString().substr(0, 8);
      };
      subscriber.next(getElapsedTime());
      this.interval = setInterval(() => subscriber.next(getElapsedTime()), 1000);
    });
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

}
