import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, ModalController, NavParams, Events } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Páginas
import { StatusIncidentPage } from '../status-incident/status-incident';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';

// Configuración
import { config } from './detail-incident-admin.config';

// Configuración global
import { global } from '../../../../../shared/config/global';
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-detail-incident-admin',
	templateUrl: 'detail-incident-admin.html',
})

export class DetailIncidentAdminPage {

	// Atributos
	private incident: any = null;
	private requesting: boolean = false;

	private form: any = {
		commentary: null,
		visibility: false
	};

	private buttons: any = {
		show_accept: false,
		show_reject: false,
		show_cancel: false
	};

	private status_info: any = null;

	private locked_buttons: boolean = false;

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private modal: ModalController,
		private navParams: NavParams,
		private camera: Camera,
		private browser: InAppBrowser,
		private events: Events,
		private ngZone: NgZone,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'DetailIncidentAdminIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailIncidentAdmin', 'Incidents' );

		// loading
		const loading = this.loading.create({ content: 'Obteniendo detalles...' });
		loading.present();

		// Verificamos que vengan las áreas
		if (!this.navParams.data.incident_id) {
			this.util.showAlert('Atención', 'No hemos encontrado el detalle de esta incidencia.');
			this.navCtrl.pop();
			return;
		}

		this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);

		loading.dismiss();

		if (!this.incident) {
			return;
		}

		if (this.incident.estado.id === 1) { this.buttons.show_accept = true; this.buttons.show_reject = true; }
		else if (this.incident.rechazo_ocacional && this.incident.anulaciones) { this.buttons.show_cancel = true; this.buttons.show_reject = true; }
		else if (this.incident.anulaciones) { this.buttons.show_cancel = true; }
		else if (this.incident.rechazo_ocacional) { this.buttons.show_reject = true; }
		else if (!this.incident.cuenta.permite_anular) { this.buttons.show_reject = true; this.buttons.show_cancel = true }

		this.status_info = this.navParams.data.status_info;
	}

	// Método que se activa cuando se cierra esta página
	ionViewWillLeave() {
		this.events.publish('getIncidentsAdmin');
	}

	// Obtiene el detalle de una incidencia
	async getIncidentDetail(incident_id: any) {
		let incident: any = null; 
		this.requesting = true;
		await this.request
			.get(config.endpoints.newApi.get.incidentDetail + incident_id, true)
			.then((response: any) => {
				try {
					incident = response.data;
				} catch (e) { }
			}, (error: any) => {
				console.log( error );
				//this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la incidencia. intente nuevamente.');
			});
			this.requesting = false;
		return incident;
	}

	//REVISAR
	// Actualiza el detalle de las incidencias
	async refreshDetails( refresher ){
		let incident =  await this.getIncidentDetail( this.navParams.data.incident_id );
		this.incident = incident;

		if( refresher ) refresher.complete();
	}

	// Agrega un comentario a la incidencia
	addCommentary() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		if (!this.form.commentary) { this.util.showAlert('Atención', 'Debe ingresar un comentario.'); return; }
		const loading = this.loading.create({ content: 'Enviando comentario' });
		loading.present();
		let commentary: any = { incidencia_id: this.incident.id, texto: this.form.commentary, visible: this.form.visibility };
		this.request
			.post((config.endpoints.newApi.post.addCommentary + this.incident.id), commentary, true)
			.then(async (response: any) => {
				loading.dismiss();
				try {
					let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
					if (temp.message === config.api_messages.commentary) {
						this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);
						this.form = { commentary: null, visibility: false };
						return;
					}
					this.util.showAlert('Atención', 'Comentario no agregado, intente nuevamente.');
				} catch (e) { this.util.showAlert('Atención', 'Comentario no agregado, intente nuevamente.'); }
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				this.util.showAlert('Atención', 'Comentario no agregado, intente nuevamente.');
			});
	}

	// Solicita una foto al proveedor y la retorna
	async getImage() {
		let image = null;

		await this.util.getImage(globalConfig.isBrowser)
			.then((result) => {
				image = result;
			})
			.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return image;
	}

	// Solicita la url de una foto y la abre en un navegador
	downloadPhoto(photo: any) {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		let options: InAppBrowserOptions = { location: 'no', };
		let browser = this.browser.create(photo, '_system', options);
	}


	// Bloqueamos los botones por 1.5 segundos
	blockButtons() {
		this.locked_buttons = true;
		setTimeout(() => {
			this.locked_buttons = false;
		}, 1500);
	}

	// Leva la incidencia hasta el modal para cambiar su estado
	changeIncidentStatus(action: string, is_finished: boolean) {

		const modal = this.modal.create(StatusIncidentPage, { incident: this.incident, action: action, is_finished: is_finished });

		modal.present();
		modal.onDidDismiss(async (params: any) => {
			if (params && params.edited) {
				this.ngZone.run(async () => {
					this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);
					if (!this.incident) {
						this.util.showAlert('Atención', 'No hemos encontrado el detalle de esta incidencia.');
						this.navCtrl.pop();
						return;
					}
					this.buttons = {
						show_accept: false,
						show_reject: false,
						show_cancel: false
					};
					if (this.incident.estado.id === 1) { this.buttons.show_accept = true; this.buttons.show_reject = true; }
					else if (this.incident.rechazo_ocacional && this.incident.anulaciones) { this.buttons.show_cancel = true; this.buttons.show_reject = true; }
					else if (this.incident.anulaciones) { this.buttons.show_cancel = true; }
					else if (this.incident.rechazo_ocacional) { this.buttons.show_reject = true; }
					else if (!this.incident.cuenta.permite_anular) { this.buttons.show_reject = true; this.buttons.show_cancel = true }
	
					this.status_info = this.getStatusInfo(this.incident.estado);
				});
			}
		});
	}

	// Retorna el color/clase y el ícono a partir del estado de la incidencia
	getStatusInfo(status: any) {
		if (status.nombre === 'Vencida' || status.nombre === 'Anulada' || status.nombre === 'Rechazada') return { color: 'dark', icon: 'md-alert' };
		if (status.nombre === 'Resuelta') return { color: 'balanced', icon: 'md-checkmark' };
		if (status.nombre === 'En Proceso') return { color: 'energized', icon: 'ios-clock-outline' };
		if (status.nombre === 'Solicitada' || status.nombre === 'En espera' || status.nombre === 'Término Tienda') return { color: 'assertive', icon: 'md-alert' };
		return { color: 'default', icon: 'md-alert' };
	}
}

