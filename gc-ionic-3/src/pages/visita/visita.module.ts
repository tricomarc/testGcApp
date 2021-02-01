import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisitaPage } from './visita';

import { IonicSelectableModule } from 'ionic-selectable';

@NgModule({
  declarations: [
    VisitaPage,
  ],
  imports: [
    IonicPageModule.forChild(VisitaPage),
    IonicSelectableModule
  ],
})
export class VisitaPageModule {}
