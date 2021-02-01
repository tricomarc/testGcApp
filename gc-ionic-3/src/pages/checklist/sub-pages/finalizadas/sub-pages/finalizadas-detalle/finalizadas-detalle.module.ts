import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {FinalizadasDetallePage} from "./finalizadas-detalle";
import {PipesModule} from '../../../../../../pipes/pipes.module'
@NgModule({
  declarations: [
      FinalizadasDetallePage,
  ],
  imports: [
    IonicPageModule.forChild(FinalizadasDetallePage),
      PipesModule
  ],
    exports: [
        FinalizadasDetallePage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class FinalizadasDetallePageModule {}
