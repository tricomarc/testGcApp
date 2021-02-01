import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PreguntasChecklistDirectiveComponent } from './preguntas-checklist-directive';
import { NumericChecklistDirectiveComponent } from "../numeric-checklist-directive/numeric-checklist-directive";
import { RadioChecklistDirectiveComponent } from "../radio-checklist-directive/radio-checklist-directive";
import { PorcentajeChecklistDirectiveComponent } from "../porcentaje-checklist-directive/porcentaje-checklist-directive";
import { TextoChecklistDirectiveComponent } from "../texto-checklist-directive/texto-checklist-directive";
import { FotoChecklistDirectiveComponent } from "../foto-checklist-directive/foto-checklist-directive";
import { MessageChecklistDirectiveComponent } from "../message-checklist-directive/message-checklist-directive";
import { IncidenciaChecklistDirectiveComponent } from "../incidencia-checklist-directive/incidencia-checklist-directive";
import { NotificacionChecklistDirectiveComponent } from "../notificacion-checklist-directive/notificacion-checklist-directive";
import { DateChecklistDirectiveComponent } from "../date-checklist-directive/date-checklist-directive";
import { CheckboxChecklistDirectiveComponent } from "../checkbox-checklist-directive/checkbox-checklist-directive";
import { FotoObligatoriaChecklistDirectiveComponent } from "../foto-obligatoria-checklist-directive/foto-obligatoria-checklist-directive";
import { PipesModule } from '../../../../pipes/pipes.module'
//Subpreguntas para visitas
import { SubalertVisitaDirectiveComponent } from "../visits-subalternatives/subalert-visita-directive/subalert-visita-directive";
import { SubcheckboxVisitaDirectiveComponent } from "../visits-subalternatives/subcheckbox-visita-directive/subcheckbox-visita-directive";
import { SubfotoVisitaDirectiveComponent } from "../visits-subalternatives/subfoto-visita-directive/subfoto-visita-directive";
import { SubradioVisitaDirectiveComponent } from "../visits-subalternatives/subradio-visita-directive/subradio-visita-directive";
import { SubtextVisitaDirectiveComponent } from "../visits-subalternatives/subtext-visita-directive/subtext-visita-directive";
import { CommentaryVisitaDirectiveComponent } from "../visits-subalternatives/commentary-visita-directive/commentary-visita-directive";

import { PreguntasIncompletasComponent } from '../preguntas-incompletas/preguntas-incompletas';
import { SucursalesModalComponent } from '../sucursales-modal/sucursales-modal';


@NgModule({

    declarations: [
        PreguntasChecklistDirectiveComponent,
        DateChecklistDirectiveComponent,
        NumericChecklistDirectiveComponent,
        MessageChecklistDirectiveComponent,
        FotoObligatoriaChecklistDirectiveComponent,
        CheckboxChecklistDirectiveComponent,
        FotoChecklistDirectiveComponent,
        IncidenciaChecklistDirectiveComponent,
        NotificacionChecklistDirectiveComponent,
        PorcentajeChecklistDirectiveComponent,
        RadioChecklistDirectiveComponent,
        TextoChecklistDirectiveComponent,
        SubalertVisitaDirectiveComponent,
        SubcheckboxVisitaDirectiveComponent,
        SubfotoVisitaDirectiveComponent,
        SubradioVisitaDirectiveComponent,
        SubtextVisitaDirectiveComponent,
        CommentaryVisitaDirectiveComponent,
        PreguntasIncompletasComponent, SucursalesModalComponent],
    imports: [
        IonicPageModule.forChild(PreguntasChecklistDirectiveComponent),
        PipesModule
    ],
    exports: [
        PreguntasChecklistDirectiveComponent,
        DateChecklistDirectiveComponent,
        NumericChecklistDirectiveComponent,
        MessageChecklistDirectiveComponent,
        FotoObligatoriaChecklistDirectiveComponent,
        CheckboxChecklistDirectiveComponent,
        FotoChecklistDirectiveComponent,
        IncidenciaChecklistDirectiveComponent,
        NotificacionChecklistDirectiveComponent,
        PorcentajeChecklistDirectiveComponent,
        RadioChecklistDirectiveComponent,
        TextoChecklistDirectiveComponent,
        SubalertVisitaDirectiveComponent,
        SubcheckboxVisitaDirectiveComponent,
        SubfotoVisitaDirectiveComponent,
        SubradioVisitaDirectiveComponent,
        SubtextVisitaDirectiveComponent,
        CommentaryVisitaDirectiveComponent,
        PreguntasIncompletasComponent, SucursalesModalComponent],
        entryComponents: [PreguntasIncompletasComponent, SucursalesModalComponent]
})
export class PreguntasChecklistPageModule {

}
