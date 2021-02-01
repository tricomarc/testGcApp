import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ControlDetailsPage } from './control';

@NgModule({
    declarations: [
        ControlDetailsPage,
    ],
    imports: [
        IonicPageModule.forChild(ControlDetailsPage),
    ],
    exports: [
        ControlDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ControlDetailsModule {}
