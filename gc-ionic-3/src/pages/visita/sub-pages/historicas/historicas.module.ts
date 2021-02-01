import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {HistoricasPage} from "./historicas";

@NgModule({
  declarations: [
      HistoricasPage,
  ],
  imports: [
    IonicPageModule.forChild(HistoricasPage),
  ],
    exports: [
        HistoricasPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class HistoricasPageModule {}
