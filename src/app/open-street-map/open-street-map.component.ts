import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  Renderer2,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Icon, Style } from 'ol/style';
import Overlay from 'ol/Overlay';
import { toStringHDMS } from 'ol/coordinate';
import Select from 'ol/interaction/Select';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import * as WindTurbineJsonData from '../../assets/data.json';
import { Subject } from 'rxjs';
import { StyleLike } from 'ol/style/Style';

interface WindTurbine {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  height_meters: number;
  capacity_kw: number;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface Payload {
  city: string;
  country: string;
  location: Location;
  wind_turbines: WindTurbine[];
}

@Component({
  selector: 'app-open-street-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './open-street-map.component.html',
  styleUrl: './open-street-map.component.css',
})
export class OpenStreetMapComponent implements OnInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef; // Add '!' here
  @Input() latitude!: number; // Add '!' here
  @Input() longitude!: number; // Add '!' here
  map!: Map; // Add '!' here
  payload: Payload = {
    city: 'Example City',
    country: 'Example Country',
    location: {
      // latitude: this.latitude ?? 40.7128,
      // longitude: this.longitude ?? -74.006,
      latitude: 40.7128,
      longitude: -74.006,
    },
    wind_turbines: [
      {
        name: 'Wind Turbine 1',
        location: {
          latitude: 40.714,
          longitude: -74.009,
        },
        height_meters: 100,
        capacity_kw: 2000,
      },
      {
        name: 'Wind Turbine 2',
        location: {
          latitude: 40.716,
          longitude: -74.011,
        },
        height_meters: 80,
        capacity_kw: 1500,
      },
      {
        name: 'Wind Turbine 3',
        location: {
          latitude: 40.718,
          longitude: -74.013,
        },
        height_meters: 120,
        capacity_kw: 2500,
      },
    ],
  };
  turbine!: WindTurbine;
  popup: boolean = false;
  toggle: boolean = true;

  toggleButton() {
    if (this.toggle) {
      this.removeMarker();
    } else {
      this.addMarker();
    }

    this.toggle = !this.toggle;
  }

  constructor(@Inject(PLATFORM_ID) private path: Object) {}

  ngOnInit(): void {
    this.payload = WindTurbineJsonData;
    if (isPlatformBrowser(this.path)) {
      this.initMap();
    }
  }

  private initMap(): void {
    let self = this;
    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        // center: [0, 0],
        center: fromLonLat([
          this.payload.location.longitude,
          this.payload.location.latitude,
        ]),
        zoom: 14,
      }),
    });

    this.map.on('pointermove', function (e) {
      self.map.getTargetElement().style.cursor = self.map.hasFeatureAtPixel(
        e.pixel
      )
        ? 'pointer'
        : '';
    });

    this.addMarker();
  }

  private addMarker(): void {
    // Add markers for wind turbines
    this.payload.wind_turbines.forEach((turbine, i) => {
      const marker = new Feature({
        geometry: new Point(
          fromLonLat([turbine.location.longitude, turbine.location.latitude])
        ),
      });

      const iconStyle = new Style({
        image: new Icon({
          anchor: [0.5, 1],
          // size: [250, 250],
          // scale: 0.065, // Scale down the icon to 50% of its original size
          src: 'https://openlayers.org/en/latest/examples/data/icon.png', // URL to marker icon
          // src: 'https://cdn-icons-png.flaticon.com/512/7945/7945007.png',
          // src: 'https://cdn-icons-png.flaticon.com/512/9367/9367346.png',
          // src: 'https://cdn-icons-png.flaticon.com/512/4343/4343449.png',
          // src: 'https://cdn-icons-png.flaticon.com/512/1085/1085678.png',
        }),
      });

      marker.setStyle(iconStyle);
      marker.setId(i);
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [marker],
        }),
      });

      this.map.addLayer(vectorLayer);

      // Create card overlay
      const cardElement = document.createElement('div');
      cardElement.className = 'marker-card bg-white rounded p-4';
      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';
      cardElement.appendChild(cardContent);

      const popup = new Overlay({
        element: cardElement,
        offset: [0, -20],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });

      // Add overlay to the map
      this.map.addOverlay(popup);

      // Add click event listener to each marker
      this.map.on('pointermove', (evt) => {
        const marker = this.map.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => feature
        );
        if (!marker) {
          this.popup = false;
          popup.setPosition(undefined); // Hide the popup
          return;
        }

        let turbines = this.payload.wind_turbines as WindTurbine[];
        let turbine = turbines.find(
          (trb, ind) => ind === marker.getId()
        ) as WindTurbine;

        this.turbine = turbine;
        this.popup = true;

        // Update card content
        cardContent.innerHTML = `
          <h3>${this.turbine.name}</h3>
          <p>Height: ${this.turbine.height_meters} meters</p>
          <p>Capacity: ${this.turbine.capacity_kw} kW</p>
        `;

        // Update popup position
        const coordinate = evt.coordinate;
        popup.setPosition(coordinate);
      });

      // Add click event listener to the map to handle clicks outside of the popup
      this.map.on('click', (evt) => {
        const marker = this.map.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => feature
        );

        if (!marker) {
          this.popup = false;
          popup.setPosition(undefined); // Hide the popup
          return;
        }
      });
    });
  }

  private removeMarker(): void {
    // Iterate through the layers of the map
    this.map.getLayers().forEach((layer) => {
      // Check if the layer is a VectorLayer and contains features
      if (
        layer instanceof VectorLayer &&
        layer.getSource().getFeatures().length > 0
      ) {
        layer.getSource().clear();
      }
    });
  }
}
