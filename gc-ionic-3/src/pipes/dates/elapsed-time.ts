import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

@Pipe({
	name: 'elapsedTime',
	pure: false
})
export class ElapsedTimePipe implements PipeTransform {
	constructor() { }

	transform(timestamp: number) {
		if(!timestamp) return '';
		
		try {
			const elapsedTime = (((moment().unix() * 1000) - timestamp) / 60000);

			if(elapsedTime < 1) {
				return 'ahora';
			}
			if(elapsedTime >= 1 && elapsedTime <= 59) {
				return Math.round(elapsedTime) + ' min.';
			}
			if(elapsedTime > 59 && elapsedTime < 1440) {
				return (Math.round(elapsedTime / 60) + ' hr.');
			}
			return moment(timestamp).format('DD-MM-YYYY');
		} catch(e) {
			return '';
		}
	}
}
