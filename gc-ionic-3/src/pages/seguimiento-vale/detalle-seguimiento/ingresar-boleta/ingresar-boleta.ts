import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { config } from '../../vale.config';
import { IFormBoleta, SetNullFormBoleta } from '../detalle-seguimiento.model';
import { DatePipe } from '@angular/common';
import * as moment from 'moment'; 
import { IPeriodo } from '../../detalle-seguimiento/detalle-seguimiento.model';


@IonicPage()
@Component({
  selector: 'page-ingresar-boleta',
  templateUrl: 'ingresar-boleta.html',
})
export class IngresarBoletaPage {


  formBoleta : FormGroup;
  formBoletaM: IFormBoleta;
  _formBoleta: IFormBoleta;
  idTienda   : number;
  idPeriodo  : number;
  paramBoleta = {
    periodo_id : null,
    tienda_id  : null,
    numero     : null,
    pos        : null,
    fecha      : null,
    cajas      : null,
  };
  dateBoleta : any;
  idBoleta   : number;
  maxLen     : number;
  infoPeriodo: IPeriodo;
  constructor(
    public navCtrl     : NavController,
    private viewCtrl   : ViewController,
    private formBuilder: FormBuilder,
    private util       : UtilProvider,
    private request    : RequestProvider,
    private datePipe   : DatePipe,
    private loading    : LoadingController,
    public navParams   : NavParams) {  }


  ionViewCanEnter(){
    var formBoleta = this.navParams.get('form');
    this.idTienda  = this.navParams.get('idTienda');
    this.idPeriodo = this.navParams.get('idPeriodo');
    this.idBoleta  = this.navParams.get('idBoleta');
    this.maxLen    = this.navParams.get('maxLengthBoletas');
    this.infoPeriodo = this.navParams.get('periodo');
    if(formBoleta){
      this.idTienda  = parseInt(formBoleta.tiendaId);
      this.idPeriodo = parseInt(formBoleta.periodoId);      
      this.formBoleta = this.createForm(formBoleta);
      return;
    }

    this.formBoleta = this.createForm(formBoleta);


  }

  private createForm(form) {
    var fecha = new Date();
    if(!form) form = new SetNullFormBoleta();
    else{
      var dateSplit = form.fechaBoleta.split('-');
      fecha = (new Date(parseInt(dateSplit[2]),parseInt(dateSplit[1]) -1, parseInt(dateSplit[0])));
    }
    var dateBoleta = this.datePipe.transform(fecha, 'yyyy-MM-dd');

    return this.formBuilder.group({
      nBoleta: [form.nBoleta, Validators.required],
      nPos   : [form.nPos, Validators.required],
      nCaja  : [form.cantidadCaja, Validators.required],
      fecha  : [dateBoleta, Validators.required],
    });

  }
  
  
  saveData() {
    if (this.formBoleta.invalid) {
      this.util.showAlert('Atención', 'Existen campos incompletos');
      return;
    }

    const formData = this.formBoleta.value;
    const fecha  = moment(formData.fecha).format('YYYY-MM-DD');
    var minFecha = moment(this.infoPeriodo.fecha_inicio, 'DD-MM-YYYY').subtract(1, 'days').format('YYYY-MM-DD');
    var maxFecha = moment(this.infoPeriodo.fecha_extendida, 'DD-MM-YYYY').add(1, 'days').format('YYYY-MM-DD');

    var valid = moment(fecha).isBetween(minFecha, maxFecha);

    if(!valid){
      this.util.showAlert('Atención', 'La fecha de la boleta ingresada no es válida');
      return;
    }

    this.paramBoleta.periodo_id = this.idPeriodo;
    this.paramBoleta.tienda_id  = this.idTienda;
    this.paramBoleta.numero     = formData.nBoleta;
    this.paramBoleta.pos        = formData.nPos;
    this.paramBoleta.fecha      = formData.fecha;
    this.paramBoleta.cajas      = formData.nCaja;
    if(this.idBoleta){this.paramBoleta['boleta_id'] = this.idBoleta}
    /* -> */ this.enviarBoleta();

  }


  enviarBoleta(){
    var loading = this.loading.create({content: this.idBoleta ? 'Actualizando boleta' : 'Ingresando boleta'});
    loading.present();
    this.request.post(config.endpoints.post.ingresarBoleta, this.paramBoleta, true)
      .then((response) => { 
        console.log(response);
        loading.dismiss();
        this.util.showToast(response['message'], 3000);
        if(response['status']) this.dismiss('actualizar');
      
      })
      .catch((error) => {loading.dismiss(); if (error && error.message) {this.util.showToast(error.message, 3000); } });
  }


  dismiss(info?) {
    this.viewCtrl.dismiss(info ? info : null);
  }
}


