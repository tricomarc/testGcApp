import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { UserDetailsComunicadosPage } from './user-details';

@NgModule({
    declarations: [
        UserDetailsComunicadosPage
    ],
    imports: [
        IonicPageModule.forChild(UserDetailsComunicadosPage)
    ],
    exports: [
        UserDetailsComunicadosPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class UserDetailsComunicadosModule { }
