import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailIncidentAdminPage } from './detail-incident-admin';

import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
  declarations: [
    DetailIncidentAdminPage,
  ],
  imports: [
    IonicPageModule.forChild(DetailIncidentAdminPage),
    PipesModule
  ]
})
export class DetailIncidentAdminPageModule {}
