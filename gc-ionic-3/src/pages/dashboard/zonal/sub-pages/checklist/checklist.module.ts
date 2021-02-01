import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChecklistDetailsPage } from './checklist';

import { IonicSelectableModule } from 'ionic-selectable';

import { ComponentsModule } from '../../../../../components/components.module';
import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        ChecklistDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(ChecklistDetailsPage),
        ComponentsModule,
        IonicSelectableModule,
        PipesModule
    ],
    exports: [
        ChecklistDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ChecklistDetailsModule {}
