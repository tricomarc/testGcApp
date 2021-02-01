import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {PreguntasChecklistDirectiveComponent} from "../../preguntas-checklist-directive/preguntas-checklist-directive";
/**
 * Generated class for the SubalertVisitaDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'subalert-visita-directive',
  templateUrl: 'subalert-visita-directive.html'
})
export class SubalertVisitaDirectiveComponent {

    @Input() alternativa: {};

  constructor(private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent) {
  }

}
