import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, LoadingController, Events } from 'ionic-angular';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

import * as  _ from 'lodash';
import { Subscription } from 'rxjs';
import { TaskResolutionComponent } from '../task-resolution/task-resolution';
import { FormControl } from '@angular/forms';


/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-extra',
  templateUrl: 'task-extra.html',
})
export class TaskExtraComponent implements OnInit, OnDestroy {

  private tasks: any[] = [];
  private userId: number = null;

  private params: { page: number; pageSize: number; q: string, filter: string } = {
    page: 0,
    pageSize: 20,
    q: '',
    filter: ''
  };

  private filters: any = { from: null, to: null };

  private searchControlSubscription: Subscription = null;
  private searchControl = new FormControl();
  private typeTask: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private loadingController: LoadingController,
    private events: Events,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider) {
  }

  async ngOnInit() {
    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.events.subscribe('TASK_TDA_REFRESH', (data: any) => {
      if (data.event) this.refreshTasks(data.event);
    });

    this.events.subscribe('TASK_TDA_BOTTOM_SCROLL', async () => {
      this.params.page += 1;
      const loading = this.loadingController.create({ content: 'Cargando tareas...' });
      loading.present();
      await this.getOwnTasks();
      loading.dismiss();
    });

    this.events.subscribe('ASSIGNMENT_UPDATED', () => {
      this.getOwnTasks();
    });

    this.filters = this.navParams.data.filters;

    if (!this.filters) {
      // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
      let to = new Date();
      let from = new Date(to.getFullYear(), to.getMonth(), 1);

      // Definimos los filtros
      this.filters = {
        from: (this.utilProvider.getFormatedDate(from)),
        to: (this.utilProvider.getFormatedDate(to))
      };
    }

    this.subscribeSearch();

    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getOwnTasks();

    loading.dismiss();
  }

  ngOnDestroy() {

    try {
      this.searchControlSubscription.unsubscribe();
    } catch (e) { }

    this.events.unsubscribe('TASK_TDA_REFRESH');
    this.events.unsubscribe('TASK_TDA_BOTTOM_SCROLL');
    this.events.unsubscribe('ASSIGNMENT_UPDATED');
  }

  async getTaskFilter(){
    console.log( 'typo task', this.typeTask, this.tasks );

    this.tasks = [];

    switch( this.typeTask ){
      case '0': {
        this.params.filter = null;
        break;
      }

      case '1': {
        this.params.filter = 'SIMPLE';

        break;
      }

      case '2': { 
        this.params.filter = 'NUMERICA';

        break;
      }
    }

    console.log('params', this.params.filter)
   
    this.getOwnTasks();
  }

  async getOwnTasks() {
    let body = `?usuarioId=${this.userId}&page=${this.params.page}&perPage=${this.params.pageSize}&from=${this.filters.from}&to=${this.filters.to}&search=${this.params.q}`
  
    if (this.params.filter) {
      body += `&tipo=${this.params.filter}`;
    }
    
    await this.requestProvider.getMicroService('/task/user' + body )
      .then((response: any) => {

        if (response.data && response.data.pagination && response.data.pagination.err) {
          if (this.params.page) {
            this.params.page = this.params.page - 1;
          }
        }

        if (response.data && _.isArray(response.data.tareas)) {
          response.data.tareas.forEach((t: any) => {
            // Si la tarea no existe la agregamos, si no la actualizamos
            const task = _.find(this.tasks, { tareaId: t.tareaId });
            if (!task) {
              this.tasks.push(t);
            } else {
              const index = _.findIndex(this.tasks, { tareaId: t.tareaId });
              this.tasks.splice(index, 1, t);
            }
          });
        }
      })
      .catch((data: any) => {
        this.utilProvider.showToast('No ha sido posible obtener la lista de tareas, intente nuevamente.', 3000);
      });
  }

  async refreshTasks(event: any) {
    this.tasks = [];
    this.resetTasks();
    await this.getOwnTasks();
    event.complete();
  }

  resetTasks() {
    this.params.page = 0;
    this.params.pageSize = 20;
    this.tasks = [];
  }

  openTask(task: any) {
    // if (task.estadoId === 1) {
    this.navCtrl.push(TaskResolutionComponent, task);
    // }
  }

  async changeDateFilters() {
    this.resetTasks();
    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getOwnTasks();
    loading.dismiss();
  }


  subscribeSearch() {
    this.searchControlSubscription = this.searchControl.valueChanges
      .debounceTime(300) // Cuando se deja de tipear por 300 ms
      .distinctUntilChanged() // Si el input es distinto
      .subscribe(async (searchTerm: any) => {
        this.resetTasks();
        this.params.q = searchTerm;
        this.getOwnTasks();
      });
  }
}
