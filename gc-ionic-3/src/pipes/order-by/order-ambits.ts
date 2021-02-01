import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
	name: 'orderAmbits',
	pure: true
})
export class OrderAmbitsPipe implements PipeTransform {
	constructor() { }

	transform(array, args) {
		_.forEach( array, ( ambit ) => {
			// completo 3
			if( ambit.pendientes === 0  && ambit.contestadas >= ambit.total ) ambit.orden_status = 3;

			// incompleto 2
			if( ambit.pendientes > 0 && ambit.contestadas < ambit.total && ambit.contestadas > 0 ) ambit.orden_status = 2;

			// sin contestar 1
			if( ambit.pendientes > 0 && ambit.contestadas === 0 ) ambit.orden_status = 1;
		} )

		return _.orderBy(array, (value) => {
			if( value && value.orden_status ) return value.orden_status;
			if (value && value.orden) return value.orden;
			if (value && value.id) return value.id;
		}, 'asc');
	}
}
