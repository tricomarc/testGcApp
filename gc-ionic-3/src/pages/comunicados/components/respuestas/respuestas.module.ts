import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {RespuestasComponent} from './respuestas';

@NgModule({
    declarations: [
        RespuestasComponent
    ],
    imports: [
        IonicPageModule.forChild(RespuestasComponent),
    ],
    exports: [
        RespuestasComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class RespuestasComponentModule {
}
