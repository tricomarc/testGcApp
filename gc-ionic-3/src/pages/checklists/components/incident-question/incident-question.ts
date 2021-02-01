import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
	selector: 'incident-question',
	templateUrl: 'incident-question.html'
})
export class IncidentQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;

	constructor() { }

	ngOnInit() { }
}