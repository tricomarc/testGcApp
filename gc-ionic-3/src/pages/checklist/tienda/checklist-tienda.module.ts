import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChecklistTiendaPage } from './checklist-tienda';

@NgModule({
  declarations: [
      ChecklistTiendaPage,
  ],
  imports: [
    IonicPageModule.forChild(ChecklistTiendaPage),
  ],
    exports: [
        ChecklistTiendaPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ChecklistTiendaPageModule {}
