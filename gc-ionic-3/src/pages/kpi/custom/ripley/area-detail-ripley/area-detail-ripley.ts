import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, Content, NavParams } from 'ionic-angular';
import { GoogleChartComponent } from 'ng2-google-charts';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../../shared/providers/session/session';

// Páginas
import { IndicatorDetailRipleyPage } from '../indicator-detail-ripley/indicator-detail-ripley';
import { RankingKpiPage } from '../../../components/ranking/ranking';

// Configuración del componente
import { config } from './area-detail-ripley.config'

// Configuración global
import { global } from '../../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'area-detail-ripley',
	templateUrl: 'area-detail-ripley.html',
	providers: [GoogleChartComponent]
})

export class AreaDetailRipleyPage {

	@ViewChild(Content) content: Content;

	// Atributos
	private area: any = null;
	private charge: any = null;
	private area_detail: any = null;
	private historical_area: any = null;
	private historicals: any = null;
	private chart_object: any = null;
	private name: any = null;
	private periods: any = [];
	private period_name: string = 'Actual';
	// Filtros
	private filters: any = {
		period: null
	};
	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

	private redColorValue: any = null;

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private zone: NgZone,
		private events: Events,
		private googleChart: GoogleChartComponent,
		private navParams: NavParams,
		private request: RequestProvider,
		private util: UtilProvider,
		private session: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'AreaDetailRipley' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'AreaDetailRipley', 'KPI' );

		if (!this.navParams.data.area || !this.navParams.data.filters || !this.navParams.data.charge) {
			this.util.showAlert('Atención', 'Falta información del área, intente nuevamente');
			this.navCtrl.pop();
			return;
		}

		this.requesting = true;

		this.area = this.navParams.data.area;
		this.filters = this.navParams.data.filters;
		this.charge = this.navParams.data.charge;

		// Obtenemos el detalle de las áreas, las filtramos por su nombre y asignamos los periodos
		let temp = await this.getAreaDetailAndPeriod();
		if (temp) {
			this.name = temp.nombre;
			this.periods = temp.fechas;
			this.redColorValue = temp.rojo;
			this.content.resize();
			if (this.periods && this.periods.length) {
				this.filters.period = this.periods[this.periods.length - 1].fecha;
			}

			// Buscamos el detalle para la área seleccionada
			let area_detail = _.find(temp.indicadores, { nombre: this.area.nombre });
			if (area_detail) this.area_detail = area_detail;
		}

		this.historicals = await this.getHistoricals();
		if (this.historicals) {
			this.historical_area = this.historicals.datos[this.area.id];
		}

		if (this.historical_area) this.chart_object = this.getChartObject();

		this.requesting = false;
	}

	// Refresca los datos de la vista
	async refreshKpi(refresher: any) {
		// Obtenemos el detalle de las áreas, las filtramos por su nombre y asignamos los periodos
		let temp = await this.getAreaDetailAndPeriod();
		if (temp) {
			this.name = temp.nombre;
			this.periods = temp.fechas;
			this.redColorValue = temp.rojo;
			this.content.resize();

			// Buscamos el detalle para la área seleccionada
			let area_detail = _.find(temp.indicadores, { nombre: this.area.nombre });
			if (area_detail) this.area_detail = area_detail;
		}

		this.historicals = await this.getHistoricals();
		if (this.historicals) {
			this.historical_area = this.historicals.datos[this.area.id];
		}

		if (this.historical_area) this.chart_object = this.getChartObject();

		refresher.complete();
	}

	// Retorna el detalle de un área
	async getAreaDetailAndPeriod() {
		let area_detail = null;
		await this.request
			.get(config.endpoints.newApi.get.area_detail + this.getQueryParams(), true)
			.then((response: any) => {
				if (response && response.data) area_detail = response.data;
			})
			.catch((error: any) => {
				this.util.showAlert('Atención', 'No ha sido posible obtener el detalle del área');
			});
		return area_detail;
	}

	// Retorna los parámetros para filtrar los KPIS
	getQueryParams() {
		let query_params = '';
		if (this.filters.charge !== 'pais') {
			query_params = ('?tipo=' + this.filters.charge + '&dataId=' + this.filters.request_id + (this.filters.period ? ('&fecha=' + this.filters.period) : ''));
		} else {
			query_params = (this.filters.period ? ('?fecha=' + this.filters.period) : '');
		}
		return query_params;
	}

	// Obtiene el histórico de un área
	async getHistoricals() {
		let historical_area = null;
		await this.request
			.get(config.endpoints.newApi.get.historical + this.getQueryParams(), true)
			.then((response: any) => {
				if (response && response.data) historical_area = response.data;
			})
			.catch((error: any) => {
				this.util.showAlert('Atención', 'No ha sido posible obtener el histórico del área');
			});
		return historical_area;
	}

	// Retorna el objeto que contiene la información para graficar
	getChartObject() {
		let object: any = null;
		try {
			let chart_data = [];

			for (let index = 0; index < this.historicals.categorias.length; index++) {
				let area = this.historical_area.valores[index];

				chart_data[index] = {
					c: [{
						v: this.historicals.categorias[index]
					}, {
						v: area,
						f: area + '%'
					}]
				}
			}
			object = {
				dataTable: {
					cols: [{
						id: 1,
						label: 'Mes',
						type: 'string'
					}, {
						id: 2,
						label: ('Cumplimiento ' + (this.filters.charge === 'pais' ? 'país' : this.filters.charge)),
						type: 'number'
					}],
					rows: chart_data
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
						groupWidth: "20%"
					},
					height: 280,
					legend: {
						position: 'bottom',
						maxLines: 3
					},
					hAxis: {
						title: ''
					},
					vAxis: {
						title: 'Cumplimiento %',
						format: '#'
					},
					chartArea: {
						right: '0',
						left: '40'
					},
					tooltip: {
						isHtml: true,
						trigger: 'selection'
					}
				},
				chartType: 'ColumnChart'
			};
		} catch (e) { }
		return object;
	}

	// Método que se ejecuta cuando se cambia el filtro de fecha
	async periodChanged() {
		this.requesting = true;

		// Si hay periodos, seteamos el nombre del periodo actual en la vista
		if (this.periods.length) {
			let temp = _.find(this.periods, { fecha: this.filters.period });
			if (temp) this.period_name = temp.mes;
		} else {
			this.period_name = '';
		}

		// Obtenemos el detalle de las áreas, las filtramos por su nombre y asignamos los periodos
		let temp = await this.getAreaDetailAndPeriod();
		if (temp) {
			this.name = temp.nombre;
			this.redColorValue = temp.rojo;

			// Buscamos el detalle para la área seleccionada
			let area_detail = _.find(temp.indicadores, { nombre: this.area.nombre });
			if (area_detail) this.area_detail = area_detail;
		}

		this.historicals = await this.getHistoricals();
		if (this.historicals) {
			this.historical_area = this.historicals.datos[this.area.id];
		}

		if (this.historical_area) this.chart_object = this.getChartObject();

		this.requesting = false;
	}

	// Muestra el detalle de un indicador
	showIndicatorDetail(indicator: any) {
		this.navCtrl.push(IndicatorDetailRipleyPage, {
			indicator: indicator,
			filters: this.filters,
			period: this.period_name,
			area: this.area,
			name: this.name,
			current_date: this.filters.period
		});
	}

	// Navega hasta la vista de Ranking
	showRanking() {
		this.navCtrl.push(RankingKpiPage, { filters: { type: 'categoria', value: this.area.id } });
	}
}
