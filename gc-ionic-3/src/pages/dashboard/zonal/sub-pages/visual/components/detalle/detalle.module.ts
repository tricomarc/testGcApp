import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsVisualSubsidiaryPage } from './detalle';

import { IonicSelectableModule } from 'ionic-selectable';

@NgModule({
    declarations: [
        DetailsVisualSubsidiaryPage
    ],
    imports: [
        IonicPageModule.forChild(DetailsVisualSubsidiaryPage),
        IonicSelectableModule
    ],
    exports: [
        DetailsVisualSubsidiaryPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class DetailsVisualSubsidiaryModule {}
