import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, Content, ModalController, MenuController } from 'ionic-angular';

import * as _ from 'lodash';

// Páginas
import { AddIncidentPage } from './sub-pages/add-incident/add-incident';
import { DetailIncidentPage } from './sub-pages/detail-incident/detail-incident';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';

// Configuración del componente
import { config } from './incidents-branch-office.config'

// Configuración global
import { global } from '../../../shared/config/global';
import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-incidents-branch-office',
	templateUrl: 'incidents-branch-office.html',
})

export class IncidentsBranchOfficePage {

	@ViewChild(Content) content: Content;

	// Atributos
	private incidents: any = [];
	private incidents_view: any = []; // Arreglo con incidencias que se muestran en la vista
	private areas: any = [];
	private statuses: any = [];
	private filters: any = {
		status: 'Todos',
		area: 'Todas'
	};

	private requesting: boolean = false;
	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private view: string = null;
	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private events: Events,
		private modal: ModalController,
		private menu: MenuController,
		private zone: NgZone,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Refresca la lista de incidencias
	async refreshIncidents(refresher: any) {
		this.zone.run(async () => {
			// Obtenemos las áreas
			this.areas = await this.getAreas();
			// Obtenemos el arreglo con incidencias
			let incidents = await this.getIncidents();
			// Todas las incidencias, se usa para filtrar
			this.incidents = incidents;
			// Incidencias que se muestran en la vista (filtradas de this.incidents)
			this.incidents_view = incidents;
			// Iniciamos los filtros y mostramos todas las incidencias
			this.filters = {
				status: 'Todos',
				area: 'Todas'
			};
			// Si viene refresher, lo completamos (cerramos)
			if (refresher) refresher.complete();
			this.content.resize();
		});
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'IncidentsBranchOfficeIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IncidentsBranchOffice', 'Incidents' );

		// Habilitamos el menú
		this.menu.enable(true, "menu");

		const loading = this.loading.create({ content: 'Obteniendo incidencias.' });
		loading.present();

		this.zone.run(async () => {
			// Obtenemos el arreglo de estados
			this.statuses = await this.getStatuses();
			// Obtenemos el arreglo de áreas
			this.areas = await this.getAreas();
			// Obtenemos el arreglo con incidencias
			let incidents = await this.getIncidents();
			this.incidents = incidents;
			this.incidents_view = incidents;
			loading.dismiss();
			this.content.resize();
		});

