import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NavController, NavParams, Events, LoadingController, Content, ViewController } from 'ionic-angular';
import { TaskInformationComponent } from '../task-information/task-information';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';

import * as _ from 'lodash';
import { FormControl } from '@angular/forms';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { Subscription } from 'rxjs';
import { TaskScheduleComponent } from '../task-schedule/task-schedule';
import { TaskUsersComponent } from '../task-users/task-users';
import moment from 'moment';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-selection',
  templateUrl: 'task-selection.html',
})
export class TaskSelectionComponent implements OnInit, OnDestroy {

  @ViewChild(Content) content: Content;

  private tasks: any[] = [];
  private params: { page: number; pageSize: number; q: string } = {
    page: 0,
    pageSize: 20,
    q: ''
  };
  private searchControl = new FormControl();
  private userId: number = null;

  private previousSelectedTasks: any[] = [];

  private searchControlSubscription: Subscription = null;
  private scrollControlSubscription: Subscription = null;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private events: Events,
    private loadingController: LoadingController,
    private viewController: ViewController,
    private requestProvider: RequestProvider,
    private utilProvider: UtilProvider) {
  }

  ngOnDestroy() {
    try {
      this.searchControlSubscription.unsubscribe();
    } catch (e) { }

    try {
      this.scrollControlSubscription.unsubscribe();
    } catch (e) { }
  }

  async ngOnInit() {

    this.previousSelectedTasks = this.navParams.data.tasks;

    try {
      this.userId = parseInt(SessionProvider.state.value.userId);
    } catch (e) { }

    this.subscribeSearch();
    this.subscribeScroll();
    this.events.subscribe('TASK_CREATED', () => {
      this.resetTasks();
      this.getTasks();
    });

    const loading = this.loadingController.create({ content: 'Cargando tareas...' });
    loading.present();
    await this.getTasks();
    loading.dismiss();
  }

  add() {
    this.navCtrl.push(TaskInformationComponent);
  }

  next() {
    const tasks = this.tasks.filter((t) => t.selected);
    if (!tasks || !tasks.length) {
      this.utilProvider.showToast('Seleccione al menos una tarea.', 3000);
      return;
    }

    this.viewController.dismiss({ selectedTasks: tasks });
  }

  async getTasks() {

    if (!this.userId) {
      this.utilProvider.showToast('No fue posible obtener la lista de tareas.', 3000);
      return;
    }

    await this.requestProvider.postMicroService('/task/get_tasks', {
      usuario_id: this.userId,
      page: this.params.page,
      search: this.params.q,
      perPage: this.params.pageSize
    })
      .then((response: any) => {

        if (response.data && response.data.pagination && response.data.pagination.err) {
          if (this.params.page) {
            this.params.page = this.params.page - 1;
          }
        }

        if (response.data && _.isArray(response.data.results)) {
          response.data.results.forEach((t: any) => {

            // Consideramos la tarea solamente si no existe en la lista de tareas
            if (!_.find(this.tasks, { Tarea_id: t.Tarea_id })) {

              // Cada vez que agregamos una tarea, verificamos si viene desde el arreglo anterior (previamente seleccionada)
              const previousTask = _.find(this.previousSelectedTasks, (pt) => pt.Tarea_id === t.Tarea_id);

              // Si viene, asignamos los valores ya ingresados por el usuario en la vista anterior
              if (previousTask) {
                t.selected = previousTask.selected;
                t.fechaInicio = previousTask.fechaInicio;
                t.horaInicio = previousTask.horaInicio;
                t.horaTermino = previousTask.horaTermino;

                // También la eliminamos para no volver a asignar estos valores.
                _.remove(this.previousSelectedTasks, (pt) => pt.Tarea_id === previousTask.Tarea_id);

              }
              // Si no, simplemenete ponemos los valores por defecto
              else {
                t.selected = false;
                t.fechaInicio = '';
                t.horaInicio = moment().format('HH:mm');
                t.horaTermino = '23:59:59';
                t.minEndTime = moment().add('minute', 1).format('HH:mm');
              }
              this.tasks.push(t);
            }
          });
        }
      })
      .catch((error) => {
        this.utilProvider.showToast('No fue posible obtener la lista de tareas.', 3000);
      });
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

  resetTasks() {
    this.params.page = 0;
    this.params.pageSize = 20;
    this.params.q = '';
    _.remove(this.tasks, (t: any) => {
      return !t.selected;
    });
  }

  async refreshTasks(event: any) {
    this.tasks = [];
    this.resetTasks();
    await this.getTasks();
    event.complete();
  }

  subscribeScroll() {
    this.scrollControlSubscription = this.content.ionScrollEnd.subscribe(async (event: any) => {
      if (!event) return;
      if ((event.scrollTop + this.content.getContentDimensions().contentHeight) > this.content.getContentDimensions().scrollHeight) {
        this.params.page += 1;
        const loading = this.loadingController.create({ content: 'Cargando tareas...' });
        loading.present();
        await this.getTasks();
        loading.dismiss();
      }
    });
  }

  close() {
    const tasks = this.tasks.filter((t) => t.selected);
    this.viewController.dismiss({ selectedTasks: tasks });
  }
}