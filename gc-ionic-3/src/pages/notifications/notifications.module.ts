import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NotificationsPage } from './notifications';
import { NavigateService } from './navigate.service';

@NgModule({
  declarations: [
    NotificationsPage,
  ],
  imports: [
    IonicPageModule.forChild(NotificationsPage),
  ],
  providers: [
    NavigateService
  ]
})
export class NotificationsPageModule {}
