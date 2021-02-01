import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {Tareas2Page} from "./tareas2";

@NgModule({
  declarations: [
      Tareas2Page,
  ],
  imports: [
    IonicPageModule.forChild(Tareas2Page),
  ],
    exports: [
        Tareas2Page
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class Tareas2PageModule {}
