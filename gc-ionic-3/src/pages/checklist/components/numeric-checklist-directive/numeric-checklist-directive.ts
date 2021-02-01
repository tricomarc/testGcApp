import {Component, Input} from '@angular/core';
import {DetallePage} from '../../sub-pages/detalle/detalle';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Generated class for the NumericChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'numeric-checklist-directive',
    templateUrl: 'numeric-checklist-directive.html'
})
export class NumericChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;
    @Input() ambitState: BehaviorSubject<any>;

    constructor(private detalle: DetallePage) {

    }

    ngOnInit() {

    }

    onChange() {
		if(this.ambitState) this.ambitState.next(true);
	}
}
