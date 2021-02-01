import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ChecklistsBranchOfficePage } from './checklists-branch-office';
import { ChecklistsComponentsModule } from '../components/checklists-components.module';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
	declarations: [
		ChecklistsBranchOfficePage
	],
	imports: [
		IonicPageModule.forChild(ChecklistsBranchOfficePage),
		ChecklistsComponentsModule,
		PipesModule
	]
})
export class ChecklistsBranchOfficePageModule { }
