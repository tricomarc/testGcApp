import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ComunicadosTiendaPage} from './comunicados-tienda';
import {ComunicadoComponentModule} from '../components/comunicado/comunicado.module';
import {CuestionarioComponentModule} from '../components/cuestionario/cuestionario.module';
import {EquipoComponentModule} from '../components/equipo/equipo.module';
import {RespuestasComponentModule} from '../components/respuestas/respuestas.module';
import { PipesModule } from '../../../pipes/pipes.module';

@NgModule({
    declarations: [
        ComunicadosTiendaPage
    ],
    imports: [
        IonicPageModule.forChild(ComunicadosTiendaPage),
        ComunicadoComponentModule,
        CuestionarioComponentModule,
        EquipoComponentModule,
        RespuestasComponentModule,
        PipesModule
    ],
    exports: [
        ComunicadosTiendaPage,
        ComunicadoComponentModule,
        CuestionarioComponentModule,
        EquipoComponentModule,
        RespuestasComponentModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ComunicadosTiendaPageModule {
}
