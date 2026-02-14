import { TestBed } from '@angular/core/testing';

import { Voicechat } from './voicechat';

describe('Voicechat', () => {
  let service: Voicechat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Voicechat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
