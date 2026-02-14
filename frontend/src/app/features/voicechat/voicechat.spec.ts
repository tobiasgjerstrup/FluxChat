import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Voicechat } from './voicechat';

describe('Voicechat', () => {
  let component: Voicechat;
  let fixture: ComponentFixture<Voicechat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Voicechat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Voicechat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
