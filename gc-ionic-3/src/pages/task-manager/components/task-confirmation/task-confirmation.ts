import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-confirmation',
  templateUrl: 'task-confirmation.html',
})
export class TaskConfirmationComponent {

  private tasks: any[] = [];
  private users: any[] = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    this.tasks = this.navParams.data.tasks;
    this.users = this.navParams.data.users;
  }
}
