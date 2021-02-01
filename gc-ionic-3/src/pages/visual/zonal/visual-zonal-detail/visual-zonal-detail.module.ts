import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisualZonalDetailPage } from './visual-zonal-detail';

import { LongPressModule } from 'ionic-long-press';

/* VIDEO PLAYER */
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
	declarations: [
		VisualZonalDetailPage,
	],
	imports: [
		IonicPageModule.forChild(VisualZonalDetailPage),
		/* VIDEO PLAYER */
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,

		LongPressModule,
		PipesModule
	]
})
export class VisualZonalDetailPageModule { }