		// Evento que actualiza la información de la vista
		this.events.subscribe('getIncidents', async () => {
			this.zone.run(async () => {
				// Iniciamos el loading de la vista
				this.requesting = true;
				// Obtenemos los arreglos con áreas e incidencias
				this.areas = await this.getAreas();
				let incidents = await this.getIncidents();
				this.incidents = incidents;
				this.incidents_view = incidents;
				// Reiniciamos los filtros (se muestran todas las incidencias)
				this.filters = {
					status: 'Todos',
					area: 'Todas'
				};
				// Detemos el loading de la vista
				this.requesting = false;
				this.content.resize();
			});
		});
	}

	ionViewDidEnter() {
		this.events.subscribe('CAMERA-BACKGROUND', (data: any) => {
			this.view = data.view || null;
		});
	}

	ngOnDestroy(){
		this.events.unsubscribe('CAMERA-BACKGROUND');
	}

	// Método que se ejecuta antes de que se destruya la vista
	ionViewWillUnload() {
		// Borramos la suscripción al evento que actualiza la información de la vista
		this.events.unsubscribe('getIncidents');
	}

	// Obtiene la lista de incidencias
	async getIncidents() {
		// Arreglo de incidencias a retornar
		let incidents = [];
		// Solicitamos al servicio la lista de incidencias
		await this.request
			.get(config.endpoints.oldApi.get.incidents, config.useNewApi)
			.then((response: any) => {
				try {
					// Si tenemos data en la incidencia y este es un arreglo con al menos 1 elemento
					if (response && response.data && response.data.length > 0) {
						// Recorremos las incidencias
						_.forEach(response.data, (incident) => {
							// Asignamos la información del estado según su nombre
							incident.status_info = IncidentsBranchOfficePage.getStatusInfo(incident.status); 
						});
						// ASignamos la respuesta al atributo a retornar
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

	// Obtiene la lista de áreas
	async getAreas() {
		// Arreglo de áreas a retornar, lo inicializamos con un objeto que abarca todas las áreas
		let areas = [{ id: 0, nombre: 'Todas' }];
		// Solicitamos las áreas al servicio
		await this.request
			.get(config.endpoints.oldApi.get.areas, config.useNewApi)
			.then((response: any) => {
				try {
					// Si tenemos respuesta y data y esta última es un arreglo con al menos 1 elemento
					if (response && response.data && response.data.length > 0) {
						// Recorremos las áreas y las agregamos al arreglo a retornar
						_.forEach((response.data), (area: any) => {
							areas.push(area);
						});
					}
				} catch (e) {
					this.util.showAlert('Atención', 'No ha sido posible obtener la lista de incidencias, intente nuevamente.');
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la lista de incidencias, intente nuevamente.');
			});
		return areas;
	}

	// Obtiene la lista de estados
	async getStatuses() {
		// Arreglo de estados a retornar, lo inicializamos con un elemento que abarca todos las estados
		let statuses = ['Todos'];
		// Solicitamos al servicio el arreglo con estados
		await this.request
			.get(config.endpoints.newApi.get.statuses, true)
			.then((response: any) => {
				try {
					// Si tenemos respuesta, data y estados y esta última es un arreglo con al menos 1 elemento
					if (
						response
						&& response.data
						&& response.data.length > 0
					) {
						// Recorremos los estados
						_.forEach((response.data), (status: any) => {
							// Si el estado existe, tiene nombre y no ha sido considerado (evitamos repetirlos) lo agregamos al arreglo a retornar
							if (status && status.nombre && !_.includes(statuses, status.nombre)) {
								statuses.push(status.nombre);
							}
						});
					} else {
						// Si la consulta no retorna el objeto esperado, o no vienen estados
						// Asignamos los estados por defecto
						statuses = config.filters.statuses;
					}
				} catch (e) {
					// Si se produce algún error, asignamos los estados por defecto
					statuses = config.filters.statuses;
				}
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return statuses;
	}

	// Abre un modal con la página para agregar una incidencia
	addIncident() {
		// Creamos un modal, el cual contiene la página 'AddIncidentPage' (le pasamos el arreglo con áreas)
		const modal = this.modal.create(AddIncidentPage, { areas: this.areas });
		// Mostramos el modal
		modal.present();
		// Definimos un método, el cual se ejecutará cuando el modal se haya cerrado
		modal.onDidDismiss(async (params: any) => {
			// Recibimos un parámetro (objeto)
			// Si la incidencia fue agregada, actualizamos la información de la vista
			if (params.incident_added) {
				this.zone.run(async () => {
					this.requesting = true;
					// Obtenemos las áreas e incidencias
					this.areas = await this.getAreas();
					let incidents = await this.getIncidents();
					this.incidents = incidents;
					this.incidents_view = incidents;
					// Consideramos todas las incidencias en los filtros
					this.filters = {
						status: 'Todos',
						area: 'Todas'
					};
					this.requesting = false;
					this.content.resize();
				});
			}
		});
	}

	// Filtra las incidencias por su estado y área
	applyFilters() {
		// Con los filtros por defecto mostramos todas las incidencias
		if (this.filters.status === 'Todos' && this.filters.area === 'Todas') {
			this.zone.run(() => {
				this.incidents_view = this.incidents;
				this.content.resize();
			});
			return;
		}

		// Objeto con los filtros diferentes a los por defecto
		let filters: any = {};
		// Si el estado es distinto a 'Todos', lo asignamos al objeto para filtrar
		if (this.filters.status !== 'Todos') {
			filters.status = this.filters.status;
		}
		// Si la área es distinta a 'Todas', la asignamos al objeto para filtrar
		if (this.filters.area !== 'Todas') {
			filters.area = this.filters.area;
		}
		this.zone.run(() => {
			// Realizamos el filtro y asignamos la respuesta a las incidencias que se muestran en la vista
			this.incidents_view = _.filter(this.incidents, filters);
			this.content.resize();
		});
	}

	// Navega hasta el detalle de una incidencia
	showIncident(incident: any) {
		// Navega hasta el detalle de una incidencia, pasamos por parámetro su id, la información del estado y si se viaja desde estadísticas (Desde esta vista siempre es false)
		this.navCtrl.push( DetailIncidentPage, { incident_id: incident.id, status_info: incident.status_info, from_statistics: false });
	}

	// Retorna el color/clase y el ícono a partir del estado de la incidencia
	public static getStatusInfo(status: string) {
		// Evaluamos el nombre del estado y retornamos el color e ícono que le corresponda
		if (status === 'Vencida' || status === 'Anulada' || status === 'Rechazada') return { color: 'danger', icon: 'md-alert' };
		if (status === 'Resuelta') return { color: 'balanced', icon: 'md-checkmark' };
		if (status === 'En Proceso') return { color: 'energized', icon: 'ios-clock-outline' };
		if (status === 'Solicitada' || status === 'En espera' || status === 'Término Tienda') return { color: 'assertive', icon: 'md-alert' };
		// Si el estado no corresponde a ningún caso, retornamos los valores por defecto.
		return { color: 'default', icon: 'md-alert' };
	}
}
