import { Component, ChangeDetectorRef, OnChanges, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  template: `<span *ngIf="active"><i class="far fa-clock"></i>&nbsp;{{hh_mm_ss}}</span>`,
  styles: [
    `span {
      display: inline-block;
      width: 75px;
      font-size: 13px;
      line-height: normal;
      text-align: left;
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnChanges, OnDestroy {
  @Input() active: boolean;
  @Input() displayOnInit: boolean;
  private updates: Observable<string>;
  private subscription: Subscription;
  private hh_mm_ss = '00:00:00';

  constructor(private cdr: ChangeDetectorRef) {
    this.updates = new Observable(function subscribe(subscriber) {
      const start = new Date(Date.now());
      const pushUpdate = setInterval(() => {
        const elapsed = new Date(Date.now() - start.getTime());
        elapsed.setHours(elapsed.getHours() - Math.abs(elapsed.getTimezoneOffset() / 60));
        const time = elapsed.toTimeString();
        const hhmmss = time.substr(0, time.indexOf(' '));
        subscriber.next(hhmmss);
      }, 1000);

      return function unsubscribe() {
        clearInterval(pushUpdate);
      };
    });

  }

  ngOnChanges() {
    if (this.active) {
      this.subscription = this.updates.subscribe(text => {
        this.hh_mm_ss = text;
        this.cdr.detectChanges();
      });
    } else {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


}
