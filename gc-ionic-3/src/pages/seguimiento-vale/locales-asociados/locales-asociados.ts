import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { UtilProvider } from '../../../shared/providers/util/util';
import { RequestProvider } from '../../../shared/providers/request/request';
import { config } from '../vale.config';
import { IPeriodo, ILocalesArray, PeriodoModel, LocalesModel } from './locales.model';
import * as _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-locales-asociados',
  templateUrl: 'locales-asociados.html',
})
export class LocalesAsociadosPage {

  detallePeriodo  : IPeriodo = new PeriodoModel();
  localesAsociados: ILocalesArray = new LocalesModel();
  idPeriodo: number;
  constructor(
    public navCtrl     : NavController, 
    private util       : UtilProvider,
    private loadingCrtl: LoadingController,
    private request    : RequestProvider,
    public navParams   : NavParams) { }


  ionViewDidEnter() {
    this.idPeriodo = this.navParams.get('id');
    if   (this.idPeriodo) this.getLocalesAsociados(this.idPeriodo);
    else this.util.showAlert('Atención', 'Falta información'); 
    
  }
  

  getLocalesAsociados(id: number){
    var loading = this.loadingCrtl.create({content: 'Obteniendo locales asociados'});
    loading.present();
    this.request.get(`${config.endpoints.get.seguimiento}/${id}`, true)
      .then((response) => {loading.dismiss(); this.processData(response['data'])})
      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }

  processData(data){
    this.detallePeriodo   = new PeriodoModel(data['periodo']);
    console.log(this.detallePeriodo);
    this.localesAsociados = new LocalesModel(data['tiendas']);
    console.log(this.localesAsociados);
  }

  detalleSeguimiento(idTienda: number){
    this.navCtrl.push('DetalleSeguimientoPage', {idPeriodo: this.idPeriodo, idTienda: idTienda});
  }

  async refresh(refresher: any) {
    this.getLocalesAsociados(this.idPeriodo);
    if (!_.isNull(refresher)) {
      refresher.complete();
    }  
  }

}
