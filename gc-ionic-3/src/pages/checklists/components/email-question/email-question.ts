import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
	selector: 'email-question',
	templateUrl: 'email-question.html'
})
export class EmailQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;

	constructor() { }

	ngOnInit() { }

	onChange() {
		this.ambitState.next(true);
		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}
	}
}

