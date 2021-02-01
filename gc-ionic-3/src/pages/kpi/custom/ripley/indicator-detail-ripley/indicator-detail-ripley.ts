import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { GoogleChartComponent, Ng2GoogleChartsModule } from 'ng2-google-charts';

import * as _ from 'lodash';

import { RankingKpiPage } from '../../../components/ranking/ranking';

import { UtilProvider } from '../../../../../shared/providers/util/util';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'page-indicator-detail-ripley',
	templateUrl: 'indicator-detail-ripley.html',
	providers: [GoogleChartComponent]
})
export class IndicatorDetailRipleyPage {

	private indicator: any = null;
	private area: any = null;
	private filters: any = null;
	private name: any = null;
	private period: any = null;
	private current_date: any = null;
	private chart_object: any = null;

	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejcuta cuando termina de cargar la vista
	ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'IndicatorDetailRipley' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IndicatorDetailRipley', 'KPI' );

		this.getInitialData();
	}

	// Obtiene los datos del indicador
	async getInitialData() {
		if (!this.navParams.data.indicator || !this.navParams.data.filters || !this.navParams.data.area || !this.navParams.data.period) {
			this.util.showAlert('Alerta', 'Falta información del indicador, intente nuevamente');
			this.navCtrl.pop();
			return;
		}

		this.indicator = this.navParams.data.indicator;
		this.area = this.navParams.data.area;
		this.filters = this.navParams.data.filters;
		this.name = this.navParams.data.name;
		this.period = this.navParams.data.period;
		this.current_date = this.navParams.data.current_date;

		this.chart_object = this.getChart();
	}

	// Retorna el objeto para crear el gráfico
	getChart() {
		let measure = ((_.includes(this.indicator.valores.acumulado, 'MM') ? 'MM$' :
			(_.includes(this.indicator.valores.acumulado, '%') ? '%' :
				(_.includes(this.indicator.valores.acumulado, '$') ? '$' :
					'Unidades'))));
		let chart_object = null;
		try {
			let data = [];

			let accumulated = null;
			let goal = null;

			try {
				accumulated = parseFloat(this.indicator.valores.acumulado.replace('.', '').replace(',', '.').match(/-?\d+\.?\d*/));
				goal = parseFloat(this.indicator.valores.meta.replace('.', '').replace(',', '.').match(/-?\d+\.?\d*/));
			} catch (e) { }

			if (accumulated) {
				data.push({
					c: [{
						v: 'Real'
					}, {
						v: accumulated,
						f: this.indicator.valores.acumulado
					}]
				});
			}

			if (goal) {
				data.push({
					c: [{
						v: 'Meta'
					}, {
						v: goal,
						f: this.indicator.valores.meta
					}]
				});
			}

			chart_object = {
				dataTable: {
					cols: [{
						id: 1,
						label: 'Mes',
						type: 'string'
					}, {
						id: 1,
						label: 'Valor',
						type: 'number'
					}],
					rows: data
				},
				options: {
					title: '',
					series: {
						0: {
							color: (this.filters.charge === 'sucursal' ? '#142421' : (this.filters.charge === 'zona' ? '#E52F1C' : '#FDBF42')),
							visibleInLegend: true
						}
					},
					bar: {
						groupWidth: '25%'
					},
					height: 225,
					legend: {
						position: 'none',
						maxLines: 3
					},
					hAxis: {
						title: '' /*'Valores'*/
					},
					vAxis: {
						title: measure,
						format: '#',
						maxValue: 4,
						minValue: 0
					},
					chartArea: {
						right: '0',
						left: '50'
					},
					tooltip: {
						isHtml: true,
						trigger: 'selection'
					}
				},
				chartType: 'ColumnChart'
			};
		} catch (e) { }
		return chart_object;
	}

	// Navega hasta la vista de Ranking
	showRanking() {
		this.navCtrl.push(RankingKpiPage, { filters: { type: 'indicador', value: this.indicator.nombre } });
	}
}
