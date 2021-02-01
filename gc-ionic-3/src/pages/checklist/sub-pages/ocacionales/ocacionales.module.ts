import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OcacionalesPage } from './ocacionales';

@NgModule({
  declarations: [
    OcacionalesPage,
  ],
  imports: [
    IonicPageModule.forChild(OcacionalesPage),
  ],
})
export class OcacionalesPageModule {}
