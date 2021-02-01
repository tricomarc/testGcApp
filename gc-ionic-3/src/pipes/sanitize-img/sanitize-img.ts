import { Pipe, PipeTransform } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';

import * as _ from 'lodash';

@Pipe({
	name: 'sanitizeImg',
})
export class SanitizeImgPipe implements PipeTransform {
	constructor(private domSanitizer: DomSanitizer) { }

	transform(value, args) {

		if (_.includes(value, 'data:image/')) {
			return this.domSanitizer.bypassSecurityTrustUrl(value);
		}
		return value;
	}
}
