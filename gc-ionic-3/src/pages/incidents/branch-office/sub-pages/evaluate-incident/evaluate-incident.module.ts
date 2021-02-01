import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EvaluateIncidentPage } from './evaluate-incident';

@NgModule({
  declarations: [
    EvaluateIncidentPage,
  ],
  imports: [
    IonicPageModule.forChild(EvaluateIncidentPage)
  ]
})
export class EvaluateIncidentPageModule {}
