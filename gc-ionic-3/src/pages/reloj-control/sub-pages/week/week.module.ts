import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {WeekPage} from "./week";

@NgModule({
  declarations: [
      WeekPage,
  ],
  imports: [
    IonicPageModule.forChild(WeekPage),
  ],
    exports: [
        WeekPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class WeekPageModule {}
