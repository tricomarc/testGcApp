import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { KpiDetailsPage } from './kpi';

@NgModule({
    declarations: [
        KpiDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(KpiDetailsPage),
    ],
    exports: [
        KpiDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class KpiDetailsModule {}
