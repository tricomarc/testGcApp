import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { KpiRipleyPage } from './kpi-ripley';
import { AreaDetailRipleyPage } from '../ripley/area-detail-ripley/area-detail-ripley';
import { IndicatorDepartmentsRipleyPage } from '../ripley/indicator-departments-ripley/indicator-departments-ripley';
import { IndicatorDetailRipleyPage } from '../ripley/indicator-detail-ripley/indicator-detail-ripley';
import { KpiComponentsModule } from '../../components/kpi-components.module';

import { PipesModule } from '../../../../pipes/pipes.module';

import { IonicSelectableModule } from 'ionic-selectable';

@NgModule({
	declarations: [
		KpiRipleyPage,
		AreaDetailRipleyPage,
		IndicatorDepartmentsRipleyPage,
		IndicatorDetailRipleyPage
	],
	imports: [
		IonicPageModule.forChild(KpiRipleyPage),
		Ng2GoogleChartsModule,
		PipesModule,
		IonicSelectableModule,
		KpiComponentsModule
	],
	entryComponents: [
		AreaDetailRipleyPage,
		IndicatorDepartmentsRipleyPage,
		IndicatorDetailRipleyPage
	]
})
export class KpiRipleyPageModule { }
