import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA, LOCALE_ID} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {AsignacionPage} from "./asignacion";
import {NgCalendarModule} from 'ionic2-calendar';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-CL';
registerLocaleData(localeEs);

@NgModule({
    declarations: [
        AsignacionPage,
    ],
    imports: [
        IonicPageModule.forChild(AsignacionPage),
        NgCalendarModule
    ],
    providers: [
        { provide: LOCALE_ID, useValue: 'es-CL' }
    ],
    exports: [
        AsignacionPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class AsignacionPageModule {
}
