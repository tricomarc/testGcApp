import { Component, NgZone, ViewChild } from '@angular/core';
import { LoadingController, Content, Platform } from 'ionic-angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  Marker,
  MarkerCluster
} from '@ionic-native/google-maps';
import { delay } from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { config } from '../../map-visit.config';
import { Zonal } from '../../models/zonal.class';
import { IPoint } from '../../models/point.interface';

@Component({
  selector: 'zonal-position',
  templateUrl: 'zonal-position.html'
})
export class ZonalPositionComponent {

  /**
   * Elemento ion-content de la vista
   */
  @ViewChild(Content) content;

  /**
   * Instancia del mapa
   */
  private map: GoogleMap;

  /**
   * Contiene todos los usarios retornados por la API
   */
  private zonals: Array<Zonal> = [];

  /**
   * Usuario seleccionado en el select
   */
  private selectedZonal: Zonal = null;

  /**
   * Suscripción que informa el estado de carga del mapa
   */
  private mapSubscription: any = null;

  /**
   * Ruta del ícono del marker, cambia según plataforma
   */
  private iconPath: string = null;

  /**
   * Indicadores de carga de los request
   */
  private loading = {
    getZonalPoints: false,
    getZonals: false
  };

  /**
   * Representa el modo de ver las ubicaciones
   * all para ver las ubicaciones del día
   * vacío ('') para ver la última ubicación histórica
   */
  private mode: string = '';

  /**
   * Cluster con los markers mostrados en el mapa
   */
  private markerCluster: MarkerCluster = null;

  constructor(
    private ngZone: NgZone,
    private loadingController: LoadingController,
    private platform: Platform,
    private utilProvider: UtilProvider,
    private requestProvider: RequestProvider
  ) { }

  /**
   * Ciclo de vida de Ionic
   * Se ejecuta cuando carga el componente
   */
  async ionViewDidLoad() {
    this.iconPath = this.platform.is('ios') ? 'www/assets/img/' : 'assets/img/';
    delay(() => this.loadMap(), 1000);
    this.zonals = await this.getZonals();
  }

  /**
   * Ciclo de vida de Ionic
   * Se ejecuta cuando se desmontará el componente
   * Elimina el mapa y sus suscripciones
   */
  ionViewWillUnload() {
    if (this.mapSubscription) this.mapSubscription.unsubscribe();
    if (this.markerCluster) this.markerCluster.remove();
    if (this.map) {
      this.map.setDiv(null);
      this.map.remove().then((success) => { this.map = null; }).catch((error) => { this.map = null; });
    }
  }

  /**
   * Retorna un arreglo con usuarios que han realizado al menos un checkin
   */
  async getZonals(): Promise<Zonal[]> {
    this.loading.getZonals = true;
    const zonals = await this.requestProvider.get('/visitas/usuarios', true)
      .then((result: { data: { usuarios: any[] } }) => (result.data && result.data.usuarios) ? result.data.usuarios.map(user => Zonal.parse(user)) : [])
      .catch(err => {
        this.utilProvider.showToast('No ha sido posible obtener la lista de usuarios, intente nuevamente.', 3000);
        return [];
      });
    this.loading.getZonals = false;
    return zonals;
  }

  /**
   * Retorna los puntos de un usuario
   * si opcion = 'all' devuelve todos los puntos del día
   * en cualquier otro caso devuelve el último punto del usuario
   */
  async getZonalPoints(): Promise<IPoint[]> {
    this.loading.getZonalPoints = true;
    const points: IPoint[] = await this.requestProvider.post('/visitas/ubicaciones', {
      'usuario_id': this.selectedZonal.id,
      'opcion': this.mode
    }, true)
      .then((result: { data: { visitas: any[] } }) => (result.data && result.data.visitas) ? result.data.visitas.map((point, index) => {
        return {
          latitude: point.coord.lat,
          longitude: point.coord.lng,
          type: point.accion,
          branchOffice: point.sucursal,
          date: point.fecha,
          lastUbication: (index === 0 ? true : false),
          icon: {
            url: (index === 0 ? (this.iconPath + 'mark.png') : (this.iconPath + 'ico-mapa-finalizado.png')),
            size: {
              width: 40,
              height: (index === 0 ? 75 : 40)
            }
          }
        }
      }) : [])
      .catch(err => {
        this.utilProvider.showToast('No ha sido posible obtener las ubicaciones de este usaurio, intente nuevamente.', 3000);
        return [];
      });
    this.loading.getZonalPoints = false;
    return points;
  }

  /**
   * Inicializa y carga el mapa
   */
  loadMap() {
    if (this.map) return;
    try {
      const mapOptions: GoogleMapOptions = {
        camera: {
          target: {
            lat: -33.4489172,
            lng: -70.6692123
          },
          zoom: 10,
          tilt: 0
        },
        styles: config.map_styles,
        controls: {
          zoom: false,
          myLocationButton: false,
          compass: false,
          indoorPicker: false,
          myLocation: false,
          mapToolbar: false
        }
      };

      this.map = GoogleMaps.create('map_canvas_zonal', mapOptions);

      const loading = this.loadingController.create({ content: 'Cargando mapa.' });
      loading.present();

      this.mapSubscription = this.map
        .on(GoogleMapsEvent.MAP_READY)
        .subscribe((success: any) => {
          loading.dismiss();
          this.content.resize();
          this.content.scrollToTop();
        }, (error: any) => {
          loading.dismiss();
        });
    } catch (e) { }
  }

  /**
   * Selecciona un zonal y asigna un cluster de marker con sus puntos
   */
  async selectZonal() {
    if (!this.selectedZonal) return;
    this.map.setCameraZoom(10);

    const points: IPoint[] = await this.getZonalPoints();
    this.selectedZonal.points = points;

    if (!this.selectedZonal.points.length) {
      if (this.markerCluster) {
        try {
          this.markerCluster.remove();
        } catch (e) { console.log(e); }
        this.markerCluster = null;
      }
      this.utilProvider.showToast('No encontramos ubicaciones para este usario', 3000);
      return;
    }

    if (this.markerCluster) {
      try {
        this.markerCluster.remove();
      } catch (e) { console.log(e); }
      this.markerCluster = null;
    }

    const markers = points.map((point: IPoint) => {
      return {
        position: { lat: point.latitude, lng: point.longitude },
        icon: point.icon,
        zIndex: 1,
        point: point
      };
    });

    delay(() => {
      this.markerCluster = this.map.addMarkerClusterSync({
        markers: markers,
        icons: [{
          min: 2,
          max: 1000,
          url: 'assets/img/cluster.png',
          anchor: { x: 16, y: 16 }
        }]
      });

      this.markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
        if (params.length < 1) return;
        const marker: Marker = params[1];
        const point: IPoint = marker.get('point');
        this.utilProvider.showAlert(this.selectedZonal.name, `
          ${point.lastUbication ? '<p>Última ubicación registrada.</p>' : ''}
          <ul>
            <li><b>Sucursal:</b> ${point.branchOffice}</li>
            <li><b>Acción:</b> ${point.type}</li>
            <li><b>Fecha:</b> ${point.date}</li>
            <li><b>Cargo:</b> ${this.selectedZonal.charge}</li>
          </ul>
          `);
      });
    }, 300);

    this.map.setCameraZoom(10);
    this.map.setCameraTarget({ lat: this.selectedZonal.points[0].latitude, lng: this.selectedZonal.points[0].longitude });
  }
}
