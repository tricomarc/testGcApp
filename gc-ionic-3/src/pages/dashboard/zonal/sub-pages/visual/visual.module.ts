import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisualDetailsPage } from './visual';

import { IonicSelectableModule } from 'ionic-selectable';
import { ComponentsModule } from '../../../../../components/components.module';
import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        VisualDetailsPage
    ],
    imports: [
        IonicPageModule.forChild(VisualDetailsPage),
        IonicSelectableModule,
        ComponentsModule,
        PipesModule
    ],
    exports: [
        VisualDetailsPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class VisualDetailsModule {}
