import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { KpiColgramPage } from './kpi-colgram';

@NgModule({
	declarations: [
		KpiColgramPage,
	],
	imports: [
		IonicPageModule.forChild(KpiColgramPage),
		Ng2GoogleChartsModule
	]
})
export class KpiColgramPageModule { }
