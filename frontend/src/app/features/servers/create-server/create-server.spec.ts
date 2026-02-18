import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServer } from './create-server';

describe('CreateServer', () => {
  let component: CreateServer;
  let fixture: ComponentFixture<CreateServer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
