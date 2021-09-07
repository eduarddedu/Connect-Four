import { TestBed } from '@angular/core/testing';

import { Game } from './_game';

describe('GameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Game = TestBed.get(Game);
    expect(service).toBeTruthy();
  });
});
