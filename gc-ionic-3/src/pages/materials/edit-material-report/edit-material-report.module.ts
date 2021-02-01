import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EditMaterialReportPage } from './edit-material-report';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    EditMaterialReportPage,
  ],
  imports: [
    IonicPageModule.forChild(EditMaterialReportPage),
    PipesModule
  ]
})
export class EditMaterialReportPageModule {}
