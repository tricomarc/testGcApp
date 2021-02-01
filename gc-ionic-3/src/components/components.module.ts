
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule } from "ionic-angular";
import { CommonModule } from "@angular/common";

/* VIDEO PLAYER */
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { PdfViewerModule } from 'ng2-pdf-viewer';

import { DetallePageModule } from '../pages/checklist/sub-pages/detalle/detalle.module';

import { DateFilterComponent } from './date-filter/date-filter';
import { CustomToast } from './custom-toast/custom-toast';

import { PopoverNotificationsComponent } from './popover-notifications/popover-notifications';
import { PipesModule } from '../pipes/pipes.module';
import { SignatureViewerComponent } from './signature-viewer/signature-viewer';
import { PopoverMultiselectComponent } from './popover-multiselect/popover-multiselect';



@NgModule({
	declarations: [
		DateFilterComponent,
		CustomToast,
		PopoverNotificationsComponent,
		SignatureViewerComponent,
		PopoverMultiselectComponent,
	],
	imports: [
		CommonModule,
		DetallePageModule,

		/* VIDEO PLAYER */
		VgCoreModule,
		VgControlsModule,
		VgOverlayPlayModule,
		VgBufferingModule,
		IonicModule,
		PipesModule,
		PdfViewerModule
	],
	exports: [
		DetallePageModule,
		DateFilterComponent,
		CustomToast,
		SignatureViewerComponent,
	],
	entryComponents: [
		DateFilterComponent,
		CustomToast,
		PopoverMultiselectComponent,
		PopoverNotificationsComponent
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ComponentsModule {

}
