import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AmbitoPage } from './ambito';
import { PipesModule } from '../../../../pipes/pipes.module'

@NgModule({
	declarations: [
		AmbitoPage
	],
	imports: [
		IonicPageModule.forChild(AmbitoPage),
		PipesModule
	]
})
export class AmbitoPageModule { }
