import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, LoadingController, Events, ViewController, Content } from 'ionic-angular';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

import * as moment from 'moment';
import * as _ from 'lodash';

import { globalConfig } from '../../../../config';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { TaskResolutionComponent } from '../task-resolution/task-resolution';
import { Subscription } from 'rxjs';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-assignment-list',
  templateUrl: 'task-assignment-list.html',
})
export class TaskAssignmentListComponent {

  @ViewChild(Content) content: Content;

  private tasks: any[] = [];
  private userId: number = null;

  private params: { page: number; pageSize: number; q: string } = {
    page: 0,
    pageSize: 20,
    q: ''
  };

  private estadoId: number = null;

  private summaries: any = [] = [];

  private scrollControlSubscription: Subscription = null;

  private filters: any = { from: null, to: null };

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private loadingController: LoadingController,
    private events: Events,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider) {
  }

  async ionViewDidLoad() {

    this.subscribeScroll();

    this.filters = this.navParams.data.filters;

    if (!this.filters || !this.filters.from || !this.filters.to) {
      // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
      let to = new Date();
      let from = new Date(to.getFullYear(), to.getMonth(), 1);

      // Definimos los filtros
      this.filters = {
        from: (this.utilProvider.getFormatedDate(from)),
        to: (this.utilProvider.getFormatedDate(to))
      };
    }

    this.summaries = this.navParams.data.summaries;
    this.estadoId = this.navParams.data.estadoId;

    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.events.subscribe('TASK_TDA_BOTTOM_SCROLL', async () => {
      this.params.page += 1;
      const loading = this.loadingController.create({ content: 'Cargando tareas...' });
      loading.present();
      await this.getTasks();
      loading.dismiss();
    });

    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getTasks();
    loading.dismiss();
  }

  ionViewDidLeave() {
    this.events.unsubscribe('TASK_TDA_BOTTOM_SCROLL');
    try {
      this.scrollControlSubscription.unsubscribe();
    } catch (e) { }
  }

  async getTasks() {
    await this.requestProvider.getMicroService(`/task/assigment/user?estado=${this.estadoId}&usuarioId=${this.userId}&page=${this.params.page}&perPage=${this.params.pageSize}&from=${this.filters.from}&to=${this.filters.to}`)
      .then((response: any) => {

        if (response.data && response.data.pagination && response.data.pagination.err) {
          if (this.params.page) {
            this.params.page = this.params.page - 1;
          }
        }

        if (response.data && _.isArray(response.data.tareas)) {
          response.data.tareas.forEach((t: any) => {
            // Consideramos la tarea solamente si no existe en la lista de tareas
            if (!_.find(this.tasks, { asignacionId: t.asignacionId })) {
              this.tasks.push(t);
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
    await this.getTasks();
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

  async onSummaryChange() {
    this.resetTasks();
    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getTasks();
    loading.dismiss();
  }

  subscribeScroll() {
    this.scrollControlSubscription = this.content.ionScrollEnd.subscribe(async (event: any) => {

      if (!event) return;

      if ((event.scrollTop + this.content.getContentDimensions().contentHeight) + 100 > this.content.getContentDimensions().scrollHeight) {
        this.params.page += 1;
        const loading = this.loadingController.create({ content: 'Cargando tareas...' });
        loading.present();
        await this.getTasks();
        loading.dismiss();
      }
    });
  }

  showResolution(task: any) {
    const t = _.cloneDeep(task);
    t.readOnly = true;
    this.navCtrl.push(TaskResolutionComponent, t);
  }

  async changeDateFilters() {
    this.resetTasks();
    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getTasks();
    loading.dismiss();
  }
}
