import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
	name: 'cleanDate',
	pure: true
})
export class CleanDatePipe implements PipeTransform {
	constructor() { }

	transform(date, args) {
		let result: string = null;
		try {
			result = date.replace(/-/g, '/');
		} catch (e) { }
		return result;
	}
}
