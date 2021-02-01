import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IncidentsAdminPage } from './incidents-admin';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    IncidentsAdminPage,
  ],
  imports: [
    IonicPageModule.forChild(IncidentsAdminPage),
    PipesModule
  ],
})
export class IncidentsAdminPageModule {}
