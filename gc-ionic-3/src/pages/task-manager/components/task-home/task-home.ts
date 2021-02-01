import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, Events, LoadingController } from 'ionic-angular';
import { TaskResolutionComponent } from '../task-resolution/task-resolution';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

import * as _ from 'lodash';
import * as moment from 'moment';

import { TaskProgressComponent } from '../task-progress/task-progress';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-home',
  templateUrl: 'task-home.html',
})
export class TaskHomeComponent implements OnInit, OnDestroy {

  private tasks: any[] = [];
  private loading: boolean = true;

  private userId: number = null;

  private params: any = {
    page: 0,
    pageSize: 20,
    q: '',
    filter: null
  };

  private searchControlSubscription: Subscription = null;
  private searchControl = new FormControl();
  private typeTask: number = 0;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private events: Events,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider,
    private loadingController: LoadingController) {
  }

  async ngOnInit() {

    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.events.subscribe('TASK_TDA_REFRESH', (data: any) => {
      if (data.event) this.refreshTasks(data.event);
    });

    this.events.subscribe('NEW_ASSIGNMENT', () => {
      this.refreshTasks(null);
    });

    this.events.subscribe('TASK_TDA_BOTTOM_SCROLL', async () => {
      this.params.page += 1;
      const loading = this.loadingController.create({ content: 'Cargando tareas...' });
      loading.present();
      await this.getTasks();
      loading.dismiss();
    });

    this.subscribeSearch();

    this.loading = true;

    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getTasks();
    this.loading = false;
    loading.dismiss();
  }

  ngOnDestroy() {
    this.events.unsubscribe('TASK_TDA_REFRESH');
    this.events.unsubscribe('TASK_TDA_BOTTOM_SCROLL');

    try {
      this.searchControlSubscription.unsubscribe();
    } catch (e) { }
  }

  showResolution(task: any) {
    this.navCtrl.push(TaskProgressComponent, { task: task });
  }

  setView(view: string) {
    this.events.publish('TASK_TDA_VIEW_CHANGE', { view: view })
  }

  getTaskFilter(){
    this.tasks = [];
    if(this.typeTask == 0){
      this.params.filter = null;
    }
    if(this.typeTask == 1){ 
      this.params.filter = ('SIMPLE');
    }
    if(this.typeTask == 2){ 
      this.params.filter = ('NUMERICA');
    }
    this.getTasks(true);
  }

  async getTasks(showLoading?: any) {
    let query = `?usuarioId=${this.userId}&page=${this.params.page}&perPage=${this.params.pageSize}&alcance=mensual`;
    if (this.params.q) {
      query += `&search=${this.params.q}`
    }
    if (this.params.filter) {
      query += `&tipo=${this.params.filter}`;
    }

    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    if (showLoading) loading.present();
    await this.requestProvider
      .getMicroService(`/task/info/statistics` + query)
      .then((response: any) => {

        if (response.data && response.data.pagination && response.data.pagination.err) {
          if (this.params.page) {
            this.params.page = this.params.page - 1;
          }
        }

        if (response.data && _.isArray(response.data.tareas)) {
          response.data.tareas.forEach((t: any) => {
            // Si la asignación no existe la agregamos, si no la actualizamos
            const task = _.find(this.tasks, { asignacionId: t.asignacionId });
            if (!task) {
              t.vencimiento = moment(t.vencimiento).format('YYYY-MM-DD HH:mm:ss');
              this.tasks.push(t);
            } else {
              const index = _.findIndex(this.tasks, { asignacionId: t.asignacionId });
              this.tasks.splice(index, 1, t);
            }
          });
        }
      })
      .catch((data: any) => {
        this.utilProvider.showToast('No ha sido posible obtener la lista de tareas, intente nuevamente.', 3000);
      });

    if (showLoading) loading.dismiss();
  }

  async refreshTasks(event: any) {
    this.tasks = [];
    this.resetTasks();
    await this.getTasks();
    if (event) event.complete();
  }

  resetTasks() {
    this.params.page = 0;
    this.params.pageSize = 20;
    this.tasks = [];
  }

  subscribeSearch() {
    this.searchControlSubscription = this.searchControl.valueChanges
      .debounceTime(300) // Cuando se deja de tipear por 300 ms
      .distinctUntilChanged() // Si el input es distinto
      .subscribe(async (searchTerm: any) => {
        this.resetTasks();
        this.params.q = searchTerm;
        this.getTasks();
      });
  }
}
