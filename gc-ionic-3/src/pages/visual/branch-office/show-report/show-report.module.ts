import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShowReportPage } from './show-report';

import { LongPressModule } from 'ionic-long-press';

/* VIDEO PLAYER */
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
	declarations: [
		ShowReportPage,
	],
	imports: [
		IonicPageModule.forChild(ShowReportPage),
		/* VIDEO PLAYER */
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,

		LongPressModule,
		PipesModule
	]
})
export class ShowReportPageModule { }
