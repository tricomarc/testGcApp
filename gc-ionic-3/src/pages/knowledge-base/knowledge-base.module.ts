import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { KnowledgeBasePage } from './knowledge-base';

@NgModule({
	declarations: [
		KnowledgeBasePage
	],
	imports: [
		IonicPageModule.forChild(KnowledgeBasePage),
	],
})
export class KnowledgeBasePageModule { }
