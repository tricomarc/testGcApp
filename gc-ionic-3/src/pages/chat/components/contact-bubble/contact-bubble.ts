import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
	selector: 'contact-bubble',
	templateUrl: 'contact-bubble.html'
})

export class ContactBubbleComponent {

	@Input() contact: any = {};
	@Output() onRemoveIconClick = new EventEmitter<any>();

	constructor() { }

	removeIconClicked() {
		this.onRemoveIconClick.next(this.contact);
	}
}