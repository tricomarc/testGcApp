import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {PreguntasChecklistDirectiveComponent} from "../preguntas-checklist-directive/preguntas-checklist-directive";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
/**
 * Generated class for the TextoChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'texto-checklist-directive',
  templateUrl: 'texto-checklist-directive.html'
})
export class TextoChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() public isTask: boolean;
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;
    @Input() ambitState: BehaviorSubject<any>;

  constructor(private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent) {
  }

  onChange() {
		if(this.ambitState) this.ambitState.next(true);
	}

}
