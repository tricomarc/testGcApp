import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {PhotoAccessPage} from "./photo-access";

@NgModule({
  declarations: [
      PhotoAccessPage,
  ],
  imports: [
    IonicPageModule.forChild(PhotoAccessPage),
  ],
    exports: [
        PhotoAccessPage
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ]
})
export class PhotoAccessPageModule {}
