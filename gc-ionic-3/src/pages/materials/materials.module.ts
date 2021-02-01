import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaterialsPage } from './materials';

import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    MaterialsPage,
  ],
  imports: [
    IonicPageModule.forChild(MaterialsPage),
    PipesModule
  ]
})
export class MaterialsPageModule {}
