import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { TaskUsersComponent } from '../task-users/task-users';
import { UtilProvider } from '../../../../shared/providers/util/util';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-schedule',
  templateUrl: 'task-schedule.html',
})
export class TaskScheduleComponent {

  private tasks: any[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private utilProvider: UtilProvider) {
  }

  ionViewDidLoad() {
    this.tasks = this.navParams.data.tasks;
    if (!this.tasks || !this.tasks.length) {
      this.utilProvider.showToast('No se encontraron tareas.', 3000);
      this.navCtrl.pop();
      return;
    }
  }

  next() {
    const task = this.tasks.find((t) => !t.schedule);
    if (task) {
      this.utilProvider.showToast('Seleccione un horario para todas las tareas.', 3000);
      // return;
    }
    this.navCtrl.push(TaskUsersComponent, { tasks: this.tasks });
  }
}
