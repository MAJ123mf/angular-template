// ---------------------------------------------------------------------
// To je profesorjev servis, za delo z karto na zaslonu. V njej podamo katere sloje imamo,
// od kod se polnijo WMS sloji, na katere sloje rišemo kakšno geometrijo,....
// ---------------------------------------------------------------------


import { Injectable } from '@angular/core';

//OpenLayers
import Map from 'ol/Map';
import View from 'ol/View';
import Layer from 'ol/layer/Layer'; // Tipo base para cualquier capa
import BaseLayer from 'ol/layer/Base'; // Puedes importarlo si lo necesi
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { Projection } from 'ol/proj';
import LayerGroup from 'ol/layer/Group';
import MousePosition from 'ol/control/MousePosition.js';
import { createStringXY } from 'ol/coordinate.js';
import Interaction from 'ol/interaction/Interaction'; // Uvozimo razred interakcija
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'; // uvoz razreda za Zoom z kolesom miške
import DragPan from 'ol/interaction/DragPan';             // Uvoz DragPan

import { EventService } from '../services/event.service';
import { EventModel } from '../models/event.model';

//vector layers
// import { sourcesFromTileGrid } from 'ol/source';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

//layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { SettingsService } from './settings.service';

import WKT from 'ol/format/WKT';
import { Feature } from 'ol';
import Geometry from 'ol/geom/Geometry'; // rabim za pretvorbo iz geometrije v WKT

import GeoJSON from 'ol/format/GeoJSON';

// knjižnice za izbiranje gradnikov:
import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';

import Modify from 'ol/interaction/Modify';  // za editiranje geometrij

@Injectable({
  providedIn: 'root'
})
export class MapService {
  //Map can be a Map or undefined
  map: Map;
  baseLayersGroup:LayerGroup;
  myLayersGroup:LayerGroup;
  parcelsLayer!: VectorLayer<VectorSource>;
  roadsLayer!: VectorLayer;
  addressesLayer!: VectorLayer;
  private selectInteraction!: Select;
  private modifyInteraction?: Modify;

  constructor(
    public settingsService: SettingsService, 
    private eventService: EventService) { 
      // Najprej ustvarimo sloje
      this.baseLayersGroup= this.createBaseLayers();
      this.myLayersGroup= this.createMyLayers();

      this.eventService.eventActivated$.subscribe(event => {
        if (event.type === 'modeChange') {
          this.handleModeChange(event.data); // 'select-parcel', 'edit-parcel', 'parcel' itd.
        } else if (event.type === 'requestParcelWkt') {
          this.sendParcelWkt();
          console.log('[Map service] Event Handler: Sproži zahtevo za WKT', event.type);
        }
        // lahko dodajaš še druge event tipe, če bo treba
      });

      this.map= this.createMap();//Create the map and store it in the mapService
      // this.addLayerSwitcherControl();  // to sem prestavil v map.component v ngAfterViewInit()
      this.addMousePositionControl();
  }

  // poslušamo spremembe v event-service, da to deluje moramo importirat event service, dopolnit konstruktor za map in mu povedat,
  // da je ta funkcija odgovorna za spremembe. glej vrstico 67 (malo višje) Tisto zgoraj kliče to funkcijo
  private handleModeChange(mode: string): void {
    // odstrani stare interakcije 
    this.clearInteractions();    // funkcija je takoj za to. 10 vrstic nižje
    // in aktiviraj nove
    if (mode === 'select-parcel') {
      this.activateSelectParcel();
    } else if (mode === 'select-road') {
      this.activateSelectRoad(); // če selektiramo ceste, potem bomo uredili to v funkciji activateSelectRoad pojdi dol v vrstico 446
    } else if (mode === 'select-address') {
      this.activateSelectAddress(); // če selektiramo naslove, potem bomo uredili to v funkciji activateSelectAddress pojdi dol v vrstico 478 
    } else if (mode === 'edit-parcel') {
      this.activateEditParcel(); // za editiranje parcel
      console.log('[Map service]: Smo v urejanju parcel!', mode);
    } 
  }

