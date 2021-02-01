import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { KpiTricotPage } from './kpi-tricot';
import { AreaDetailTricotPage } from './area-detail-tricot/area-detail-tricot';
import { IndicatorDetailTricotPage } from './indicator-detail-tricot/indicator-detail-tricot';

import { PipesModule } from '../../../../pipes/pipes.module';

import { KpiComponentsModule } from '../../components/kpi-components.module';

@NgModule({
	declarations: [
		KpiTricotPage,
		AreaDetailTricotPage,
		IndicatorDetailTricotPage
	],
	imports: [
		IonicPageModule.forChild(KpiTricotPage),
		Ng2GoogleChartsModule,
		PipesModule,
		KpiComponentsModule
	],
	entryComponents: [
		AreaDetailTricotPage,
		IndicatorDetailTricotPage
	]
})
export class KpiTricotPageModule { }
