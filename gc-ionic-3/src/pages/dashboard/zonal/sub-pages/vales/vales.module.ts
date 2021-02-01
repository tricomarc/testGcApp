import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ValesDetailsPage } from './vales';

@NgModule({
    declarations: [
        ValesDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(ValesDetailsPage),
    ],
    exports: [
        ValesDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class ValesDetailsModule {}
