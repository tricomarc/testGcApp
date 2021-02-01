import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsChecklistSubsidiaryPage } from './detalle';

import { IonicSelectableModule } from 'ionic-selectable';

import { ComponentsModule } from '../../../../../../../components/components.module';
import { PipesModule } from '../../../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        DetailsChecklistSubsidiaryPage
    ],
    imports: [
        IonicPageModule.forChild(DetailsChecklistSubsidiaryPage),
        IonicSelectableModule,
        ComponentsModule,
        PipesModule
    ],
    exports: [
        DetailsChecklistSubsidiaryPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class DetailsChecklistSubsidiaryModule {}
