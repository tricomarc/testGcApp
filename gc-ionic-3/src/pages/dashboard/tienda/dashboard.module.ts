import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DashboardPage} from './dashboard';

import { PipesModule } from '../../../pipes/pipes.module';
import { TaskManagerPageModule } from '../../task-manager/task-manager.module';

@NgModule({
    declarations: [
        DashboardPage
    ],
    imports: [
        IonicPageModule.forChild(DashboardPage),
        PipesModule,
        TaskManagerPageModule
    ],
    exports: [
        DashboardPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class DashboardModule {
}
