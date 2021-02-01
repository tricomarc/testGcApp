import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { GoogleChartComponent, Ng2GoogleChartsModule } from 'ng2-google-charts';

import * as _ from 'lodash';

import { config } from '../kpi-tricot.config';

import { RankingKpiPage } from '../../../components/ranking/ranking';

import { UtilProvider } from '../../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'indicator-detail-tricot',
	templateUrl: 'indicator-detail-tricot.html',
	providers: [GoogleChartComponent]
})
export class IndicatorDetailTricotPage {

	private indicator: any = null;
	private area: any = null;
	private filters: any = null;
	private name: any = null;
	private chart: any = null;

	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private util: UtilProvider,
		private request: RequestProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejcuta cuando termina de cargar la vista
	ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'IndicatorDetailTricot' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IndicatorDetailTricot', 'KPI' );

		this.getInitialData();
	}

	// Obtiene los datos del indicador
	async getInitialData() {
		if (!this.navParams.data.indicator || !this.navParams.data.filters || !this.navParams.data.area) {
			this.util.showAlert('Alerta', 'Falta información del indicador, intente nuevamente');
			this.navCtrl.pop();
			return;
		}

		this.indicator = this.navParams.data.indicator;
		this.area = this.navParams.data.area;
		this.filters = this.navParams.data.filters;
		this.name = this.navParams.data.name;

		this.chart = this.getChart();
	}

	// Navega hasta la vista de Ranking
	showRanking() {
		this.navCtrl.push(RankingKpiPage, { filters: { type: 'indicador', value: this.indicator.nombre } });
	}

	// Retorna el objeto que contiene la información para graficar
	getChart() {
		let historical: any = this.indicator.historical;

		// Para crear el gráfico debemos tener al menos 1 periodo con datos y 1 indicador
		if (
			!historical
			|| !historical.data
			|| !historical.indicadores
			|| !historical.data.length
			|| !historical.indicadores.length
		) {
			return null;
		}

		let dataTable: any = {};
		let series: any = {};

		let cols: any = [{ id: -1, label: historical.eje_y, type: 'string' }];
		let rows: any = [];

		// historical.indicadores contiene en realidad los meses los cuales serán los rows con los datos
		for (let i = 0; i < historical.indicadores.length; i++) {
			rows.push({
				c: [{
					v: historical.indicadores[i]
				}]
			});
		}

		for (let i = 0; i < historical.data.length; i++) {
			// Agregamos las columnas al gráfico (1 por cada objeto en historical.data)
			cols.push({ id: i, label: historical.data[i].nombre, type: 'number' });
			// Definimos el color de cada columna
			series[i] = {
				color: historical.data[i].color
			};

			// Recorremos los valores de cada row
			for (let j = 0; j < historical.data[i].valores.length; j++) {
				// Match entre la columna y su valor. historical.data[i].valores[x, y, z] con historical.indicadores[x, y, z]
				if (rows[j]) {
					rows[j].c.push({
						v: historical.data[i].valores[j],
						f: (historical.data[i].valores[j] + historical.eje_y)
					});
				}
			}
		}

		dataTable = {
			cols: cols,
			rows: rows
		};

		let chart = {
			chartType: 'ColumnChart',
			dataTable: dataTable,
			options: {
				title: historical.titulo,
				legend: {
					position: 'top'
				},
				series: series,
				vAxis: {
					title: historical.eje_y
				},
				tooltip: {
					isHtml: true,
					trigger: 'focus'
				},
				height: 250
			}
		};
		return chart;
	}
}