  private clearInteractions(): void {
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
      this.selectInteraction = undefined!;
    }
  }

  createBaseLayers(): LayerGroup {
    var pnoa = new TileLayer({
      properties: {
            title: 'Cadastre WMS',
            // type: 'base'
          },
      source: new TileWMS(({
        url: "https://www.ign.es/wms-inspire/pnoa-ma?",
        params: {"LAYERS": "OI.OrthoimageCoverage", 'VERSION': "1.3.0", "TILED": "true", "TYPE": 'base', "FORMAT": "image/png"},
      }))
    });

    var catastro= new TileLayer({
          properties: {
            title: 'Cadastre WMS',
          },
          source: new TileWMS({
          url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
             // crossOrigin: '*', (V slojih crossOrigin ni nastavljen)
          params: {
            'LAYERS': 'Catastro', 'VERSION': '1.1.1', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });


    const baseLayersGroup = new LayerGroup({
        properties: {
          title: 'Base Layers',
        },
        layers: [pnoa, catastro]
      });
    return baseLayersGroup;
  }

  createMyLayers(): LayerGroup {
    var parcels= new TileLayer({
        properties: {
          title: 'Parcels WMS'
        },
        source: new TileWMS({
          url: this.settingsService.GEOSERVER_URL + 'wms?',
          params: {
            'LAYERS': 'parcels_parcels', 'VERSION': '1.3.0', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });
    
    var roads= new TileLayer({
        // visible: true,
        properties: {
          title: 'Roads WMS'
        },
        source: new TileWMS({
          url: this.settingsService.GEOSERVER_URL + 'wms?',
          params: {
            'LAYERS': 'roads_roads', 'VERSION': '1.3.0', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });  

    var addresses= new TileLayer({
        properties: {
          title: 'Addresses WMS'
        },
        source: new TileWMS({
          url: this.settingsService.GEOSERVER_URL + 'wms?',
          params: {
            'LAYERS': 'addresses_addresses', 'VERSION': '1.3.0', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });       

    var parcelsVectorSource = new VectorSource({wrapX: false}); 
    var parcelsVectorLayer = new VectorLayer({
      source: parcelsVectorSource,
      properties: {
        title: 'Parcels vector' // <--- Define el título aquí
        // Po potrebi lahko tukaj dodate še druge lastnosti po meri.
        // Na primer: isBaseLayer: false, opis: 'Gradnja plasti'
      }   
    })
    
    this.parcelsLayer = parcelsVectorLayer;

    var roadsVectorSource = new VectorSource({wrapX: false}); 
    var roadsVectorLayer = new VectorLayer({
      source: roadsVectorSource,
      properties: {
        title: 'Roads vector' 
        // Po potrebi lahko tukaj dodate še druge lastnosti po meri.
        // Na primer: isBaseLayer: false, opis: 'Gradnja plasti'
      }   
    })

    this.roadsLayer = roadsVectorLayer;                               
    
    var addressVectorSource = new VectorSource({wrapX: false}); 
    var addressVectorLayer = new VectorLayer({
      source: addressVectorSource,
      properties: {
        title: 'Address vector' 
        // Po potrebi lahko tukaj dodate še druge lastnosti po meri.
        // Na primer: isBaseLayer: false, opis: 'Gradnja plasti'
      }   
    });//The layer were we will draw

    this.addressesLayer = addressVectorLayer;                         

    var myLayersGroup = new LayerGroup({
        properties: {
          title: 'My layers'
        },
        layers: [
          parcels, 
          parcelsVectorLayer,
          roads, 
          roadsVectorLayer,
          addresses,
          addressVectorLayer
        ]
      });
    return myLayersGroup;
  }


  createMap(): Map { 
    let epsg25830:Projection;
    epsg25830=new Projection({
      code:'EPSG:25830',
      extent: [-729785.76,3715125.82,945351.10,9522561.39],
      units: 'm'
    });
    var map: Map = new Map({
      controls: [],
      view: new View({
        center: [729035,4373419],
        zoom: 14,
        projection: epsg25830,
      }),
      layers: [this.baseLayersGroup, this.myLayersGroup],
      target: undefined
    }); 
    return map;
  }

  addLayerSwitcherControl() {
    const layerSwitcher = new LayerSwitcher(
      {
        activationMode: 'mouseover',
        startActive: false,
        tipLabel: 'Show-hide layers',
        groupSelectStyle: 'group',
        reverse: false
      }
    );
    this.map.addControl(layerSwitcher); //! --> tells typescript that map is not undefined
  }

  addMousePositionControl(){
      //Adds the mouse coordinate position to the map
      const mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(0),
        projection: 'EPSG:25830',
        // comment the following two lines to have the mouse position
        // be placed within the map.
        //className: 'custom-mouse-position',
        //target: document.getElementById('map_mouse_position_control'),
        //undefinedHTML: '----------------------'
      });
      this.map.addControl(mousePositionControl);//! --> tells typescript that map is not undefined
  }

  /**
   * Poiščite plast na zemljevidu (ali znotraj skupin plasti) po njeni lastnosti »title«.
   *
   * @param title Naslov sloja, ki ga želite iskati.
   * @param layers Zbirka plasti za pridobivanje (običajno map.getLayers() ali group.getLayers()).
   * @returns Objekt plasti, če je najden, ali ni definiran.
   */
  getLayerByTitle(title: string, layers?: BaseLayer[]): Layer<any> | undefined {
    // Če zbirka slojev ni podana, začnemo od korena zemljevida
    const currentLayers = layers || this.map.getLayers().getArray();

    for (const baseLayer of currentLayers) {
      // 1. Preverite, ali gre za plast in ali ima naslov
      if (this.isLayer(baseLayer)) {
        const layerProperties = baseLayer.getProperties();
        if (layerProperties && layerProperties['title'] === title) {
          //console.log(`Sloj '${title}' je najden!`, baseLayer);
          return baseLayer;
        }
      }
      // 2. Comprobar si es un LayerGroup y buscar recursivamente dentro de él
      else if (this.isLayerGroup(baseLayer)) {
        //console.log(`Vnos skupine slojev: ${baseLayer.getProperties()['title'] || 'Unnamed Group'}`);
        const foundLayerInGroup = this.getLayerByTitle(title, baseLayer.getLayers().getArray());
        if (foundLayerInGroup) {
          return foundLayerInGroup; // V tej skupini najdena plast
        }
      }
    }
    //console.log(`Sloj '${title}' ni bil najden v trenutni hierarhiji.`);
    return undefined; // Na tej ravni ali njenih podskupinah ni bilo mogoče najti nobene plasti s tem naslovom.
  }

  /**
 * Funkcija Type guard za ugotavljanje, ali je BaseLayer sloj (in ne skupina slojev).
 * @param layer Objekt BaseLayer, ki ga je treba preveriti.
 * @returns Vrednost »true«, če je objekt primerek razreda ol/layer/Layer, sicer vrednost »false«.
 */
  private isLayer(layer: BaseLayer): layer is Layer<any> {
    // Robusten način je preveriti, ali ima metodo getSource.
    // Skupina plasti nima funkcije getSource.
    return (layer as Layer<any>).getSource !== undefined;

    // Drug način, če je ol/layer/Layer konkreten razred in ne abstrakten v vaši različici:
    // vrni plast primerek plasti; // To lahko povzroči težave, če je sloj abstrakten ali če uvoz ni neposreden.
    // Preverjanje `getSource` je v tem primeru zanesljivejše.
  } 

  // Pomočnik za preverjanje, ali je BaseLayer skupina slojev (in ima .getLayers())
  private isLayerGroup(layer: BaseLayer): layer is LayerGroup {
    return (layer as LayerGroup).getLayers !== undefined;
  }

  disableMapInteractions(): void {
    if (this.map) {
      this.map.getInteractions().forEach((interaction: Interaction) => {
        console.log('[map.service] Interaction:', interaction);
        // Preveri, ali interakcija NI primerek MouseWheelZoom ali DragPan
        if (!(interaction instanceof MouseWheelZoom) && !(interaction instanceof DragPan)) {
          interaction.setActive(false);
        }
      });
    }
  }


  // ta funkcija nariše enoparcelo, ko kliknemo na ID v tabeli parcel
  public addParcelsGeoJsonToLayer(geojsonStr: string) {
    console.log('[addParcelsGeoJsonToLayer] Prejeto GeoJSON:', geojsonStr);
    const format = new GeoJSON();
    const features = format.readFeatures(geojsonStr, {
      featureProjection: 'EPSG:25830'
    });
    console.log(`[addParcelsGeoJsonToLayer] Parsed features count: ${features.length}`);
    features.forEach((f, i) => console.log(`Feature ${i}:`, f));
    const source = this.parcelsLayer?.getSource();
    if (source) {
      source.clear();
      source.addFeatures(features);
    } else {
      console.warn('parcelsLayer ali njegov source ne obstaja!');
    }
  }

  // ta funkcija nariše vse ceste ki so prikazane v tabeli na Karto
  public addRoadsGeoJsonToLayer(roads: any[]) {
    const validGeoJSONs = roads
      .map(road => {
        try {
          return JSON.parse(road.geom_geojson);
        } catch (e) {
          console.warn('Neveljaven GeoJSON za cestni ID:', road.id);
          return null;
        }
      })
      .filter(g => g !== null);

    if (validGeoJSONs.length === 0) return;

    const featureCollection = {
      type: 'FeatureCollection',
      features: validGeoJSONs
    };

    const format = new GeoJSON();
    const features = format.readFeatures(featureCollection, {
      featureProjection: 'EPSG:25830'
    });

    const source = this.roadsLayer?.getSource();
    if (source) {
      source.clear();
      source.addFeatures(features);
    } else {
      console.warn('roadsLayer ali njegov source ne obstaja!');
    }
  }

    // funkcija izriše vse točke ki so prikazane v tabeli na Karto.
    // namenjena je tabeli naslovov
    public addAddressesGeoJsonToLayer(address: any[]) {
    const validGeoJSONs = address
      .map(address => {
        try {
          return JSON.parse(address.geom_geojson);
        } catch (e) {
          console.warn('Neveljaven GeoJSON za address ID:', address.id);
          return null;
        }
      })
      .filter(g => g !== null);

    if (validGeoJSONs.length === 0) return;

    const featureCollection = {
      type: 'FeatureCollection',
      features: validGeoJSONs
    };

    const format = new GeoJSON();
    const features = format.readFeatures(featureCollection, {
      featureProjection: 'EPSG:25830'
    });

    const source = this.addressesLayer?.getSource();
    if (source) {
      source.clear();
      source.addFeatures(features);
    } else {
      console.warn('addressLayer ali njegov source ne obstaja!');
    }
  }

  // SELECT parcel
  private activateSelectParcel(): void {
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
    }

    this.selectInteraction = new Select({
      condition: click,
      layers: [this.parcelsLayer]
    });

    this.selectInteraction.on('select', (e) => {
      const feature = e.selected[0];
      if (feature) {
        const wktFormat = new WKT();
        const geometry = feature.getGeometry() as Geometry;
        const wkt = wktFormat.writeGeometry(geometry);

        // Sporoči naprej ( z EventService), da je parcela izbrana. Treba jo bo prenest v vnosno formo.
        // Tisti, ki mu je namenjeno to sporočilo že ve, in čaka nanj. To je seveda parcel-form.component.
        this.eventService.emitEvent(new EventModel('parcel-selected', wkt));
        console.log('[Map-service] activateSelectParcel: ',wkt)
      }
    });

    this.map.addInteraction(this.selectInteraction);
  }

  // SELECT road
  private activateSelectRoad(): void {
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
    }

    this.selectInteraction = new Select({
      condition: click,
      layers: [this.roadsLayer]
    });

    this.selectInteraction.on('select', (e) => {
      const feature = e.selected[0];
      if (feature) {
        const wktFormat = new WKT();
        const geometry = feature.getGeometry() as Geometry;
        const wkt = wktFormat.writeGeometry(geometry);

        // Sporoči naprej ( z EventService), da je cesta izbrana. Torej jo bo treba prenest v vnosno formo
        this.eventService.emitEvent(new EventModel('road-selected', wkt));
        console.log('[Map-service] activateSelectRoad: ',wkt)    // samo izpis na konzolo za kontrolo
      }
    });

    this.map.addInteraction(this.selectInteraction);
  }  

  // SELECT naslov oz. address
  private activateSelectAddress(): void {
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
    }

    this.selectInteraction = new Select({
      condition: click,
      layers: [this.addressesLayer]
    });

    this.selectInteraction.on('select', (e) => {
      const feature = e.selected[0];
      if (feature) {
        const wktFormat = new WKT();
        const geometry = feature.getGeometry() as Geometry;
        const wkt = wktFormat.writeGeometry(geometry);

        // Sporoči naprej ( z EventService), da je naslov izbran. Torej ga je treba prenest v vnosno formo...
        this.eventService.emitEvent(new EventModel('address-selected', wkt));  // tu sporočamo (emitiramo) naprej
        console.log('[Map-service] activateSelectAddress: ',wkt)    // samo izpis na konzolo za kontrolo ob razvoju, se lahko briše...
      }
    });

    this.map.addInteraction(this.selectInteraction);
  }  

  private activateEditParcel(): void {
    const vectorSource: VectorSource = this.parcelsLayer.getSource() as VectorSource;

    this.modifyInteraction = new Modify({ source: vectorSource });

    this.modifyInteraction.on('modifyend', (e) => {
      console.log('Parcela spremenjena:', e.features.getArray());
    });

    this.map.addInteraction(this.modifyInteraction);
  }


  private sendParcelWkt(): void {
    const vectorSource = this.parcelsLayer.getSource() as VectorSource;
    const features = vectorSource.getFeatures();

    if (features.length > 0) {
      const wktFormat = new WKT();
      const wkt = wktFormat.writeFeature(features[0]);
      console.log('[Map service] sendParcelWKT: Sending parcel WKT:', wkt);
      this.eventService.emitEvent(new EventModel('parcelEdited', wkt));
    }
  }

}