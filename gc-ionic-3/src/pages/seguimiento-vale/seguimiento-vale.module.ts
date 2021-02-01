import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SeguimientoValePage } from './seguimiento-vale';

@NgModule({
  declarations: [
    SeguimientoValePage,
  ],
  imports: [
    IonicPageModule.forChild(SeguimientoValePage),
  ],
})
export class SeguimientoValePageModule {}
