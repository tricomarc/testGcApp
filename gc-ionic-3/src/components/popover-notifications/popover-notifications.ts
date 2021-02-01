import { NavController, PopoverController, App, ViewController, NavParams } from 'ionic-angular';
import { Component } from '@angular/core';
import { NotificationsPage } from '../../pages/notifications/notifications';
import { RequestProvider } from '../../shared/providers/request/request';
import { config } from './popover.config';
import { NavigateService } from '../../pages/notifications/navigate.service';

import * as moment from 'moment';

@Component({
  selector: 'popover-notifications',
  templateUrl: 'popover-notifications.html'
})
export class PopoverNotificationsComponent {

  notificaciones: any = { hoy: [], lastWeek: [], lastMonth: [], lastYear: [] };
  leidas: boolean;
  constructor(private navCtrl: NavController,
    protected app: App,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private request: RequestProvider,
    private navigate: NavigateService,
    private popoverCtrl: PopoverController) {

  }

  ionViewWillEnter() {
    this.leidas = false;
    const n     = this.navParams.get('params');
    this.leidas = !!this.navParams.get('leidas');

    if(n){
      var grupo =  this.agruparPorFechas(n);
      this.notificaciones = grupo;
    }
    
  }

  /**
   * Cambia el estado de una notificación
   * @param idNotificacion 
   */
  cambiarEstadoNotificacion(idNotificacion) {
    var params = {
      notificacionId: idNotificacion
    }
    this.request
      .post(config.endpoints.post.cambiarEstado, params, true)
      .then((response) => { })
      .catch((e) => { })
  }
  
  marcarComoNotificada(){
    this.request
      .get(config.endpoints.get.cambiarEstado, true)
      .then(() => {console.log('Notificada')})
      .catch((e) => {})
  }


  /**
   * Redirecciona a la page de notificaciones
   * y cierra el popover
   */
  viewAll() {
    // this.navCtrl.setRoot(NotificationsPage);
    this.viewCtrl.dismiss();
    this.app.getRootNav().setRoot(NotificationsPage);
  }

  
  /**
   * Agrupa las notificaciones por periodos de tiempo
   * @param notificaciones 
   */
  agruparPorFechas(notificaciones) {
    var hoy = [], lastWeek = [], lastMonth = [], lastYear = [];
    const today = new Date();
    for (let i of notificaciones) {
      var date = moment(i.created).toDate();

      console.log('DATE', date.toISOString())


      if (this.formatted(today) === this.formatted(date)) {
        hoy.push(i);
        continue;
      }
      if (date.getFullYear() < today.getFullYear()) {
        lastYear.push(i);
        continue;
      }
      if (date < this.getLast(30)) {
        lastMonth.push(i);
        continue;
      }
      if (date < today) {
        lastWeek.push(i);
        continue;
      }
    }
    return { hoy, lastWeek, lastMonth, lastYear }

  }

  openPage(data){
    this.viewCtrl.dismiss();
    const prefix = data['modulo_funcion']['core_modulo']['url_prefix'];
    this.cambiarEstadoNotificacion(data['_matchingData']['NotificacionUsuario']['id']);
    if(prefix == 'visual')
      this.navigate.redirect(prefix, data['reporte_id']);
    else
      this.navigate.redirect(prefix, data['id_referente']);

  }
  
  getLast(days) {
    const today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
    return lastWeek;
  }
  formatted(date) {
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  }

}
