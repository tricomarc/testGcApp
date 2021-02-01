import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ComunicadosZonalPage} from './comunicados-zonal';
import {ComunicadosTiendaZonalComponent} from './components/tiendas/tiendas';
import {ComunicadosPropiosZonalComponent} from './components/propios/propios';

@NgModule({
    declarations: [
        ComunicadosZonalPage,
        ComunicadosTiendaZonalComponent,
        ComunicadosPropiosZonalComponent
    ],
    imports: [
        IonicPageModule.forChild(ComunicadosZonalPage)
    ],
    exports: [
        ComunicadosZonalPage,
        ComunicadosTiendaZonalComponent,
        ComunicadosPropiosZonalComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ComunicadosZonalPageModule {
}
