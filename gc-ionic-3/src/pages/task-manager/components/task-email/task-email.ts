import { Component } from '@angular/core';
import { LoadingController, NavParams, ViewController } from 'ionic-angular';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'task-email',
  templateUrl: 'task-email.html'
})
export class TaskEmailComponent {

  task: any;
  domains: string[] = [];
  email = {
    title: null,
    subject: null,
    email: null
  }
  from: string = null;
  date_to = new Date();
  date_from = new Date(this.date_to.getFullYear(), this.date_to.getMonth(), 1);
  filters = {
    from: (this.date_from).toISOString(),
    to: (this.date_to).toISOString(),
    type: null,
    stores: [],
    zones: [],
  }

  onSelectedFilter = {
    store: null, zone: null
  };

  constructor(
    private navParams: NavParams,
    private request: RequestProvider,
    private loading: LoadingController,
    private util: UtilProvider,
    private viewCtrl: ViewController) {
      // this.filters.from = this.date:;
      // this.filters.from = this.date_to;
  }


  ionViewDidLoad() {
    this.from = this.navParams.get('from');

    if(this.from && this.from === 'HOME'){
      this.getFiltros();

    }else{
      this.task    = this.navParams.get('task');
      this.domains = this.parse(this.navParams.get('domains'));
  
      const mail   = this.navParams.get('email');
      this.email   = {
        title: 'Detalle de Asignación',
        subject: 'TaskManager - Detalle de Asignacion',
        email: mail
      }
    }

  }

  async getFiltros(){
    const loading = this.loading.create({content: 'Obteniendo filtros'});
    loading.present();
    await this.request.getMicroService('/task/filters/report')
      .then((response: any) => {
        if(!response.status && response.data){
          this.util.showAlert('Atención', 'No se logro obtener los filtros.');
          return;
        }

        const stores = response.data.sucursales;
        const zones  = response.data.zonas;

        if(stores.length > 0) {
          let store: any = { id: null, nombre: 'Ninguna' };
          stores.push(store);

          let sortedItems = _.sortBy(stores, (item) => {
            return item.id === null ? 0 : 1;
          });
          this.filters.stores = (sortedItems);
        }

        if(zones.length > 0) {
          let zone: any = { id: null, nombre: 'Ninguna' };
          zones.push(zone);

          let sortedItems = _.sortBy(zones, (item) => {
            return item.id === null ? 0 : 1;
          });
          this.filters.zones = (sortedItems);

        }

        console.log(this.filters);



        this.email.email    = response.data.email.email;
        this.domains        = this.parse(response.data.empresa.dominios);

      });
    loading.dismiss();
  }



  changeDateFilters(){ }
  onSelectFilter(){ }

  async sendReport(){
    if(this.domains && this.domains.length > 0){
      const mail = this.email.email;
      const hasMatch: boolean = 
      (this.domains.filter((domain) => { 
        return mail.match(domain); })).length > 0;
      
      if(!hasMatch){
        this.util.showAlert('Atención', 'Debe ingresar un correo corporativo.');
        return;
      }

    }

    const zones  = this.onSelectedFilter.zone && this.onSelectedFilter.zone.id || null;
    const stores = this.onSelectedFilter.store && this.onSelectedFilter.store.id || null;


    const body = {
      email: this.email.email,
      stores: stores ? [stores] : stores,
      zones: zones ? [zones] : zones,
      type: this.filters.type == 'all' ? null : this.filters.type,
      dates: {
        from: moment(this.filters.from).format('YYYY-MM-DD'),
        to: moment(this.filters.to).format('YYYY-MM-DD')
      }
    }


    console.log(body);
    const loading = this.loading.create({ content: ''});
    loading.present();
    setTimeout(() => {
      this.util.showToast('En breve recibira un correo con el reporte solicitado.', 3000)
      this.viewCtrl.dismiss();
      loading.dismiss();
    }, 3000)
    await this.request.postMicroService('/task/assignment/report', body);

  }






  async sendEmail() {
    if(this.domains && this.domains.length > 0){
      const mail = this.email.email;
      const hasMatch: boolean = 
      (this.domains.filter((domain) => { 
        return mail.match(domain); })).length > 0;
      
      if(!hasMatch){
        this.util.showAlert('Atención', 'Debe ingresar un correo corporativo.');
        return;
      }

    }


    let body = {
      "replyTo": this.email.email,
      "body": "",
      "text": "",
      "title": this.email.title,
      "subject": this.email.subject,
      "json": this.buildJsonEmail(this.task)
    }

    const loading = this.loading.create({ content: '' });
    loading.present();
    await this.request.postMicroService('/sitio/send/email', body)
      .then((response: any) => {
        if (response && response.status) {
          this.viewCtrl.dismiss();
          this.util.showToast('Correo enviado.', 3000);
        }
      })
      .catch((error) => { });
    loading.dismiss();
  }


  buildJsonEmail(task: any) {
    const json = {
      "name": task.tareaNombre,
      "table": [
        {
          "headers": null,
          "rows": [
            {
              "key": "Descripcion",
              "value": task.tareaDescripcion
            },
            {
              "key": "Vencimiento",
              "value": task.vencimiento
            },
            {
              "key": "Comentario",
              "value": task.tareaComentario || 'Sin comentario'
            },
            {
              "key": "Usuarios",
              "value": (task && task.usuarios && task.usuarios.length > 0) ?
                task.usuarios.map((user) => { return user.nombre }) : []
            }
          ]
        }
      ]
    }


    if (task && task.respuestas.length > 0) {
      let rows = [];
      for (let t of task.respuestas) {
        rows.push({
          "key": t.pregunta_nombre,
          "value": t.total
        });
      }

      json.table.push({
        "headers": ["Preguntas", "Total"],
        "rows": rows
      });
    }



    return json;
  }

  parse(json: any){
    try {
      return JSON.parse(json);
    } catch (error) { return null }
  }

}
