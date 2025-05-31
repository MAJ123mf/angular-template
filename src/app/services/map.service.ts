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
import {createStringXY} from 'ol/coordinate.js';
import Interaction from 'ol/interaction/Interaction'; // Uvozimo razred interakcija
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'; // uvoz razreda za Zoom z kolesom miške
import DragPan from 'ol/interaction/DragPan';             // Uvoz DragPan

//vector layers
import { Vector as VectorLayer} from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
//layerswitcher
import LayerSwitcher from 'ol-layerswitcher';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  //Map can be a Map or undefined
  map: Map;
  baseLayersGroup:LayerGroup;
  myLayersGroup:LayerGroup;

  constructor(public settingsService: SettingsService) { 
      this.baseLayersGroup= this.createBaseLayers();
      this.myLayersGroup= this.createMyLayers();
      this.map= this.createMap();//Create the map and store it in the mapService
      this.addLayerSwitcherControl();
      this.addMousePositionControl();
  }

  createBaseLayers(): LayerGroup {
    var pnoa = new TileLayer({
      properties: {
            title: 'Cadastre WMS'
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
    var buildings= new TileLayer({
        properties: {
          title: 'Buildings WMS'
        },
        source: new TileWMS({
          url: this.settingsService.GEOSERVER_URL + 'wms?',
          params: {
            'LAYERS': 'buildings_buildings', 'VERSION': '1.3.0', 'TILED': true, 'TRANSPARENT': true, 'FORMAT': 'image/png'
          }
        })
      });
    var buildingsVectorSource = new VectorSource({wrapX: false}); 
    var buildingsVectorLayer = new VectorLayer({
      source: buildingsVectorSource,
      properties: {
        title: 'Buildings vector' // <--- Define el título aquí
        // Po potrebi lahko tukaj dodate še druge lastnosti po meri.
        // Na primer: isBaseLayer: false, opis: 'Gradnja plasti'
      }   
    });//The layer were we will draw

    var myLayersGroup = new LayerGroup({
        properties: {
          title: 'My layers'
        },
        layers: [buildings, buildingsVectorLayer]
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
        startActive: true,
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
        // Preveri, ali interakcija NI primerek MouseWheelZoom ali DragPan
        if (!(interaction instanceof MouseWheelZoom) && !(interaction instanceof DragPan)) {
          interaction.setActive(false);
        }
      });
    }
  }
}