import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { RankingVisualPage } from './ranking-visual';
import { BranchOfficeUsers } from './branch-office-users/branch-office-users';

import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { IonicSelectableModule } from 'ionic-selectable';

@NgModule({
	declarations: [
		RankingVisualPage,
		BranchOfficeUsers
	],
	imports: [
		IonicPageModule.forChild(RankingVisualPage),
		RoundProgressModule,
		IonicSelectableModule
	],
	exports: [BranchOfficeUsers],
	entryComponents: [BranchOfficeUsers]
})
export class RankingVisualPageModule { }
