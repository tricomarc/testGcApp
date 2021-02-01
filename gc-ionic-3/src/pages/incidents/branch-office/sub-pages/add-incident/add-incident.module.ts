import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddIncidentPage } from './add-incident';

import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
  declarations: [
    AddIncidentPage,
  ],
  imports: [
    IonicPageModule.forChild(AddIncidentPage),
    PipesModule
  ],
})
export class AddIncidentPageModule {}
