import { Injectable } from '@angular/core';
import { DeepstreamClientManager } from './deepstream-client-manager.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private dsClient: any;
  constructor(dsClientManager: DeepstreamClientManager) {
    dsClientManager.getInstance().then(client => {
      if (client) {
        this.dsClient = client;
      }
    });
  }
}
