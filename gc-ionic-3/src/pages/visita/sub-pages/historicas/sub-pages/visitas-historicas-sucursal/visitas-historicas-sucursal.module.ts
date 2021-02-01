import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {VisitasHistoricasSucursalPage} from "./visitas-historicas-sucursal";

@NgModule({
  declarations: [
      VisitasHistoricasSucursalPage,
  ],
  imports: [
    IonicPageModule.forChild(VisitasHistoricasSucursalPage),
  ],
    exports: [
        VisitasHistoricasSucursalPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class VisitasHistoricasSucursalPageModule {}
