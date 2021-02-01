import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SecurityQuestionPage } from './security-question';

@NgModule({
  declarations: [
    SecurityQuestionPage,
  ],
  imports: [
    IonicPageModule.forChild(SecurityQuestionPage),
  ],
})
export class SecurityQuestionPageModule {}
