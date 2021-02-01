import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ModalLoginAsPage } from './modal-login-as';

@NgModule({
  declarations: [
    ModalLoginAsPage,
  ],
  imports: [
    IonicPageModule.forChild(ModalLoginAsPage),
  ],
})
export class ModalLoginAsPageModule {}
