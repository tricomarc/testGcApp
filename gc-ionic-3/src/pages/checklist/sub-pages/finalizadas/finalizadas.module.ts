import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {FinalizadasPage} from "./finalizadas";

@NgModule({
  declarations: [
      FinalizadasPage,
  ],
  imports: [
    IonicPageModule.forChild(FinalizadasPage),
  ],
    exports: [
        FinalizadasPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class FinalizadasPageModule {}
