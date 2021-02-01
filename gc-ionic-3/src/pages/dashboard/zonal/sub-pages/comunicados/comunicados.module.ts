import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ComunicadosDetailsPage } from './comunicados';

import { IonicSelectableModule } from 'ionic-selectable';

import { ComponentsModule } from '../../../../../components/components.module';
import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        ComunicadosDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(ComunicadosDetailsPage),
        IonicSelectableModule,
        ComponentsModule,
        PipesModule
    ],
    exports: [
        ComunicadosDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ComunicadosDetailsModule {}
