import {Component, Input} from '@angular/core';

/**
 * Generated class for the MessageChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'message-checklist-directive',
  templateUrl: 'message-checklist-directive.html'
})
export class MessageChecklistDirectiveComponent {

    @Input() pregunta: 0;
    @Input() checklistEnviado: boolean;
    @Input() modalMensaje: boolean;

  constructor() {
  }

}
