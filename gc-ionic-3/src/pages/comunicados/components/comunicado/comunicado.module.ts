import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ComunicadoComponent} from './comunicado';

import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        ComunicadoComponent
    ],
    imports: [
        IonicPageModule.forChild(ComunicadoComponent),
        PipesModule
    ],
    exports: [
        ComunicadoComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ComunicadoComponentModule {
}
