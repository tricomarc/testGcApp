import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {PreguntasChecklistDirectiveComponent} from "../../preguntas-checklist-directive/preguntas-checklist-directive";
import {DetallePage} from "../../../sub-pages/detalle/detalle";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
/**
 * Generated class for the SubradioVisitaDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'subradio-visita-directive',
    templateUrl: 'subradio-visita-directive.html'
})
export class SubradioVisitaDirectiveComponent {

    @Input() alternativa: {};
    @Input() checklistEnviado: boolean;
    @Input() ambitState: BehaviorSubject<any>;

    constructor(
        private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent,
        private detalle: DetallePage) {
    }

    /**
     * Valida y envia a limpiarAlternativasRadio disponible en Detalle.ts
     * @param alternativas
     * @param alternativa
     */
    limpiarAlternativasRadio2(alternativas, alternativa, from) {
        if (from == "checklist") {
            if ((!_.isUndefined(alternativas)) && (!_.isNull(alternativas)) && (!_.isUndefined(alternativa)) && (!_.isNull(alternativa))) {
                alternativa.respuesta.alternativa_id = alternativa.id;
                alternativa.respuesta.checked = true;

                if (!_.isNull(alternativa.subPregunta)) {
                    this.preguntasChecklistDirectiveComponent.limpiarAlternativasRadio(alternativas, alternativa, from, alternativa.subPregunta)
                } else {
                    this.detalle.limpiarAlternativasRadio(alternativas, alternativa, from, null)
                }
            }
        } else if (from == "visita") {
            if ((!_.isUndefined(alternativas)) && (!_.isNull(alternativas)) && (!_.isUndefined(alternativa)) && (!_.isNull(alternativa))) {
                alternativa.checked = true;
                if (!_.isNull(alternativa.tipo_id)) {
                    alternativa.texto_adicional = "";
                }
                if (!_.isNull(alternativa.subPregunta)) {
                    this.preguntasChecklistDirectiveComponent.limpiarAlternativasRadio(alternativas, alternativa, from, alternativa.subPregunta)
                } else {
                    this.preguntasChecklistDirectiveComponent.limpiarAlternativasRadio(alternativas, alternativa, from)
                }
            }
        } else if (from == "task") {
            if ((!_.isUndefined(alternativas)) && (!_.isNull(alternativas)) && (!_.isUndefined(alternativa)) && (!_.isNull(alternativa))) {
                _.forEach(alternativas, function (ans) {
                    ans.checked = false;
                });
                alternativa.checked = true;
            }
        }
    }

    onChange() {
        if(this.ambitState) this.ambitState.next(true);
    }
}
