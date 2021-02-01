import {Component, Input} from '@angular/core';

/**
 * Generated class for the NotificacionChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'notificacion-checklist-directive',
  templateUrl: 'notificacion-checklist-directive.html'
})
export class NotificacionChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;

  constructor() {

  }

}
