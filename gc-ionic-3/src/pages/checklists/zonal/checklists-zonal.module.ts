import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChecklistsZonalPage } from './checklists-zonal';

import { ChecklistsComponentsModule } from '../components/checklists-components.module';

@NgModule({
    declarations: [
        ChecklistsZonalPage
    ],
    imports: [
        IonicPageModule.forChild(ChecklistsZonalPage),
        ChecklistsComponentsModule
    ],
    exports: [
        ChecklistsZonalPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ChecklistsZonalPageModule { }
