import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LeanPage } from './lean';

@NgModule({
  declarations: [
    LeanPage,
  ],
  imports: [
    IonicPageModule.forChild(LeanPage),
  ],
})
export class LeanPageModule {}
