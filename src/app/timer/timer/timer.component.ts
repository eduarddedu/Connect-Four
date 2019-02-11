import { Component, ChangeDetectorRef, OnChanges, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  template: `<span *ngIf="active"><i class="far fa-clock"></i>&nbsp;{{timeSinceStart}}</span>`,
  styles: [
    `span {
      font-size: 13px;
      line-height: normal;
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnChanges, OnDestroy {
  @Input() active: boolean;
  @Input() displayOnInit: boolean;
  private textUpdate: Observable<string>;
  private subscription: Subscription;
  private timeSinceStart = 'seconds ago';

  constructor(private cdr: ChangeDetectorRef) {
    this.textUpdate = new Observable(function subscribe(subscriber) {
      let minutesAgo = 0;
      let time: string;
      const pushUpdate = setInterval(() => {
        minutesAgo++;
        if (minutesAgo < 60) {
          time = minutesAgo < 2 ? `1 min` : `${minutesAgo} mins`;
        } else if (minutesAgo < 60 * 24) {
          const hoursAgo = Math.floor(minutesAgo / 60);
          time = hoursAgo < 2 ? '1 hr ago' : `${hoursAgo} hrs ago`;
        } else {
          const daysAgo = Math.floor(minutesAgo / 1440);
          time = daysAgo < 2 ? '1 day ago' : `${daysAgo} days ago`;
        }
        subscriber.next(time);
      }, 60000);

      return function unsubscribe() {
        clearInterval(pushUpdate);
      };
    });
  }

  ngOnChanges() {
    if (this.active) {
      this.subscription = this.textUpdate.subscribe(text => {
        this.timeSinceStart = text;
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
