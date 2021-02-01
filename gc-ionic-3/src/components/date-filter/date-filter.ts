import { Component, Input, Output, EventEmitter } from '@angular/core';

import { UtilProvider } from "../../shared/providers/util/util";

@Component({
	selector: 'date-filter',
	templateUrl: 'date-filter.html'
})
export class DateFilterComponent {

	@Output() onDateChange: any = new EventEmitter<any>();

	@Input() filters: any = null;

	constructor() {}

	// Le dice al componente padre que cambió el filtro de fechas
	dateChange() {
		this.onDateChange.next(this.filters);
	}
}