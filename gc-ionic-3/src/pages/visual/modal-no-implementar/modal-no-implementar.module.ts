import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ModalNoImplementarPage } from './modal-no-implementar';

@NgModule({
  declarations: [
    ModalNoImplementarPage,
  ],
  imports: [
    IonicPageModule.forChild(ModalNoImplementarPage),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ModalNoImplementarPageModule {}
