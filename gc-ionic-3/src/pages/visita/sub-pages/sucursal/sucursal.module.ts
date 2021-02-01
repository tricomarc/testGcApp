import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VisitaSucursalPage } from './sucursal';

@NgModule({
  declarations: [
      VisitaSucursalPage,
  ],
  imports: [
    IonicPageModule.forChild(VisitaSucursalPage),
  ],
})
export class VisitaSucursalPageModule {}
