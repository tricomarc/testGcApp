import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as moment from 'moment';

@Component({
	selector: 'date-question',
	templateUrl: 'date-question.html'
})
export class DateQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;

	constructor() { }

	ngOnInit() {
		// Si tenemos la respuesta de fecha, debemos cambiar su formato para ion-datetime
		if (this.question.respuesta && this.question.respuesta.data) {
			this.question.respuesta.data = moment(this.question.respuesta.data, 'DD-MM-YYYY').format('YYYY-MM-DD');
		}
	}

	onChange() {
		this.ambitState.next(true);
		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}
	}
}