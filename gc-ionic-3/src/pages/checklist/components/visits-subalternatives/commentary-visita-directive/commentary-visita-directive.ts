import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {PreguntasChecklistDirectiveComponent} from "../../preguntas-checklist-directive/preguntas-checklist-directive";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
/**
 * Generated class for the SubtextVisitaDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'commentary-visita-directive',
  templateUrl: 'commentary-visita-directive.html'
})
export class CommentaryVisitaDirectiveComponent {

    @Input() pregunta: {};
    @Input() alternativa: {};
    @Input() ambitState: BehaviorSubject<any>;

  constructor(private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent) {

  }

  onChange() {
		if(this.ambitState) this.ambitState.next(true);
	}

}
