import { Component, Input, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-timer',
  template: `<span id="hourMinSec">00:00:00</span>`,
  styles: [`
    span {
      display: inline-block;
      width: 67px;
      font-size: 16px;
      line-height: normal;
      font-family: 'Nunito', sans-serif;
      color: #aaa;
    }`
  ]
})
export class TimerComponent implements AfterViewInit, OnDestroy {
  @Input() startDate: Date;
  updates: Observable<string>;
  updateInterval: any;
  formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.updates = new Observable(subscriber => {
      subscriber.next(this.getHourMinuteSecondStr());
      this.updateInterval = setInterval(() => subscriber.next(this.getHourMinuteSecondStr()), 1000);
    });
    this.ngZone.runOutsideAngular(() => {
      this.updates.subscribe(value => {
        document.getElementById('hourMinSec').innerHTML = value;
      });
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
