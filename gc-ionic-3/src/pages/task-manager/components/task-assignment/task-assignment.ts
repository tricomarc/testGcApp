import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, LoadingController, Events, ModalController, Content } from 'ionic-angular';
import { Periodicity } from '../../models/periodicity.class';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { IInfoForm } from '../../models/info-form.interface';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';

import * as _ from 'lodash';
import * as moment from 'moment';

import { globalConfig } from '../../../../config';
import { TaskSelectionComponent } from '../task-selection/task-selection';
import { TaskUsersComponent } from '../task-users/task-users';
import { SessionProvider } from '../../../../shared/providers/session/session';
interface ICoords { latitude: number, longitude: number };

@Component({
  selector: 'task-assignment',
  templateUrl: 'task-assignment.html',
})
export class TaskAssignmentComponent {

  @ViewChild(Content) content: Content;
  private showStores: boolean = false;
  private stores: any[] = [];
  private rawStores: any[] = [];
  private storesModel: any = {};

  private tasks: any[] = [];
  private users: any[] = [];
  private userId: number = null;
  private minDate: any = null;
  private sucursalId: number = null;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private geolocation: Geolocation,
    private loadingController: LoadingController,
    private session: SessionProvider,
    private events: Events,
    private modalController: ModalController,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider) {
  }

  async ionViewDidLoad() {

    this.sucursalId = this.navParams.get('sucursalId') || null;
    this.minDate = moment().format('YYYY-MM-DD');
    const jerarquia = SessionProvider.state.value && SessionProvider.state.value.hierarchy || null;

    if(!this.sucursalId && jerarquia && (jerarquia >= 98 && jerarquia <= 101) ){
      this.getStores();
    }

    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }
  }

  onMinStartTimeChange(event: any, task: any) {
    const currentDate = moment().format('YYYY-MM-DD');
    const startTime = `${currentDate} ${task.horaInicio}:00`;
    const endTime = `${currentDate} ${task.horaTermino}:00`;

    task.minEndTime = moment(startTime).add('minute', 1).format('HH:mm:ss');

    if (moment(endTime).unix() <= moment(startTime).unix()) {
      this.utilProvider.showToast('Seleccionaste una hora de inicio mayor a la de término, por lo cual la hemos corregido. Valida el horario de término.', 3000);
      task.horaTermino = moment(startTime).add('minute', 1).format('HH:mm:ss');
    }
  }

  async getStores(){
    const loading = this.loadingController.create({ content: 'Obteniendo sucursales.'});
    loading.present();
    const coords = await this.getCoords();
    
    let q = `?page=0&perPage=999`
    if(coords){
      q += `&latitud=${coords.latitude}&longitud=${coords.longitude}`
    }

    this.requestProvider.getMicroService('/task/user/stores'+q)
      .then((response: any) => {
        loading.dismiss();
        if(response && response.code === 200) {
          if(response.data.length > 0){
            this.showStores = true;
            const data = [...response.data, {id: null, nombre: 'Todas'}]
              .sort((a,b) => { return a.id - b.id  ||  a.name.localeCompare(b.name); });

            this.storesModel = data[0];
            this.stores = data;
            this.rawStores = data;
          }
        }
      })
      .catch((error) => {
        loading.dismiss();
        this.utilProvider.logError(JSON.stringify(error), 'TM03', globalConfig.version);
      })
  }

  storesSelected(){
    // console.log(this.storesModel);
  }

  onSearchStores(search: any){
    if (search.text) {
        this.stores = _.filter(this.rawStores, (checklist) => {
            return _.includes(this.utilProvider.cleanText(checklist.name), this.utilProvider.cleanText(search.text));
        });
        return;
    }
    this.stores = this.rawStores;
  }


  async getCoords(): Promise<ICoords>{
    try {
      const options: GeolocationOptions = { timeout: 15000, enableHighAccuracy: false, maximumAge: 100 };
      const { latitude, longitude  } = (await this.geolocation.getCurrentPosition(options)).coords;
      return {  latitude, longitude  };

    } catch (error) { return null; }
  }

  async create() {
    if (!this.tasks.length) {
      this.utilProvider.showToast('Seleccione al menos una tarea.', 3000);
      return;
    }

    for (let task of this.tasks) {
      if (!task.fechaInicio || !task.horaInicio || !task.horaTermino) {
        this.utilProvider.showToast('Cada tarea debe tener fecha, hora de inicio y hora de término.', 3000);
        return;
      }
    }

    if (!this.users.length) {
      this.utilProvider.showToast('Seleccione al menos un usuario.', 3000);
      return;
    }

    const loading = this.loadingController.create({ content: 'Asignando tareas.' });
    loading.present();

    const uIds = this.users.map((u: any) => u.id);
    const body = {
      asignadorId: this.userId,
      tareas: this.tasks.map((t: any) => {
        return {
          tareaId: t.Tarea_id,
          tareaNombre: t.Tarea_nombre,
          usuariosId: uIds,
          inicio: `${t.fechaInicio} ${t.horaInicio}`,
          vencimiento: `${t.fechaInicio} ${t.horaTermino}`,
          periodicidadId: t.periodicidad.id || 5
        }
      })
    }

    await this.requestProvider.postMicroService('/task/assign_task', body)
      .then((response: any) => {
        this.utilProvider.showToast(response.message, 3000);
        this.navCtrl.popToRoot();
        this.events.publish('NEW_ASSIGNMENT');
      })
      .catch((data: any) => {
        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible crear las asignaciones, intente nuevamente.');
        this.utilProvider.logError(JSON.stringify(data), 'TM03', globalConfig.version);
      });

    loading.dismiss();
  }

  openTaskSelection() {
    const modal = this.modalController.create(TaskSelectionComponent, {
      tasks: this.tasks
    });

    modal.present();

    modal.onDidDismiss((data: any) => {
      if (data && data.selectedTasks) {
        this.tasks = data.selectedTasks;
      }
      this.scrollToBottom(100);
    });
  }

  removeTask(task: any) {
    _.remove(this.tasks, (t: any) => t.Tarea_id === task.Tarea_id);
  }

  openUserSelection() {
    let store: any[] = [];
    if(!this.sucursalId){
      if(!this.storesModel.id){
        store = this.rawStores.map((store) => { return store.id })
          .reduce((acc, el) => { if(el) acc.push(el); return acc }, []);;
  
      }else{
        store.push(this.storesModel.id);
      }

    }else{
      store.push(this.sucursalId);
    }

    const modal = this.modalController.create(TaskUsersComponent, {
      users: this.users,
      store
    });

    modal.present();

    modal.onDidDismiss((data: any) => {
      if (data && data.selectedUsers) {
        this.users = data.selectedUsers;
      }
    });
  }

  removeUser(user: any) {
    _.remove(this.users, (u: any) => u.id === user.id);
  }

  scrollToBottom(duration: number) {
    try {
      this.content.resize();
    } catch (e) { }
    setTimeout(() => {
      try {
        this.content.scrollToBottom(duration);
      } catch (e) { }
    }, 300);
  }
}
