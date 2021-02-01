import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { NavParams, NavController, ModalController } from 'ionic-angular';

import * as _ from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';

import { AreaDetailRipleyPage } from '../../custom/ripley/area-detail-ripley/area-detail-ripley';
import { AreaDetailTricotPage } from '../../custom/tricot/area-detail-tricot/area-detail-tricot';

@Component({
	selector: 'area-box',
	templateUrl: 'area-box.html'
})

export class AreaBoxComponent {

	@Input() area: any;
	@Input() filters: any;


	constructor(
		private modal: ModalController,
		private navCtrl: NavController,
		private util: UtilProvider
	) { }
}