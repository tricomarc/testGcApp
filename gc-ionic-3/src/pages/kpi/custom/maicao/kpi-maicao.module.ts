import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { KpiMaicaoPage } from './kpi-maicao';

import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { IonicSelectableModule } from 'ionic-selectable';


@NgModule({
  declarations: [
    KpiMaicaoPage,
  ],
  imports: [
    IonicPageModule.forChild(KpiMaicaoPage),
    Ng2GoogleChartsModule,
    IonicSelectableModule
  ],
})
export class KpiMaicaoPageModule {}
