import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FilesPage } from './files';
import { MecanicFolderComponent } from './components/mecanic-folder/mecanic-folder';

@NgModule({
	declarations: [
		FilesPage,
		MecanicFolderComponent
	],
	imports: [
		IonicPageModule.forChild(FilesPage)
	],
	entryComponents: [MecanicFolderComponent],
	exports: [MecanicFolderComponent]
})
export class FilesPageModule { }
