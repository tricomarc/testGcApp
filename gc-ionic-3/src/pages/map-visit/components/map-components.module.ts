import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from "ionic-angular";
import { IonicSelectableModule } from 'ionic-selectable';

import { ComponentsModule } from '../../../components/components.module';

import { AlertsComponent } from './alerts/alerts';
import { ZonalPositionComponent } from './zonal-position/zonal-position';
import { VisitHistoricalComponent } from './visit-historical/visit-historical';
import { VisitDetailComponent } from './visit-detail/visit-detail';
import { CreateStoreComponent } from './create-store/create-store';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
	declarations: [
		AlertsComponent,
		ZonalPositionComponent,
		VisitHistoricalComponent,
		VisitDetailComponent,
		CreateStoreComponent
	],
	imports: [
		IonicModule,
		IonicSelectableModule,
		ComponentsModule,
		PipesModule
	],
	exports: [
		AlertsComponent,
		ZonalPositionComponent,
		VisitHistoricalComponent,
		VisitDetailComponent,
		CreateStoreComponent
	],
	entryComponents: [
		AlertsComponent,
		ZonalPositionComponent,
		VisitHistoricalComponent,
		VisitDetailComponent,
		CreateStoreComponent
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class MapComponentsModule {

}
