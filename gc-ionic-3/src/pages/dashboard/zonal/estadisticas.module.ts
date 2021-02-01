import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EstadisticasPage } from './estadisticas';

import { IonicSelectableModule } from 'ionic-selectable';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { ComponentsModule } from '../../../components/components.module';
import { PipesModule } from '../../../pipes/pipes.module';


@NgModule({
    declarations: [
        EstadisticasPage
    ],
    imports: [
        IonicPageModule.forChild(EstadisticasPage),
        ComponentsModule,
        IonicSelectableModule,
        RoundProgressModule,
        PipesModule
    ],
    exports: [
        EstadisticasPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class EstadisticasModule { }
