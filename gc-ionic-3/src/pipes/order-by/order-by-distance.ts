import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
	name: 'orderByDistance',
	pure: true
})
export class OrderByDistancePipe implements PipeTransform {
	constructor() { }

	transform(array, isDefaultPositionUsed: boolean) {

		return _.orderBy(array, (value) => {
			if (isDefaultPositionUsed || !value.branchOfficeData.userProximity) {
				return value.branchOfficeData.nombre;
			}
			return value.branchOfficeData.userProximity.distance;
		});
	}
}
