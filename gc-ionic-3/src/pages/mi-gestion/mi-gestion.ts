import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { RequestProvider } from '../../shared/providers/request/request';
import { config } from './mi-gestion.config';
import { LoadingController } from 'ionic-angular';
import { UtilProvider } from '../../shared/providers/util/util';
import { global } from "../../shared/config/global";
import { NavigateService } from '../notifications/navigate.service';
import { globalConfig } from '../../config';

@IonicPage()
@Component({
  selector: 'page-mi-gestion',
  templateUrl: 'mi-gestion.html',
})
export class MiGestionPage {

  current_time: Date = new Date();
  segments    : string = '';
  misGestiones: Array<any> = [];
  importantes : Array<any> = [];
  favoritos   : Array<any> = [];
  private chartColor  : string     = '';
  private _data = {
    gestiones: null,
    importantes: null,
    favoritos: null
  }

  private clientCode: string = global.pro.appId;
  
  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    private request : RequestProvider,
    private util    : UtilProvider,
    private navigate: NavigateService,
    private loading : LoadingController) {

  }

  ionViewDidLoad() {
    this.segments = ((this.clientCode === '1c469c16' || this.clientCode === '7ba63049') ? 'miGestion' : 'favoritos'); 
  }

  ionViewDidEnter(){
    this.getData();
    this.chartColor = global.client_colors.primary;
  }

  /**
   * Obtiene las promesas y trabaja la información obtenida
   */
  getData(){
    this._data = {gestiones: null, favoritos: null, importantes: null}
    const loading = this.loading.create({content: 'Obteniendo mis gestiones'});
    loading.present();

    Promise.all([this.obtenerMisGestiones(), this.obtenerFavoritos()]
      .map(p => p.catch(e => e)))
      .then((resolve) => {
        loading.dismiss();
        this.getCurrentTime();

        var error = resolve.filter((item) => { return item.Error });
        if(error.length > 0){
          this.util.showAlert('Alerta', error[0]['Error']);
        }

        this.misGestiones= resolve[0]['data'] &&  resolve[0]['data']['gestiones']   || [];
        this.importantes = resolve[0]['data'] &&  resolve[0]['data']['importantes'] || [];
        this.favoritos   = resolve[1]['data'] &&  resolve[1]['data']['favoritos']   || [];

        if(!this.misGestiones || !this.misGestiones.length || this.misGestiones == []){
          this._data.gestiones   = 'noData';
        }
        if(!this.importantes  || !this.importantes.length  || this.importantes  == []){
          this._data.importantes = 'noData';
        }
        if(!this.favoritos    || !this.favoritos.length    || this.favoritos    == []){
          this._data.favoritos   = 'noData';
        }

      })
      .catch((error) => {
        try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
        loading.dismiss();
        this.util.showAlert('Alerta', error.message);
      });
  }

  /**
   * Retorna una promesa con Gestiones obtenidas
   */
  obtenerMisGestiones(): Promise<any>{
    return new Promise((resolve, reject) => {
        this.request
          .get(config.endpoints.get.miGestion, true)
          .then((gestiones) => resolve(gestiones))
          .catch((error)    => reject({Error: error.message}))
    })
  }

  /**
   * Retorna una promesa con Favoritos Obtenidos
   */
  obtenerFavoritos(): Promise<any>{
    return new Promise((resolve, reject) => {
      this.request
        .get(config.endpoints.get.misFavoritos, true)
        .then((favoritos) => resolve(favoritos))
        .catch((error) => reject({Error: error.message}))
    })
  }

  /**
   * Setea la hora actual de actualización
   */
  getCurrentTime(){
    this.current_time = new Date();
  }

  /**
   * Maneja el segmento seleccionado
   */
  onSegmentChanged(event) {
    this.segments = event.value;
  }

  /**
   * Cambia el valor de favorito en un item favoritos
   */
  async desfavoritar(item){
    console.log(item);
    const prefix = item.Modulo.url_prefix;
    let alert = this.util.showConfirmAlert('Favoritos','¿Está seguro que desea quitar de favoritos?');
    alert.present();
    alert.onDidDismiss((confirm) => {
      if(confirm){
        const params  = {prefix, id: item.registro_id, favorito: false}
        const loading = this.loading.create({});
        loading.present();
        this.util.setFavorite(params)
          .then((response)=> {loading.dismiss();  this.getData(); })
          .catch((e) => {loading.dismiss(); console.log(e); this.util.showAlert('Alerta', 'Ocurrió un error')});
      }
    });
  }

  /**
   * Redirecciona al detalle de la pagina seleccionada
   */
  openPage(item, isFav?){
    var id = null;
    if(isFav) {
      item['url_prefix'] = item.Modulo.url_prefix 
      id = item.registro_id

    }else{
      if(item['url_prefix'] == 'visual')
        id = item['_matchingData']['Reportes']['id']
      else if (item['url_prefix'] == 'com')
        id = item['evaluaciones'][0]['comunicado_id']
      else 
        id = item['id']
    }
    // isFav ? item['url_prefix'] = item.Modulo.url_prefix : null
    
    this.navigate.redirect(item.url_prefix, id);

  }

  refresh(event){
    event.complete()
    this.getData();
  }


}
