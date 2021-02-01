import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
	name: 'orderChatMessages',
	pure: false
})
export class OrderChatMessagesPipe implements PipeTransform {
	constructor() { }

	transform(array, args) {
		return _.orderBy(array, ['time'], ['asc']);
	}
}
