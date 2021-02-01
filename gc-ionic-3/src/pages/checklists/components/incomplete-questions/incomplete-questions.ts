import { Component, Input } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
	selector: 'incomplete-questions',
	templateUrl: 'incomplete-questions.html'
})
export class IncompleteQuestionsComponent {

	private questions: any = [];

	constructor(private viewController: ViewController, private navParams: NavParams) { }

	ngOnInit() {
		this.questions = this.navParams.data.questions;
	}

	closeModal(elementId: string) {
		this.viewController.dismiss({ elementId: elementId});
	}
}