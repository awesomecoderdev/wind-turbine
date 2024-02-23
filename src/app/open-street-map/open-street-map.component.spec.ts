import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenStreetMapComponent } from './open-street-map.component';

describe('OpenStreetMapComponent', () => {
  let component: OpenStreetMapComponent;
  let fixture: ComponentFixture<OpenStreetMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenStreetMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpenStreetMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
