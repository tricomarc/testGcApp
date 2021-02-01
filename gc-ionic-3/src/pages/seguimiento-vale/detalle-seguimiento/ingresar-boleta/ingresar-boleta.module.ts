import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IngresarBoletaPage } from './ingresar-boleta';

@NgModule({
  declarations: [
    IngresarBoletaPage,
  ],
  imports: [
    IonicPageModule.forChild(IngresarBoletaPage),
  ],
})
export class IngresarBoletaPageModule {}
