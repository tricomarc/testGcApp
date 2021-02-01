import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TareaDetailsPage } from './tarea';

@NgModule({
    declarations: [
        TareaDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(TareaDetailsPage),
    ],
    exports: [
        TareaDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class TareaDetailsModule {}
