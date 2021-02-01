import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsComunicadosSubsidiaryPage } from './detalle';

import { ComponentsModule } from '../../../../../../../components/components.module';
import { PipesModule } from '../../../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        DetailsComunicadosSubsidiaryPage
    ],
    imports: [
        IonicPageModule.forChild(DetailsComunicadosSubsidiaryPage),
        ComponentsModule,
        PipesModule
    ],
    exports: [
        DetailsComunicadosSubsidiaryPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class DetailsComunicadosSubsidiaryModule { }
