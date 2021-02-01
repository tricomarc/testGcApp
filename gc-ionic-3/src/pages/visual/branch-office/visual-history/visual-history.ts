import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

// Configuración del componente
import { config } from './visual-history.config';

// Configuración global
import { global } from '../../../../shared/config/global';

import { VisualReportPage } from '../visual-report/visual-report';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-visual-history',
	templateUrl: 'visual-history.html',
})

export class VisualHistoryPage {

	// Atributos
	private visuals: any = {
		all: [],
		view: []
	};
	private statuses: any = [];
	private requesting: boolean = false;

	private filters: any = {
		from: null,
		to: null
	};

	private searchControl = new FormControl();

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private cliente: string = global.bundle_id;

	// Constructor
	constructor(private navCtrl: NavController,
		private navParams: NavParams,
		private actionSheetController: ActionSheetController,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'VisualHistoryVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualHistory', 'Visual' );

		let to = new Date();
		let from = new Date(to.getFullYear(), to.getMonth(), 1);

		this.statuses = this.navParams.data.statuses;

		this.filters.from = this.getFormatedDate(from);
		this.filters.to = this.getFormatedDate(to);

		// Obtenemos el historial
		this.requesting = true;
		let visuals = await this.getVisualHistory();
		this.visuals.all = visuals;
		this.visuals.view = visuals;
		this.requesting = false;

		this.watchSearch();
	}

	// Obtiene y retorna un arreglo de visuales
	async getVisualHistory() {
		let visuals: any = [];

		await this.request
			.post(config.endpoints.newApi.post.history, this.getVisualFilters(), true)
			.then((response: any) => {
				if (!response || !response.data || !response.data.length) {
					this.util.showToast('No encontramos campañas con los filtros seleccionados.', 3000);
					return;
				}

				// Asignamos la información del estado de cada visual
				_.forEach(response.data, (visual: any) => {
					visual.status_data = this.getStatusValueByKey(visual.estado);
				});

				visuals = response.data;
			})
			.catch((error: any) => {
				this.util.showToast('No ha sido posible obtener el historial. Por favor, intente nuevamente.', 3000);
			});
		return visuals;
	}

	// Recibe una fecha y retorna un string en formato yyyy-mm-dd 
	getFormatedDate(date: any) {
		let year = date.getFullYear();
		let month = (date.getMonth() + 1);
		let day = date.getDate();

		return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
	}

	// Retorna los filtros para el servicio de visuales
	getVisualFilters() {
		let filters: any = {
			desde: this.filters.from,
			hasta: this.filters.to
		};
		return filters;
	}

	// Refresca el historial de visuales
	async refreshVisuals(refresher: any) {
		if (!refresher) {
			this.requesting = true;
			let visuals = await this.getVisualHistory();
			this.visuals.all = visuals;
			this.visuals.view = visuals;
			this.requesting = false;
			return;
		}
		let visuals = await this.getVisualHistory();
		this.visuals.all = visuals;
		this.visuals.view = visuals;
		refresher.complete();
	}

	// Retorna el valor (información) del estado que entra por parámetro (id)
	getStatusValueByKey(key: any) {
		let value = _.find(this.statuses, { id: key });
		if (value) return value;
		return { nombre: 'Desconocido' };
	}

	// Navega a la página donde está el detalle del visual
	navigateToVisualReport(visual: any) {
		this.navCtrl.push(VisualReportPage, { report_id: visual.reporte_id, fromHistory: true });
	}

	// Observa el campo de búsqueda y solicita buscar nuevas "campañas/visuales"
    watchSearch() {
        this.searchControl.valueChanges
            .debounceTime(300) // Cuando se deja de tipear por 300 ms
            .distinctUntilChanged() // Si el input es distinto
            .subscribe(async (searchTerm: any) => {
                if (searchTerm) {
                    this.visuals.view = _.filter(this.visuals.all, (visual: any) => {
                    	return _.includes(visual.nombre.toLowerCase(), searchTerm.toLowerCase());
                    });
                    return;
                }
                this.visuals.view = this.visuals.all;
            });
    }
}
