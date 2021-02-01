import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from "ionic-angular";

import { AreaBoxComponent } from './area-box/area-box';
import { IndicatorBoxComponent } from './indicator-box/indicator-box';
import { RankingKpiPage, Filter } from './ranking/ranking';

@NgModule({
	declarations: [
		AreaBoxComponent,
		IndicatorBoxComponent,
		RankingKpiPage,
		Filter
	],
	imports: [
		IonicModule
	],
	exports: [
		AreaBoxComponent,
		IndicatorBoxComponent,
		RankingKpiPage,
		Filter
	],
	entryComponents: [
		AreaBoxComponent,
		IndicatorBoxComponent,
		RankingKpiPage,
		Filter
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class KpiComponentsModule {

}
