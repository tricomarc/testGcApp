import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LocalesAsociadosPage } from './locales-asociados';

@NgModule({
  declarations: [
    LocalesAsociadosPage,
  ],
  imports: [
    IonicPageModule.forChild(LocalesAsociadosPage),
  ],
})
export class LocalesAsociadosPageModule {}
