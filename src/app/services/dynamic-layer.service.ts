import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import LayerGroup from 'ol/layer/Group';
import { DynamicLayer } from '../models/dynamic-layer';
import { MapService } from './map.service';
import { SettingsService } from './settings.service';
import { Style, Stroke, Fill, Text } from 'ol/style';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class DynamicLayerService {

  private layers: DynamicLayer[] = [];
  layers$ = new BehaviorSubject<DynamicLayer[]>([]);

  // Skupina za uvožene sloje v layer switcherju
  private importedLayersGroup: LayerGroup;

  private colors = [
    '#e6194b', '#3cb44b', '#4363d8', '#f58231',
    '#911eb4', '#42d4f4', '#f032e6', '#bfef45'
  ];
  private colorIndex = 0;

  constructor(
    private http: HttpClient,
    private mapService: MapService,
    private settingsService: SettingsService,
    private languageService: LanguageService
  ) {
    // Ustvari skupino za uvožene sloje
    this.importedLayersGroup = new LayerGroup({
      properties: { title: this.languageService.instant('LAYERGROUP_IMPORTED')},
      layers: [],
      zIndex: 5
    });

    // Posodobi title ob menjavi jezika
    this.languageService.onLangChange.subscribe(() => {
      this.importedLayersGroup.set('title', this.languageService.instant('LAYERGROUP_IMPORTED'));
    });

    // Počakaj da je karta inicializirana preden dodamo skupino
    setTimeout(() => {
      this.mapService.map.addLayer(this.importedLayersGroup);
    }, 1000);
  }

  importFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'geojson' || ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const geojson = JSON.parse(e.target?.result as string);
        this.addLayerFromGeoJSON(geojson, file.name);
      };
      reader.readAsText(file);
    } else {
      const formData = new FormData();
      formData.append('file', file);
      this.http.post<any>(
        this.settingsService.API_URL + 'import_layers/convert/',
        formData
      ).subscribe({
        next: (geojson) => this.addLayerFromGeoJSON(geojson, file.name),
        error: (err) => console.error('[DynamicLayerService] Napaka pri konverziji:', err)
      });
    }
  }

  importShapefile(files: FileList): void {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('file', file);
    });
    const shpFile = Array.from(files).find(f => f.name.endsWith('.shp'));
    this.http.post<any>(
      this.settingsService.API_URL + 'import_layers/convert/',
      formData
    ).subscribe({
      next: (geojson) => {
        this.addLayerFromGeoJSON(geojson, shpFile?.name || 'shapefile.shp');
      },
      error: (err) => console.error('[DynamicLayerService] Napaka pri shp:', err)
    });
  }

  private addLayerFromGeoJSON(geojsonData: any, fileName: string): void {
    const color = this.colors[this.colorIndex % this.colors.length];
    this.colorIndex++;

    const source = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonData, {
        dataProjection: 'EPSG:3794',
        featureProjection: 'EPSG:3794'
      })
    });

    // Avtomatično iskanje label polja po prioriteti
    const findLabelField = (feature: any): string => {
      const props = feature.getProperties();
      const candidates = [
        'name', 'naziv', 'ime', 'label', 'opis',
        'description', 'title', 'naslov',
        'NAME', 'NAZIV', 'IME', 'LABEL', 'OPIS'
      ];
      for (const key of candidates) {
        if (props[key] !== undefined && props[key] !== null && String(props[key]).trim() !== '') {
          return String(props[key]);
        }
      }
      for (const key of Object.keys(props)) {
        if (key === 'geometry') continue;
        if (typeof props[key] === 'string' || typeof props[key] === 'number') {
          return String(props[key]);
        }
      }
      return '';
    };

    const olLayer = new VectorLayer({
      source: source,
      style: (feature: any, resolution: number) => {
        const labelText = resolution < 5 ? findLabelField(feature) : '';
        return new Style({
          stroke: new Stroke({ color: color, width: 2 }),
          fill: new Fill({ color: color + '22' }),
          text: labelText ? new Text({
            text: labelText,
            font: '11px Calibri, sans-serif',
            fill: new Fill({ color: '#000000' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
            overflow: true,
            placement: 'point',
            offsetY: -10
          }) : undefined
        });
      },
      properties: { title: fileName },
      zIndex: 5
    });

    // Dodaj sloj v skupino Uvoženi sloji
    this.importedLayersGroup.getLayers().push(olLayer);

    // Zoom na extent novega sloja
    setTimeout(() => {
      const extent = source.getExtent();
      if (extent && extent[0] !== Infinity) {
        this.mapService.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500
        });
      }
    }, 100);

    const dynLayer: DynamicLayer = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      title: fileName,
      visible: true,
      olLayer: olLayer
    };

    this.layers.push(dynLayer);
    this.layers$.next([...this.layers]);
    console.log('[DynamicLayerService] Dodan sloj:', fileName);
  }

  removeLayer(id: string): void {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx !== -1) {
      // Odstrani iz skupine namesto direktno z karte
      this.importedLayersGroup.getLayers().remove(this.layers[idx].olLayer);
      this.layers.splice(idx, 1);
      this.layers$.next([...this.layers]);
    }
  }

  toggleVisibility(id: string): void {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      layer.olLayer.setVisible(layer.visible);
      this.layers$.next([...this.layers]);
    }
  }

  zoomToLayer(id: string): void {
    const layer = this.layers.find(l => l.id === id);
    if (!layer) return;
    const source = layer.olLayer.getSource() as VectorSource;
    const extent = source.getExtent();
    if (extent && extent[0] !== Infinity) {
      this.mapService.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 500
      });
    }
  }
}
