import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReporteUsabilidadPage } from './reporte-usabilidad';
import { ComponentsModule } from '../../components/components.module';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { RoundProgressModule } from 'angular-svg-round-progressbar';


@NgModule({
  declarations: [
    ReporteUsabilidadPage,
  ],
  imports: [
    IonicPageModule.forChild(ReporteUsabilidadPage),
    ComponentsModule,
    Ng2GoogleChartsModule,
    RoundProgressModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ReporteUsabilidadPageModule {}
