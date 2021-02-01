import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {DetallePage} from '../../sub-pages/detalle/detalle';
import {Storage} from "@ionic/storage";
import {UtilProvider} from "../../../../shared/providers/util/util";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Generated class for the PreguntasChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'preguntas-checklist-directive',
    templateUrl: 'preguntas-checklist-directive.html'
})
export class PreguntasChecklistDirectiveComponent {

    @Input() public pregunta: any = {};
    @Input() public checklistEnviado: boolean;
    @Input() public fromStats: boolean;
    @Input() public isTask: boolean;
    @Input() public limpiarAlternativasRadio: Function;
    @Input() public limpiarAlternativasCheckbox: Function;
    @Input() public tomarFoto: Function;
    @Input() public tomarFotoObligatoria: Function;
    @Input() public subPregunta: boolean;

    @Input() public thisSession = {};

    @Input() ambitState: BehaviorSubject<any>;

    constructor(
        private detalle: DetallePage,
        private storage: Storage,
        private util: UtilProvider) {

    }

    ngOnInit() {
    }

    /**
     * Limpia checkbox desde vista Detalle
     * @param alternativas
     * @param alternativa
     * @constructor
     */
    LimpiarAlternativasCheckbox(alternativas, alternativa) {
        this.detalle.limpiarAlternativasCheckbox(alternativas, alternativa, null)
    }

    /**
     * Limpia radio desde vista Detalle
     * @param alternativas
     * 
     * @param alternativa
     * @constructor
     */
    LimpiarAlternativasRadio(alternativas, alternativa, from) {
        this.detalle.limpiarAlternativasRadio(alternativas, alternativa, from, null)
    }


    /**
     * Selección de boton Aplica, se agrega la validación a la pregunta
     */
    apply() {
        
        if(this.ambitState) this.ambitState.next(true);

        this.pregunta['hasApply'] = true;
    }

    /**
     * Selección de boton No Aplica, se agrega la validación a la pregunta
     */
    dontApply() {

        if(this.ambitState) this.ambitState.next(true);


        this.pregunta['hasApply'] = false;
        if (this.pregunta['tipo_id'] == 1 || this.pregunta['tipo_id'] == 2) {
            _.forEach(this.pregunta['alternativas'], (alt) => {
                alt.checked = false;
            });
        }
    }

    /**
     * Reinicia funcionalidad de aplica
     */
    async resetApply() {

        if(this.ambitState) this.ambitState.next(true);


        this.thisSession = await this.util.getInternalSession();

        this.pregunta['hasApply'] = undefined;
        //delete this.pregunta['hasApply'];
        _.forEach(this.pregunta['alternativas'], (alt) => {
            alt.checked = false;
            if (!_.isUndefined(alt.foto) || !_.isNull(alt.foto)) alt.foto = undefined;
        });

        if (!_.isUndefined(this.pregunta['respuesta']) && !_.isNull(this.pregunta['respuesta']) && !_.isUndefined(this.pregunta['respuesta'].foto) && !_.isNull(this.pregunta['respuesta'].foto) && this.pregunta['respuesta'].foto.length > 0) this.pregunta['respuesta'].foto = [];

        if (this.pregunta['tipo_id'] == 1) {
            this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then((val) => {

                /* alternativa_peso: 50
                 ambito_id: 1
                 comentario: 0
                 comentarios: null
                 modified: true
                 nombre_alternativa: 50
                 nombre_pregunta: "Radio 3 A - N/A"
                 pregunta_alternativa_id: 0
                 pregunta_id: 12
                 respuesta_alternativa_id: 20
                 texto_adicional: ""
                 texto_respuesta: ""
                 tipo_id: 1
                 visita_id: "local-1553862894831"*/

                let visit = JSON.parse(val);
                let resp = _.find(visit['respuestas'], {pregunta_id: this.pregunta['id']});
                if (!_.isNull(resp) || !_.isUndefined(resp)) {
                    let position = _.indexOf(visit['respuestas'], resp);
                    if (position > -1) visit['respuestas'].splice(position, 1);

                    this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(visit));
                }
            });
        }
    }

}
