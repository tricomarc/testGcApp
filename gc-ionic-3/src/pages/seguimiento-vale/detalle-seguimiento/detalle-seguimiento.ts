import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ModalController } from 'ionic-angular';
import { UtilProvider } from '../../../shared/providers/util/util';
import { RequestProvider } from '../../../shared/providers/request/request';
import { config } from '../vale.config';
import { IBoleta, ArrayBoleta, IPeriodo, ITienda, TiendaModel, PeriodoModel, BoletaModel } from './detalle-seguimiento.model';

import * as _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-detalle-seguimiento',
  templateUrl: 'detalle-seguimiento.html',
})
export class DetalleSeguimientoPage {

  segments: String = 'boleta';
  observation      : string;
  lengthBoletas    : number = 0;
  idTienda         : number;
  idPeriodo        : number;
  infoTienda       : ITienda;
  infoPeriodo      : IPeriodo = new PeriodoModel();
  boletaIngresadas : ArrayBoleta;
  constructor(
      public navCtrl   : NavController,
      public navParams : NavParams,
      private util     : UtilProvider,
      private loading  : LoadingController,
      private modal    : ModalController,
      private request  : RequestProvider) { }

  ionViewDidEnter() {
    this.idTienda      = this.navParams.get('idTienda');
    this.idPeriodo      = this.navParams.get('idPeriodo');
    this.getInfoTienda(this.idPeriodo, this.idTienda)

  }
  

  tapped(){
    this.segments == 'boleta' ? this.segments = 'informacion' : this.segments = 'boleta';
  }



  getInfoTienda(idPeriodo, idTienda){
    var loading = this.loading.create({});
    loading.present();
    this.request.get(`${config.endpoints.get.seguimiento}/${idPeriodo}/${idTienda}`, true)
      .then((response) => {
        loading.dismiss(); 
        if(!response['status']){this.util.showToast(response['message'], 3000); return;} 
        this.processData(response['data'])})

      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }

  processData(data){
    this.infoTienda       = new TiendaModel(data['tienda']);
    this.infoPeriodo      = new PeriodoModel(data['periodo']);
    this.boletaIngresadas = new BoletaModel(data['boletas']);
    this.observation      = data['observacion'];
    if(data['boletas']){
      this.lengthBoletas = (data['boletas'].length -1)
    }

  }


  editarBoleta(boleta: IBoleta){
    var formBoleta = {
      tiendaId     : this.idTienda,
      periodoId    : this.idPeriodo,
      cantidadCaja : boleta.cajas,
      nBoleta      : boleta.numero,
      nPos         : boleta.pos,
      fechaBoleta  : boleta.fecha
    }


    var modal = this.modal.create('IngresarBoletaPage', { form: formBoleta, idBoleta: boleta.boleta_id, periodo: this.infoPeriodo});
    modal.present();
    modal.onDidDismiss((data) => {
      if(data && data == 'actualizar'){
        this.getInfoTienda(this.idPeriodo, this.idTienda);
      }
    })
  }

  editarObservacion(){
    let params = {
      periodo_id : this.idPeriodo,
      tienda_id  : this.idTienda,
      observacion: this.observation
    }
    let loading = this.loading.create({});
    console.log(params);
    loading.present()
    this.request.post(config.endpoints.post.ingresarObservacion, params, true)
      .then((result) => {
        loading.dismiss();
        this.util.showToast(result['message'], 3000);
        this.getInfoTienda(this.idPeriodo, this.idTienda)
      })
      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }

  eliminarBoleta(id: number){
    var alert = this.util.showConfirmAlert('Eliminar boleta', '¿Esta seguro de eliminar la boleta ingresada?');
    alert.present();
    alert.onDidDismiss((pressed)=> {
      if(pressed) this.deleteRequest(id);
    });
  }

  deleteRequest(id: number){
    var loading = this.loading.create({content: 'Eliminando boleta'});
    loading.present();
    let params = {
      "periodo_id": this.idPeriodo,
      "tienda_id" : this.idTienda,
      "boleta_id" : id
    }
    this.request.post(config.endpoints.post.borrarBoleta, params, true)
      .then((response) => {
         loading.dismiss();
         this.util.showToast(response['message'], 3000);
         if(response['status']){this.getInfoTienda(this.idPeriodo, this.idTienda)}  })
      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }

  openModalBoleta(){
    if(this.boletaIngresadas.boletas && this.boletaIngresadas.boletas.length >= this.infoPeriodo.boletas_maximas ){
      this.util.showAlert('Atencíon', `El número máximo de boletas que se pueden ingresar son de ${this.infoPeriodo.boletas_maximas}`);
      return;
    }
    var modal = this.modal.create('IngresarBoletaPage', {form: null, idTienda: this.idTienda, idPeriodo: this.idPeriodo, maxLengthBoletas: this.infoTienda.digitos_boleta, periodo: this.infoPeriodo});
    modal.present();
    modal.onDidDismiss((data) => {
      if(data && data == 'actualizar'){
        this.getInfoTienda(this.idPeriodo, this.idTienda);
      }
    })
  }

  async refresh(refresher: any) {
    this.getInfoTienda(this.idPeriodo, this.idTienda)
    if (!_.isNull(refresher)) {
      refresher.complete();
    }  
  }

}
