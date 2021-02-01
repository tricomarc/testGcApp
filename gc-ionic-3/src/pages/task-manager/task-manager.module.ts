import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { TaskManagerPage } from './task-manager';

import { TaskSelectionComponent } from './components/task-selection/task-selection';
import { TaskInformationComponent } from './components/task-information/task-information';
import { TaskConfirmationComponent } from './components/task-confirmation/task-confirmation';
import { TaskAssignmentComponent } from './components/task-assignment/task-assignment';
import { TaskScheduleComponent } from './components/task-schedule/task-schedule';
import { TaskUsersComponent } from './components/task-users/task-users';
import { TaskTdaComponent } from './components/task-tda/task-tda';
import { TaskHomeComponent } from './components/task-home/task-home';
import { TaskStatsComponent } from './components/task-stats/task-stats';
import { TaskExtraComponent } from './components/task-extra/task-extra';
import { TaskResolutionComponent } from './components/task-resolution/task-resolution';
import { StatsSummaryComponent } from './components/stats-summary/stats-summary';
import { TaskProgressComponent } from './components/task-progress/task-progress';
import { TaskAssignmentListComponent } from './components/task-assignment-list/task-assignment-list';

import { ComponentsModule } from '../../components/components.module';
import { IonicSelectableModule } from 'ionic-selectable';
import { TaskSelectionTypeComponent } from './components/task-selection-type/task-selection-type';
import { TaskEmailComponent } from './components/task-email/task-email';

@NgModule({
  declarations: [
    TaskManagerPage,
    TaskSelectionComponent,
    TaskInformationComponent,
    TaskConfirmationComponent,
    TaskAssignmentComponent,
    TaskScheduleComponent,
    TaskUsersComponent,
    TaskTdaComponent,
    TaskHomeComponent,
    TaskStatsComponent,
    TaskExtraComponent,
    TaskResolutionComponent,
    StatsSummaryComponent,
    TaskProgressComponent,
    TaskAssignmentListComponent,
    TaskSelectionTypeComponent,
    TaskEmailComponent
  ],
  imports: [
    IonicPageModule.forChild(TaskManagerPage),
    Ng2GoogleChartsModule,
    RoundProgressModule,
    IonicSelectableModule,
    ComponentsModule
  ],
  exports: [
    StatsSummaryComponent
  ],
  entryComponents: [
    TaskSelectionComponent,
    TaskInformationComponent,
    TaskConfirmationComponent,
    TaskAssignmentComponent,
    TaskScheduleComponent,
    TaskUsersComponent,
    TaskTdaComponent,
    TaskHomeComponent,
    TaskStatsComponent,
    TaskExtraComponent,
    TaskResolutionComponent,
    StatsSummaryComponent,
    TaskProgressComponent,
    TaskAssignmentListComponent,
    TaskSelectionTypeComponent,
    TaskEmailComponent
  ]
})
export class TaskManagerPageModule {}
