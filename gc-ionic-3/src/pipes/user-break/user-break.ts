import { Pipe, PipeTransform } from '@angular/core';
import { Message } from '../../pages/chat/interfaces/message';

@Pipe({
	name: 'isUserBreak',
	pure: false
})
export class UserBreakPipe implements PipeTransform {
	constructor() { }
	
	transform(messages: Message[]) {
		if(!messages.length) return messages;
		
		messages[0].isUserBreak = true;
		
		for (let i = 1; i < messages.length; i++) {
			if (messages[i - 1].sender !== messages[i].sender) {
				messages[i].isUserBreak = true;
			} else {
				messages[i].isUserBreak= false;
			}
		}

		return messages;
	}
}
