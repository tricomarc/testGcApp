import {ApplicationRef, Component, Input} from '@angular/core';
import {PreguntasChecklistDirectiveComponent} from '../preguntas-checklist-directive/preguntas-checklist-directive';
import * as _ from 'lodash';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Generated class for the CheckboxChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'checkbox-checklist-directive',
    templateUrl: 'checkbox-checklist-directive.html'
})
export class CheckboxChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() public isTask: boolean;
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;
    @Input() ambitState: BehaviorSubject<any>;

    constructor(
        private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent,
        private applicationRef: ApplicationRef) {
    }

    ngOnInit() {
    }

    /**
     * Valida y envia a LimpiarAlternativasCheckbox disponible en Detalle.ts
     * @param alternativas
     * @param alternativa
     */
    limpiarAlternativasCheckbox2(alternativas, alternativa) {
        if ((!_.isUndefined(alternativas)) && (!_.isNull(alternativas)) && (!_.isUndefined(alternativa)) && (!_.isNull(alternativa))) {
            this.preguntasChecklistDirectiveComponent.LimpiarAlternativasCheckbox(alternativas, alternativa)
        }
    }

    updateSelect(select, ev) {
        this.applicationRef.tick();
        if(this.ambitState) this.ambitState.next(true);
    }

}
