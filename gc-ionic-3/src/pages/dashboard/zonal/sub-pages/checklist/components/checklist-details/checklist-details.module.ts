import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PipesModule } from '../../../../../../../pipes/pipes.module';
import { ChecklistDetailsChecklistPage } from './checklist-details';

@NgModule({
    declarations: [
        ChecklistDetailsChecklistPage
    ],
    imports: [
        IonicPageModule.forChild(ChecklistDetailsChecklistPage),
        PipesModule
    ],
    exports: [
        ChecklistDetailsChecklistPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ChecklistDetailsChecklistPageModule {}
