import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IncidenciasDetailsPage } from './incidencias';

import { BranchOfficeStatisticsIncidentDetailComponent } from './components/detail/incidents-statistics-branchoffice-detail';
import { OwnIncidentsComponent } from './components/own-incidents/own-incidents';

import { PipesModule } from '../../../../../pipes/pipes.module';

@NgModule({
    declarations: [
        IncidenciasDetailsPage,
        BranchOfficeStatisticsIncidentDetailComponent,
        OwnIncidentsComponent
    ],
    imports: [
        IonicPageModule.forChild(IncidenciasDetailsPage),
        PipesModule
    ],
    exports: [
        IncidenciasDetailsPage,
        BranchOfficeStatisticsIncidentDetailComponent,
        OwnIncidentsComponent
    ],
    entryComponents: [
        BranchOfficeStatisticsIncidentDetailComponent,
        OwnIncidentsComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class IncidenciasDetailsModule { }
