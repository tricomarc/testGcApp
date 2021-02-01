import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
	selector: 'text-question',
	templateUrl: 'text-question.html'
})
export class TextQuestionComponent {

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

