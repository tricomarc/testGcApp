import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisualPage } from './visual';

@NgModule({
	declarations: [
		VisualPage,
	],
	imports: [
		IonicPageModule.forChild(VisualPage)
	]
})
export class VisualPageModule { }
