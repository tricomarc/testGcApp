import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {Tareas1Page} from "./tareas1";
import {PipesModule} from '../../../../pipes/pipes.module'

@NgModule({
    declarations: [
        Tareas1Page,
    ],
    imports: [
        IonicPageModule.forChild(Tareas1Page),
        PipesModule
    ],
    exports: [
        Tareas1Page
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class Tareas1PageModule {
}
