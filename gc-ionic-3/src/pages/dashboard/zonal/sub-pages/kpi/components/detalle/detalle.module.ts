import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsKpiSubsidiaryPage } from './detalle';

@NgModule({
    declarations: [
        DetailsKpiSubsidiaryPage
    ],
    imports: [
        IonicPageModule.forChild(DetailsKpiSubsidiaryPage)
    ],
    exports: [
        DetailsKpiSubsidiaryPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class DetailsKpiSubsidiaryModule {}
