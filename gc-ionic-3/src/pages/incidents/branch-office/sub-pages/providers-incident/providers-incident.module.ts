import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProvidersIncidentPage } from './providers-incident';

@NgModule({
  declarations: [
    ProvidersIncidentPage,
  ],
  imports: [
    IonicPageModule.forChild(ProvidersIncidentPage),
  ],
})
export class ProvidersIncidentPageModule {}
