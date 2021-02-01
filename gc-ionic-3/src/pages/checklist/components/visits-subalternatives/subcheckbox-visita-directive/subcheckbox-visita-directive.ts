import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {PreguntasChecklistDirectiveComponent} from "../../preguntas-checklist-directive/preguntas-checklist-directive";
import {SubradioVisitaDirectiveComponent} from "../subradio-visita-directive/subradio-visita-directive";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
/**
 * Generated class for the SubcheckboxVisitaDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'subcheckbox-visita-directive',
  templateUrl: 'subcheckbox-visita-directive.html'
})
export class SubcheckboxVisitaDirectiveComponent {

    @Input() pregunta: {};
    @Input() checklistEnviado: boolean;
    @Input() ambitState: BehaviorSubject<any>;

  constructor(private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent) {

  }

  onChange() {
		if(this.ambitState) this.ambitState.next(true);
	}

}
