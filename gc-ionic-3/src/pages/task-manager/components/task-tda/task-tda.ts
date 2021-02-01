import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { NavController, NavParams, Events, Content, ModalController } from 'ionic-angular';
import { TaskSelectionComponent } from '../task-selection/task-selection';
import { TaskInformationComponent } from '../task-information/task-information';
import { TaskAssignmentComponent } from '../task-assignment/task-assignment';
import { Subscription } from 'rxjs';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { TaskResolutionComponent } from '../task-resolution/task-resolution';
import { TaskSelectionTypeComponent } from '../task-selection-type/task-selection-type';
import { TaskEmailComponent } from '../task-email/task-email';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-tda',
  templateUrl: 'task-tda.html',
})
export class TaskTdaComponent implements OnInit, OnDestroy {

  @ViewChild(Content) content: Content;
  @Input() showStats: any = false;
  @Input() component: string; 

  private view: string = 'home';
  private viewContent: string = null;
  private scrollControlSubscription: Subscription = null;

  private showAssign: boolean = false;
  private sucursalId: number = null;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private modal: ModalController,
    private events: Events) {
  }

  ngOnDestroy(): void {
    try {
      this.events.unsubscribe('CAMERA-BACKGROUND');
      this.events.unsubscribe('TASK_TDA_VIEW_CHANGE');
    } catch (e) { }

    try {
      this.scrollControlSubscription.unsubscribe();
    } catch (e) { }
  }


  ionViewDidEnter() {
		this.events.subscribe('CAMERA-BACKGROUND', (data: any) => {
			this.viewContent = data.view || null;
		});
	}

  ngOnInit() {
    if(this.component && this.component['navigate']){
      this.sucursalId = this.component['data']['sucursalId'];
      this.navCtrl.push(this.component['navigate'], { sucursalId: this.sucursalId });
    }

    this.events.subscribe('TASK_TDA_VIEW_CHANGE', (data: any) => {
      if (data && data.view) this.view = data.view;
    });


    try {
      if (SessionProvider.state.value.hierarchy >= 80) {
        this.showAssign = true;
      } else {
        this.view = 'extra';
      }
    } catch (e) { }

    if(this.showStats){
      this.view = 'stats'
    }

    this.subscribeScroll();
  }

  newAssignment() {
    this.navCtrl.push(TaskAssignmentComponent, { sucursalId: this.sucursalId });
  }

  addTask() {
    const modal = this.modal.create(TaskSelectionTypeComponent);
    modal.onDidDismiss((selection: any) => {
      if(selection && selection.type){
        this.navCtrl.push(TaskInformationComponent, selection);
      }
    });
    modal.present();

  }

  refresh(event: any) {
    this.events.publish('TASK_TDA_REFRESH', { event: event });
  }

  sendReport(){
    const modal = this.modal.create(TaskEmailComponent, { from: 'HOME' });
    modal.present();
  }

  subscribeScroll() {
    this.scrollControlSubscription = this.content.ionScrollEnd.subscribe(async (event: any) => {
      if (!event) return;
      if ((event.scrollTop + this.content.getContentDimensions().contentHeight) > this.content.getContentDimensions().scrollHeight) {
        this.events.publish('TASK_TDA_BOTTOM_SCROLL');
      }
    });
  }



}
