import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisualHistoryPage } from './visual-history';



@NgModule({
	declarations: [
		VisualHistoryPage
	],
	imports: [
		IonicPageModule.forChild(VisualHistoryPage)
	]
})
export class VisualHistoryPageModule { }
