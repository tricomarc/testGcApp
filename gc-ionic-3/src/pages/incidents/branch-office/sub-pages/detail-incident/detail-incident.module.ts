import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailIncidentPage } from './detail-incident';

@NgModule({
  declarations: [
    DetailIncidentPage,
  ],
  imports: [
    IonicPageModule.forChild(DetailIncidentPage)
  ]
})
export class DetailIncidentPageModule {}
