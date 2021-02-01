import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {EquipoComponent} from './equipo';

@NgModule({
    declarations: [
        EquipoComponent
    ],
    imports: [
        IonicPageModule.forChild(EquipoComponent),
    ],
    exports: [
        EquipoComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class EquipoComponentModule {
}
