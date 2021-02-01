import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SolutionsPage } from './solutions';

@NgModule({
	declarations: [
		SolutionsPage
	],
	imports: [
		IonicPageModule.forChild(SolutionsPage),
	],
})
export class SolutionsPageModule { }
