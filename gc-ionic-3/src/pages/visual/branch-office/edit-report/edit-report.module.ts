import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EditReportPage } from './edit-report';

import { LongPressModule } from 'ionic-long-press';

/* VIDEO PLAYER */
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
	declarations: [
		EditReportPage,
	],
	imports: [
		IonicPageModule.forChild(EditReportPage),
		/* VIDEO PLAYER */
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,

		LongPressModule,
		PipesModule
	]
})
export class EditReportPageModule { }
