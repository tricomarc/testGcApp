import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChecklistZonalPage } from './checklist-zonal';
import { ChecklistTiendaZonalComponent } from './components/tiendas/tiendas';
import { ChecklistPropiosZonalComponent } from './components/propios/propios';

@NgModule({
  declarations: [
    ChecklistZonalPage,
    ChecklistTiendaZonalComponent,
    ChecklistPropiosZonalComponent
  ],
  imports: [
    IonicPageModule.forChild(ChecklistZonalPage),
  ],
  exports: [
    ChecklistZonalPage,
    ChecklistTiendaZonalComponent,
    ChecklistPropiosZonalComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ChecklistZonalPageModule { }
