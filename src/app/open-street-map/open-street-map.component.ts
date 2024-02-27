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

  constructor(@Inject(PLATFORM_ID) private path: Object) {}

  ngOnInit(): void {
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

    // Create card overlay for each marker
    const cardElement = document.createElement('div');
    cardElement.id = 'popup';

    const popup = new Overlay({
      element: cardElement,
      offset: [0, -20], // Offset to adjust card position relative to marker
      positioning: 'bottom-center',
      className: `turbine-item`,
      stopEvent: false,
      insertFirst: false,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });

    self.map.addOverlay(popup);

    this.map.on('pointermove', function (e) {
      self.map.getTargetElement().style.cursor = self.map.hasFeatureAtPixel(
        e.pixel
      )
        ? 'pointer'
        : '';
    });

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
          scale: 0.065, // Scale down the icon to 50% of its original size
          // src: 'https://openlayers.org/en/latest/examples/data/icon.png', // URL to marker icon
          // src: 'https://cdn-icons-png.flaticon.com/512/7945/7945007.png',
          // src: 'https://cdn-icons-png.flaticon.com/512/9367/9367346.png',
          // src: 'https://cdn-icons-png.flaticon.com/512/4343/4343449.png',
          src: 'https://cdn-icons-png.flaticon.com/512/1085/1085678.png',
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
      // Add click event listener to each marker

      // // Create card overlay for each marker
      // const cardElement = this.renderer.createElement('div');
      // cardElement.className = 'marker-card bg-white rounded p-4';
      // cardElement.innerHTML = `
      //   <div class="card-content">
      //     <h3>${turbine.name}</h3>
      //     <p>Height: ${turbine.height_meters} meters</p>
      //     <p>Capacity: ${turbine.capacity_kw} kW</p>
      //   </div>
      // `;

      // const popup = new Overlay({
      //   element: cardElement,
      //   offset: [0, -20], // Offset to adjust card position relative to marker
      //   positioning: 'bottom-center',
      //   // position: fromLonLat([
      //   //   turbine.location.longitude,
      //   //   turbine.location.latitude,
      //   // ]),
      //   // className: `hidden turbine-${i}`,
      //   stopEvent: false,
      //   // insertFirst: false,
      //   // autoPan: {
      //   //   animation: {
      //   //     duration: 250,
      //   //   },
      //   // },
      // });

      // this.map.addOverlay(popup);
    });

    // display popup on click
    this.map.on('pointermove', function (evt) {
      const marker = self.map.forEachFeatureAtPixel(
        evt.pixel,
        function (marker) {
          return marker;
        }
      );
      if (!marker) {
        self.popup = false;
        return;
      }

      let turbines = self.payload.wind_turbines as WindTurbine[];
      let turbine: WindTurbine = turbines.filter(
        (trb: WindTurbine, ind) => ind == marker.getId()
      )[0];

      self.turbine = turbine;
      self.popup = true;

      console.log('turbine', self.turbine);
    });
  }
}
