import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, Content, NavParams } from 'ionic-angular';
import { GoogleChartComponent } from 'ng2-google-charts';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../../shared/providers/session/session';

// Páginas
import { RankingKpiPage } from '../../../components/ranking/ranking';

// Configuración del componente
import { config } from './area-detail-tricot.config'

// Configuración global
import { global } from '../../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'area-detail-tricot',
	templateUrl: 'area-detail-tricot.html',
	providers: [GoogleChartComponent]
})

export class AreaDetailTricotPage {

	@ViewChild(Content) content: Content;

	// Atributos
	private area: any = null;
	private charge: any = null;
	private areaDetail: any = null;
	private name: any = null;

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
		this.firebaseAnalyticsProvider.trackView( 'AreaDetailTricot' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'AreaDetailTricot', 'KPI' );

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
			this.redColorValue = temp.rojo;
			this.content.resize();

			// Buscamos el detalle para la área seleccionada
			let areaDetail = _.find(temp.indicadores, { nombre: this.area.nombre });
			if (areaDetail) {
				// Buscamos el detalle de cada indicador
				await this.getIndicatorDetail(areaDetail);
				// Buscamos el histórico para cada indicador
				await this.getIndicatorHistorical(areaDetail);
				this.areaDetail = areaDetail;
			}
		}
		this.requesting = false;
	}

	// Refresca los datos de la vista
	async refreshKpi(refresher: any) {
		// Obtenemos el detalle de las áreas, las filtramos por su nombre y asignamos los periodos
		let temp = await this.getAreaDetailAndPeriod();
		if (temp) {
			this.name = temp.nombre;
			this.redColorValue = temp.rojo;
			this.content.resize();

			// Buscamos el detalle para la área seleccionada
			let areaDetail = _.find(temp.indicadores, { nombre: this.area.nombre });
			if (areaDetail) this.areaDetail = areaDetail;
		}

		refresher.complete();
	}

	// Retorna el detalle de un área
	async getAreaDetailAndPeriod() {
		let areaDetail = null;
		await this.request
			.get(config.endpoints.newApi.get.areaDetail + this.getQueryParams(), true)
			.then((response: any) => {
				if (response && response.data) {
					areaDetail = response.data;
				}
			})
			.catch((error: any) => {
				this.util.showAlert('Atención', 'No ha sido posible obtener el detalle del área');
			});
		return areaDetail;
	}

	// Navega hasta la vista de Ranking
	showRanking() {
		this.navCtrl.push(RankingKpiPage, { filters: { type: 'categoria', value: this.area.id } });
	}

	// Obtiene el detalle de los indicadores
	async getIndicatorDetail(areaDetail: any) {
		await this.request
			.get((config.endpoints.newApi.get.indicatorDetail + this.getQueryParams()), true)
			.then((response: any) => {
				if (response && response.data) {
					this.setIndicatorDetail(response.data, areaDetail);
				}
			})
			.catch((error: any) => { });
		return true;
	}

	// Obtiene el histórico de los indicadores
	async getIndicatorHistorical(areaDetail: any) {
		await this.request
			.get((config.endpoints.newApi.get.indicatorHistorical + this.getQueryParams()), true)
			.then((response: any) => {
				if (response && response.data) {
					this.setIndicatorHistorical(response.data, areaDetail);
				}
			})
			.catch((error: any) => { });
		return true;
	}

	// Asigna el detalle para cada indicador
	setIndicatorDetail(detail: any, areaDetail: any) {
		if (
			detail.indicadores
			&& detail.indicadores.datos
			&& detail.indicadores.datos.length
		) {
			// Asignamos el detalle para cada indicador
			_.forEach(areaDetail.indicador, (indicator: any) => {
				let indicatorDetail: any = _.find(detail.indicadores.datos, { id: indicator.id });
				if (indicatorDetail) {
					indicatorDetail.top = detail.indicadores.top; 
					indicator.detail = indicatorDetail;
				}
			});
		}
	}

	// Asigna el histórico para cada indicador
	setIndicatorHistorical(historical: any, areaDetail: any) {
		if (historical.data && historical.data.length) {
			// Asignamos el historial para cada indicador
			_.forEach(areaDetail.indicador, (indicator: any) => {
				let indicatorHistorical: any = _.find(historical.data, { id: indicator.id });
				if(indicatorHistorical) {
					indicator.historical = indicatorHistorical;
				}
			});
		}
	}

	// Retorna los parámetros para filtrar los indicadores
	getQueryParams() {
		let queryParams = ('?tipo=' + this.filters.charge);
		if (this.filters.charge !== 'pais') {
			queryParams += ('&dataId=' + this.filters.request_id);
		}
		return queryParams;
	}
}