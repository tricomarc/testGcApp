import { LoadingController } from 'ionic-angular';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, MenuController } from 'ionic-angular';
import { PopoverNotificationsComponent } from '../../components/popover-notifications/popover-notifications';
import { RequestProvider } from '../../shared/providers/request/request';
import { config } from './notificaciones.config';
import { NavigateService } from './navigate.service';

@IonicPage()
@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html',
})
export class NotificationsPage {

  notificationList: any = {hoy: [], lastWeek: [], lastMonth: [], lastYear: [], noData: false};
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private menu: MenuController,
    private request: RequestProvider,
    private navigate: NavigateService,
    private loading: LoadingController,
    public popoverCtrl: PopoverController) {
      this.marcarComoNotificada();
  }

  ionViewWillEnter() {
    this.menu.close();
    this.getAllNotifications();
  }


  /**
   * Obtiene toda las notificaciones del usuarios
   */
  getAllNotifications() {
    const loading = this.loading.create({content: 'Obteniendo notificaciones'})
    loading.present();
    this.request
      .get(config.endpoints.get.notificaciones, true)
      .then((notificaciones) => {
        console.log(notificaciones)
        loading.dismiss();
        if (notificaciones['data']['notificaciones'].length > 0) {
          var agrupado = this.agruparPorFechas(notificaciones['data']['notificaciones']);
          this.notificationList = agrupado;

        } else {
          this.notificationList.noData = true;
        }
      })
      .catch(e => {
        loading.dismiss();
        console.log(e)
      });
  }

  /**
   * Redirecciona a la pagina correspondiente segun su url_prefix
   */
  async openPage(data){

    this.cambiarEstadoNotificacion(data['_matchingData']['NotificacionUsuario']['id']);
    const prefix = data['modulo_funcion']['core_modulo']['url_prefix'];
    var id = null;
    if (prefix == 'visual') id = data['reporte_id']
    else id = data['id_referente']

    var resp = await this.navigate.redirect(prefix, id);

    if(!resp){
      this.getAllNotifications();
    }
    
  }

  /**
   * Marca las notificaciones como Notificadas
   */
  marcarComoNotificada(){
    this.request
      .get(config.endpoints.get.cambiarEstado, true)
      .then(() => {console.log('Notificada')})
      .catch((e) => {})
  }

  /**
   * Agrupa notificaciones por periodos de tiempo
   * @param notificaciones 
   */
  agruparPorFechas(notificaciones){
    // console.log(notificaciones)
    var hoy = [], lastWeek = [], lastMonth = [], lastYear = [];
    const today = new Date();
    for(let i of notificaciones){
      var date = new Date(i.created);
      if(this.formatted(today) === this.formatted(date)){
        hoy.push(i);
        continue;
      }
      if(date.getFullYear() < today.getFullYear()){
        lastYear.push(i);
        continue;
      }
      if(date < this.getLast(30)){
        lastMonth.push(i);
        continue;    
      }
      if(date < today){
        lastWeek.push(i);
        continue;
      }
    }
    return {hoy, lastWeek, lastMonth, lastYear, noData: false}
    
  }

  getLast(days){
    const today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
    return lastWeek;
  }
  formatted(date){
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
  }


  /**
   * Cambia el estado de la notificacion a leida
   * @param idNotificacion 
   */
  cambiarEstadoNotificacion(idNotificacion){
    var params ={
      notificacionId: idNotificacion
    }
    this.request
      .post(config.endpoints.post.cambiarEstado, params ,true)
      .then((response) => {})
      .catch((e) => {})
  }



}
