import { Component, Input, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-timer',
  templateUrl: 'timer.component.html',
  styleUrls: ['timer.component.css']
})
export class TimerComponent implements AfterViewInit, OnDestroy {
  @Input() startDate: Date;
  updates: Observable<string>;
  updateInterval: any;
  formatter = new Intl.DateTimeFormat('en-US', {
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  });

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.updates = new Observable(subscriber => {
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
    const elapsed = Date.now() - this.startDate.getTime();
    const since = new Date(elapsed);
    return this.formatter.format(since);
  }

}
