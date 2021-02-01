import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LogsIncidentPage } from './logs-incident';

@NgModule({
  declarations: [
    LogsIncidentPage,
  ],
  imports: [
    IonicPageModule.forChild(LogsIncidentPage),
  ],
})
export class LogsIncidentPageModule {}
