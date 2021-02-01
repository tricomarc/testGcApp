import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {CuestionarioComponent} from './cuestionario';

@NgModule({
    declarations: [
        CuestionarioComponent
    ],
    imports: [
        IonicPageModule.forChild(CuestionarioComponent),
    ],
    exports: [
        CuestionarioComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class CuestionarioComponentModule {
}
