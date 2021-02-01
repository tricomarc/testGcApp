import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaterialDetailPage } from './material-detail';

import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
  declarations: [
    MaterialDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(MaterialDetailPage),
    PipesModule
  ]
})
export class MaterialDetailPageModule {}
