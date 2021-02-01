import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TaskSelectionComponent } from './components/task-selection/task-selection';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-task-manager',
  templateUrl: 'task-manager.html',
})
export class TaskManagerPage {

  showStats: boolean = this.navParams.get('showStats');
  component: string = this.navParams.get('component');
  constructor(public navCtrl: NavController, public navParams: NavParams) {

  }

  ionViewDidEnter() { }

}
