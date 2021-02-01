import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {Tareas3Page} from "./tareas3";

@NgModule({
  declarations: [
      Tareas3Page,
  ],
  imports: [
    IonicPageModule.forChild(Tareas3Page),
  ],
    exports: [
        Tareas3Page
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class Tareas3PageModule {}
