import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { UtilProvider } from '../../shared/providers/util/util';
import { RequestProvider } from '../../shared/providers/request/request';
import { config } from './reporte.config';
import { PopoverMultiselectComponent } from '../../components/popover-multiselect/popover-multiselect';
import { IPorcentajes, PeriodosModel, PorcentajesModel, SubModel } from './reporte.model';
import * as moment from 'moment';
import { global } from "../../shared/config/global";

@IonicPage()
@Component({
  selector: 'page-reporte-usabilidad',
  templateUrl: 'reporte-usabilidad.html'
})
export class ReporteUsabilidadPage {
  private filters = {
    from: null,
    to:   null,
    subgerencias_id: []
  };

  selectSubgerencias: any = []; 
  periodos   : any = [];
  porcentajes: IPorcentajes = new PorcentajesModel();
  selected   : any;
  requesting : boolean = false;
  //Grafico
  chartColor: string = '';
  chartSecondaryColor: string = '';
  didEnter: boolean = false;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    private util       : UtilProvider,
    private request    : RequestProvider,
    private popOver    : PopoverController) {

    this.getPromises();

  }
  
  ionViewDidEnter() {
    this.chartColor = global.client_colors.primary;
    this.chartSecondaryColor = '#E4EAE3';
    
  }

  /**
   * Obtiene y espera a que se cumplan las promesas de los request
   */
  async getPromises(){

    this.requesting = true;
    this.didEnter = true;
    var resolve = await Promise.all([this.getUsabilityReport(), this.getSubgerencias()]
    .map(p => p.catch(e => e)));
    this.requesting = false;

    var reporte      = resolve[0];
    var subgerencias = resolve[1];

    this.processResponse(reporte);
    if(subgerencias['status']){
        this.selected = this.setIsCheckFirst(subgerencias['data']);
        subgerencias['data'] = this.selected;
    }
    this.processResponseSubg(subgerencias);

  }


  /**
   * Obtiene listado de subgerencias
   */
  getSubgerencias(){
    return new Promise((resolve, reject) => {
        this.request.post(config.endpoints.get.obtener_subgerencias, {}, true)
          .then((response) => { resolve(response) })
          .catch((error)  => { reject(error) });
    })
  }


  /**
   * Obtiene reporte de uso del periodo seleccionado
   */
  getUsabilityReport(){
    return new Promise((resolve, reject) => {

        let params = {
          "desde": this.filters.from ? this.filters.from : this.getDate('lastMonth'),
          "hasta": this.filters.to   ? this.filters.to   : this.getDate('today'),
          "subgerencias_id": this.filters.subgerencias_id
        }
        this.request.post(config.endpoints.post.reporte_uso, params, true) // CAMBIAR POSTLOCAL POR POST
          .then((response)  => { resolve(response) })
          .catch((error) => { reject(error)})
    });
  }



  processResponse(response: any){
    if(!response.status){
        if(response.errors.length > 0){
            if(this.didEnter){
                this.didEnter = false;
                this.util.showToast('Sin campañas vigentes para el ultimo mes', 3000);
            }else{
                this.clearVeiw();
                this.util.showAlert('Atención', response.errors[0]);
            }
            return;
        }
        this.util.showAlert('Atención', response['message']);
        return;
    }

    this.periodos    = new PeriodosModel(response.data['periodos']);
    this.porcentajes = new PorcentajesModel(response.data['porcentajes']);
    
  }

  processResponseSubg(response: any){
    if(!response.status){
        if(response.errors.length > 0){
            this.util.showAlert('Atención', response.errors[0]);
            return;
        }
        this.util.showAlert('Atención', response['message']);
        return;
    }

    this.selectSubgerencias = new SubModel(response.data);
  }


  setIsCheckFirst(sub: Array<any>){
    var i = 0;
    sub.forEach((e) => { sub[i]['isCheck'] = true; i++})
    return sub;
  }

  getDate(query?: string){
    if(query && query == 'today'){
        return moment().format('YYYY-MM-DD');
    }
    if(query && query == 'lastMonth'){
        return moment().subtract(1, 'month').format('YYYY-MM-DD');
    }

    var today = moment().format('YYYY-MM-DD');
    var lastMonth = moment().subtract(1, 'month').format('YYYY-MM-DD');
    return {from: lastMonth, to: today}
  }

  dateChange(){
    if(this.filters.from && this.filters.to){
        this.searchReport();
    }
  }

  popUp(popEvent){
    const popup = this.popOver.create(PopoverMultiselectComponent, {items: this.selectSubgerencias._subgerencia});
    
    popup.onDidDismiss((data) => {
        if(data){
            this.selectSubgerencias = new SubModel(data.items);
            this.selected = data.items.filter((i) => {return i.isCheck });
            this.setIdSub(this.selected);
            this.searchReport();
        }
    })
    
    popup.present({ev: popEvent});
  }

  setIdSub(sub: Array<any>){
    var ids = [];
    sub.forEach((e) => {
        ids.push(e.id);
    });
    this.filters.subgerencias_id = ids;
  }

  async searchReport(){


    if(!this.filters.from){
      this.util.showToast('Debe seleccionar una fecha de inicio', 3000);
      return;
    }

    if(!this.filters.to){
      this.util.showToast('Debe seleccionar una fecha de término', 3000);
      return;
    }

    if(moment(this.filters.from) > moment(this.filters.to)){
      this.util.showAlert('Atención','Fecha no válida');
      return;
    }

    this.requesting = true;
    const reporte = await this.getUsabilityReport();
    this.processResponse(reporte);
    this.requesting = false;
    
  
  }


  clearVeiw(){
    this.periodos = [];
    this.porcentajes = new PorcentajesModel();
  }

}
