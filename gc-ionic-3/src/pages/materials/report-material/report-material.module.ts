import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReportMaterialPage } from './report-material';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
	declarations: [
		ReportMaterialPage,
	],
	imports: [
		IonicPageModule.forChild(ReportMaterialPage),
		PipesModule
	]
})
export class ReportMaterialPageModule { }
