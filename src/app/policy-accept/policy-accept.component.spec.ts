import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyAcceptComponent } from './policy-accept.component';

describe('PolicyAcceptComponent', () => {
  let component: PolicyAcceptComponent;
  let fixture: ComponentFixture<PolicyAcceptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolicyAcceptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolicyAcceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
