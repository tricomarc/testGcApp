import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GuardadosPage } from './guardados';

@NgModule({
  declarations: [
      GuardadosPage,
  ],
  imports: [
    IonicPageModule.forChild(GuardadosPage),
  ],
    exports: [
        GuardadosPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class GuardadosPageModule {}
