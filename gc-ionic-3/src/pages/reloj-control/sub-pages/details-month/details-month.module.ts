import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {DetailsMonthPage} from "./details-month";

@NgModule({
  declarations: [
      DetailsMonthPage,
  ],
  imports: [
    IonicPageModule.forChild(DetailsMonthPage),
  ],
    exports: [
        DetailsMonthPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class DetailsMonthPageModule {}
