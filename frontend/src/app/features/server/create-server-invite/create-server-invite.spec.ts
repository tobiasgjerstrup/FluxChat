import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServerInvite } from './create-server-invite';

describe('CreateServerInvite', () => {
  let component: CreateServerInvite;
  let fixture: ComponentFixture<CreateServerInvite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServerInvite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServerInvite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
