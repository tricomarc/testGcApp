import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {RelojControlPage} from "./reloj-control";

@NgModule({
  declarations: [
      RelojControlPage,
  ],
  imports: [
    IonicPageModule.forChild(RelojControlPage),
  ],
    exports: [
        RelojControlPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class RelojControlPageModule {}
