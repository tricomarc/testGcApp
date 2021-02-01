import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IncidentsBranchOfficePage } from './incidents-branch-office';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
	declarations: [
		IncidentsBranchOfficePage,
	],
	imports: [
		IonicPageModule.forChild(IncidentsBranchOfficePage),
		PipesModule
	],
})
export class IncidentsBranchOfficePageModule { }
