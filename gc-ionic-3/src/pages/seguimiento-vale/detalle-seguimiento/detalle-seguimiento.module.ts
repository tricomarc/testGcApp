import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleSeguimientoPage } from './detalle-seguimiento';

@NgModule({
  declarations: [
    DetalleSeguimientoPage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleSeguimientoPage),
  ],
})
export class DetalleSeguimientoPageModule {}
