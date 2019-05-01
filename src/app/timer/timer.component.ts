import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-timer',
  template: `<span *ngIf="updateTime | async as time">{{time}}</span>`,
  styles: [`
    span {
      display: inline-block;
      width: 66px;
      font-size: 16px;
      line-height: normal;
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
