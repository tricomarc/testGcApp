import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {Tareas4Page} from "./tareas4";

@NgModule({
  declarations: [
      Tareas4Page,
  ],
  imports: [
    IonicPageModule.forChild(Tareas4Page),
  ],
    exports: [
        Tareas4Page
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class Tareas4PageModule {}
