import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UseInvite } from './use-invite';

describe('UseInvite', () => {
  let component: UseInvite;
  let fixture: ComponentFixture<UseInvite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UseInvite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UseInvite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
