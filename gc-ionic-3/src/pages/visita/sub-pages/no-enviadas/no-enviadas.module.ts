import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {NoEnviadasPage} from "./no-enviadas";

@NgModule({
  declarations: [
      NoEnviadasPage,
  ],
  imports: [
    IonicPageModule.forChild(NoEnviadasPage),
  ],
    exports: [
        NoEnviadasPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class NoEnviadasPageModule {}
