import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IncidentsZonalPage } from './incidents-zonal';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    IncidentsZonalPage,
  ],
  imports: [
    IonicPageModule.forChild(IncidentsZonalPage),
    PipesModule
  ],
})
export class IncidentsZonalPageModule {}
