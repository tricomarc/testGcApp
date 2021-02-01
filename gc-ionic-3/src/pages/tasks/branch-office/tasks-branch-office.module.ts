import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TasksBranchOfficePage } from './tasks-branch-office';

@NgModule({
	declarations: [
		TasksBranchOfficePage,
	],
	imports: [
		IonicPageModule.forChild(TasksBranchOfficePage)
	]
})
export class TasksBranchOfficePageModule { }
