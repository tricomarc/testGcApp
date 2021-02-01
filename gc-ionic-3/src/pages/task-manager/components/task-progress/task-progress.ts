import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Events, ModalController } from 'ionic-angular';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

import * as moment from 'moment';
import { globalConfig } from '../../../../config';
import { TaskEmailComponent } from '../task-email/task-email';


@Component({
  selector: 'task-progress',
  templateUrl: 'task-progress.html',
})
export class TaskProgressComponent {

  private task: any = null;
  private email: string = null;
  private domains: string[] = [];
  private detail: any = null;
  private timeLeft: number = null;
  private percentage: number = null;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private loading: LoadingController,
    private events: Events,
    private modal: ModalController,
    private utilProvider: UtilProvider,
    private requestProvider: RequestProvider) {
  }

  async ionViewDidEnter(){
    // this.task = this.navParams.data.task;

    // if (!this.task) {
    //   this.utilProvider.showToast('Falta información de la tarea.', 3000);
    //   this.navCtrl.pop();
    //   return;
    // }
    let task = this.navParams.get('task');

    if(!task){
      this.utilProvider.showToast('Falta información de la tarea.', 3000);
      this.navCtrl.pop();
      return;
    }
    const loading = this.loading.create({ content: 'Obteniendo detalle.'});
    loading.present();

    const query = `?tareaId=${task.taskId}`
    await this.requestProvider.getMicroService(`/task/assignment/detail/${query}`)
      .then((_task: any) => { 
        if(!task.taskId){ task = _task.data.task }
        else { task['respuestas'] = _task.data.task['respuestas']; }

        this.email   = _task.data.email;
        this.domains = _task.data.domains;
        this.task    = task;
       })
      .catch((err) => {
        console.log( err );
        this.utilProvider.showToast('No se logro obtener el detalle.', 2000);
      })
    loading.dismiss();

    console.log(this.task)
  }

  sendEmail(){
    const modal = this.modal.create(TaskEmailComponent, { from: 'DETAIL_ASSIGN',  email: this.email, task: this.task, domains: this.domains });
    modal.present();
  }

  onStats(event: any) { }
}
