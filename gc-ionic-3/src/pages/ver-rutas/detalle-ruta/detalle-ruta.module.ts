import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleRutaPage } from './detalle-ruta';

import { IonicSelectableModule } from 'ionic-selectable';

@NgModule({
  declarations: [
    DetalleRutaPage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleRutaPage),
    IonicSelectableModule
  ],
})
export class DetalleRutaPageModule {}
