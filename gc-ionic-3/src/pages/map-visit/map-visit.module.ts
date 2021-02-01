import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MapVisitPage } from './map-visit';

import { MapComponentsModule } from './components/map-components.module';

import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
	declarations: [
		MapVisitPage
	],
	imports: [
		IonicPageModule.forChild(MapVisitPage),
		MapComponentsModule,
		PipesModule
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class MapVisitPageModule { }
