import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-timer',
  template: `<span *ngIf="observable | async as time">{{time}}</span>`,
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
  observable: Observable<string>;
  updateInterval: any;
  formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });

  ngOnInit() {
    this.observable = new Observable(subscriber => {
      subscriber.next('00:00:00');
      this.updateInterval = setInterval(() => subscriber.next(this.getHourMinuteSecondStr()), 1000);
    });
  }

  ngOnDestroy() {
    clearInterval(this.updateInterval);
  }

  getHourMinuteSecondStr() {
    const since = new Date(Date.now() - this.startDate.getTime());
    return this.formatter.format(since);
  }

}
