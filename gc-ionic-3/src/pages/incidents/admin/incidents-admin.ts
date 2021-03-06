import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, Content, ModalController, MenuController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';
// Páginas
import { DetailIncidentAdminPage } from './sub-pages/detail-incident-admin/detail-incident-admin';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';

// Configuración del componente
import { config } from './incidents-admin.config'

// Configuración global
import { global } from '../../../shared/config/global';
import { globalConfig } from '../../../config';

import { UpdateComponent } from '../../../components/update/update';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-incidents-admin',
	templateUrl: 'incidents-admin.html',
})

export class IncidentsAdminPage {

	@ViewChild(Content) content: Content;

	// Atributos
	private incidents: any = [];
	private incidents_view: any = []; // Arreglo con incidencias que se muestran en la vista

	private branch_offices: any = [];
	private services: any = [];
	private sub_services: any = [];
	private priorities: any = [];
	private statuses: any = [];

	private service_selected: any = null;

	private filters: any = {
		status: 0,
		branch_office: 0,
		service: 0,
		sub_service: 0,
		priority: 0
	};

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	private requesting: boolean = false;

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private events: Events,
		private modal: ModalController,
		private menu: MenuController,
		private navParams: NavParams,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'IncidentsAdmin' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IncidentsAdmin', 'Incidents' );

		this.menu.enable(true, "menu");
		const loading = this.loading.create({ content: 'Obteniendo incidencias.' });
		loading.present();

		let filters = await this.getFilters();

		if (!filters) { this.util.showAlert('Atención', 'No ha sido posible obtener la lista de incidencias, intente nuevamente.'); loading.dismiss(); return; }

		this.branch_offices = filters.sucursales;
		this.services = filters.cuentas;
		this.priorities = filters.prioridades;
		this.statuses = filters.estados;

		let incidents = await this.getIncidents();
		this.incidents = incidents;
		this.incidents_view = incidents;

		loading.dismiss();

		// Evento que actualiza la información de la vista
		this.events.subscribe('getIncidentsAdmin', async () => {
			this.requesting = true;
			let incidents = await this.getIncidents();
			this.incidents = incidents;
			this.incidents_view = incidents;
			this.filters = {
				status: 0,
				branch_office: 0,
				service: 0,
				sub_service: 0,
				priority: 0
			};
			this.requesting = false;
		});

        if(!this.navParams.data.from_update) {
            this.checkForUpdate();
        }
	}

	ionViewWillUnload() {
		this.events.unsubscribe('getIncidentsAdmin');
	}

	// Consulta al servicio e Ionic Pro, si es que hay una actualización
	async checkForUpdate() {
		// Consultamos si existe una actualización disponible
		let updateCheck = await this.util.checkForUpdate(globalConfig.version, globalConfig.isTest, globalConfig.testBuild, globalConfig.isBrowser);

		console.log('updateCheck', JSON.stringify(updateCheck));
		
		if (updateCheck.available && !UpdateComponent.updating) {
            if (updateCheck.required) {
                this.navCtrl.setRoot(UpdateComponent);
            } else {
                this.events.publish('show-update-button');
            }
        }
	}

	// Actualiza las incidencias
	async refreshIncidents(refresher) {
		let incidents = await this.getIncidents();
		this.incidents = incidents;
		this.incidents_view = incidents;
		this.filters = {
			status: 0,
			branch_office: 0,
			service: 0,
			sub_service: 0,
			priority: 0
		};
		if (refresher) refresher.complete();
	}

	// Retorna los filtros para las incidencias
	async getFilters() {
		let filters = null;
		await this.request
			.get(config.endpoints.newApi.get.filters, true)
			.then((response: any) => {
				filters = response.data;
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return filters;
	}

	// Obtiene la lista de incidencias
	async getIncidents() {
		let incidents = [];
		await this.request
			.get(config.endpoints.newApi.get.incidents, true)
			.then((response: any) => {
				try {
					if (response && response.data.length > 0) {
						_.forEach(response.data, (incident) => {
							incident.status_info = this.getStatusInfo(incident.estado);
						});
						incidents = response.data;
					}
				} catch (e) {
					this.util.showAlert('Atención', 'No ha sido posible obtener la lista de incidencias, intente nuevamente.');
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la lista de incidencias, intente nuevamente.');
			});
		return incidents;
	}

	// Filtra las incidencias
	applyFilters(is_service: boolean) {
		if (is_service) { this.service_selected = this.getServiceById(); this.filters.sub_service = 0; }
		let filters: any = {};
		if (this.filters.status) filters.estado = { id: this.filters.status };
		if (this.filters.branch_office) filters.sucursal = { id: this.filters.branch_office };
		if (this.filters.service) filters.cuentas = { id: this.filters.service.toString() };
		if (this.filters.sub_service) filters.cuentas = { id: this.filters.sub_service.toString() };
		if (this.filters.priority) filters.prioridades = { id: this.filters.priority.toString() };
		this.incidents_view = _.filter(this.incidents, filters);
	}

	// Navega hasta el detalle de una incidencia
	showIncident(incident: any) {
		this.navCtrl.push( DetailIncidentAdminPage, { incident_id: incident.id, status_info: incident.status_info });
	}

	// Retorna el color/clase y el ícono a partir del estado de la incidencia
	getStatusInfo(status: any) {
		if (status.nombre === 'Vencida' || status.nombre === 'Anulada' || status.nombre === 'Rechazada') return { color: 'danger', icon: 'md-alert' };
		if (status.nombre === 'Resuelta') return { color: 'balanced', icon: 'md-checkmark' };
		if (status.nombre === 'En Proceso') return { color: 'energized', icon: 'ios-clock-outline' };
		if (status.nombre === 'Solicitada' || status.nombre === 'En espera' || status.nombre === 'Término Tienda') return { color: 'assertive', icon: 'md-alert' };
		return { color: 'default', icon: 'md-alert' };
	}

	// Retorna el objeto de un servicio a partir de su id
	getServiceById() {
		if (!this.filters.service) return null;
		let service = _.find(this.services, { id: this.filters.service });
		if (!service) return null;
		if (service.submotivo.length > 0) this.filters.sub_service = 0;
		return service;
	}
}
