import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { UtilProvider } from '../../shared/providers/util/util';
import { RequestProvider } from '../../shared/providers/request/request';
import { config } from './vale.config';
import { IValeArray, ValeModel } from './seguimiento.model'
import * as _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-seguimiento-vale',
  templateUrl: 'seguimiento-vale.html',
})
export class SeguimientoValePage {

  seguimientoVale: IValeArray = new ValeModel();
  constructor(public navCtrl: NavController,
     public navParams: NavParams,
     private request : RequestProvider,
     private util    : UtilProvider,
     private loading : LoadingController) {
  }

  ionViewDidEnter() {
    this.getData();
  }

  getData(){
    var loading = this.loading.create({content: 'Obteniendo periodos'});
    loading.present();
    this.request.get(config.endpoints.get.seguimiento, true)
      .then((response) => {loading.dismiss(); this.seguimientoVale = new ValeModel(response['data']) })
      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }

  localesAsociados(periodoId){
    console.log(periodoId);
    this.navCtrl.push('LocalesAsociadosPage', {id: periodoId});
  }

  async refresh(refresher: any) {
    this.getData();
    if (!_.isNull(refresher)) {
      refresher.complete();
    }  
  }


}
