import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {VisitaAmbitosPage} from "./visita-ambitos";

@NgModule({
  declarations: [
      VisitaAmbitosPage,
  ],
  imports: [
    IonicPageModule.forChild(VisitaAmbitosPage),
  ],
    exports: [
        VisitaAmbitosPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class VisitaAmbitosPageModule {}
