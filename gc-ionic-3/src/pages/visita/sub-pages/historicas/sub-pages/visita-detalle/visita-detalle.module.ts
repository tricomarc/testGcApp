import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {VisitaDetallePage} from "./visita-detalle";

@NgModule({
  declarations: [
      VisitaDetallePage,
  ],
  imports: [
    IonicPageModule.forChild(VisitaDetallePage),
  ],
    exports: [
        VisitaDetallePage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class VisitaDetallePageModule {}
