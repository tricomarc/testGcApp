import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { NavParams, NavController, ModalController } from 'ionic-angular';

import * as _ from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';

import { IndicatorDetailRipleyPage } from '../../custom/ripley/indicator-detail-ripley/indicator-detail-ripley';
import { IndicatorDetailTricotPage } from '../../custom/tricot/indicator-detail-tricot/indicator-detail-tricot';

@Component({
	selector: 'indicator-box',
	templateUrl: 'indicator-box.html'
})

export class IndicatorBoxComponent {

	@Input() indicator: any;
	@Input() redColorValue: any;
	@Input() filters: any;
	@Input() detailPage: any;
	@Input() periodName: any;
	@Input() area: any;
	@Input() name: any;

	private views: any = {
		detailPages: [
			{ name: 'IndicatorDetailTricotPage', page: IndicatorDetailTricotPage },
			{ name: 'IndicatorDetailRipleyPage', page: IndicatorDetailRipleyPage }
		]
	};

	constructor(
		private modal: ModalController,
		private navCtrl: NavController,
		private util: UtilProvider
	) { }

	// Muestra el detalle de un indicador
	showIndicatorDetail() {
		let view: any = _.find(this.views.detailPages, { name: this.detailPage });
		if (!view) {
			this.util.showToast('Módulo no disponible.', 3000);
			return;
		}
		this.navCtrl.push(view.page, {
			indicator: this.indicator,
			filters: this.filters,
			period: this.periodName,
			area: this.area,
			name: this.name,
			current_date: this.filters.period
		});
	}
}