import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MiGestionPage } from './mi-gestion';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    MiGestionPage,
  ],
  imports: [
    IonicPageModule.forChild(MiGestionPage),
    RoundProgressModule,
    PipesModule
  ],
})
export class MiGestionPageModule {}
