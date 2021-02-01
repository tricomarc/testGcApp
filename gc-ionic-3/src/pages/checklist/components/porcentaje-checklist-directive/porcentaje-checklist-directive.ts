import {Component, Input} from '@angular/core';
import {PreguntasChecklistDirectiveComponent} from "../preguntas-checklist-directive/preguntas-checklist-directive";
import * as _ from 'lodash';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Generated class for the PorcentajeChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'porcentaje-checklist-directive',
  templateUrl: 'porcentaje-checklist-directive.html'
})
export class PorcentajeChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;
    @Input() ambitState: BehaviorSubject<any>;

  constructor(private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent) {

  }

  onChange() {
		if(this.ambitState) this.ambitState.next(true);
	}

}
