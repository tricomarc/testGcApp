import { Component } from '@angular/core';
import { IonicPage, ViewController, LoadingController, ModalController, NavParams, AlertController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';

// Configuración
import { config } from './status-incident.config';
import { global } from "../../../../../shared/config/global";

@IonicPage()
@Component({
	selector: 'page-status-incident',
	templateUrl: 'status-incident.html',
})

export class StatusIncidentPage {

	// Atributos
	private incident: any = null;

	private action: string = null;
	private is_finished: boolean = false;

	private priorities: any = [];
	private types: any = [];
	private cancellations: any = [];

	private min_date: any = '';

	private forms: any = {
		accept: {
			priority: 0,
			type: 0
		},
		reject: {
			reason: null
		},
		cancel: {
			cancellation: 0,
			reason: null
		},
		reject_finished: {
			date: '',
			commentary: ''
		},
		adm_close: {
			reason: '',
			commentary: ''
		}
	};

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	// Constructor
	constructor(private viewCtrl: ViewController,
		private loading: LoadingController,
		private modal: ModalController,
		private navParams: NavParams,
		private alertController: AlertController,
		private request: RequestProvider,
		private util: UtilProvider) {

		let min_date = new Date();
		let day = min_date.getDate();
		let month = (min_date.getMonth() + 1);
		let year = min_date.getFullYear();

		this.min_date = `${year}-${(month < 10 ? ('0' + month) : month)}-${(day < 10 ? ('0' + day) : day)}`;
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		if (!this.navParams.data.action || !this.navParams.data.incident) { this.util.showAlert('Atención', 'Incidencia no encontrada'); this.closeModal(false); return; }
		this.action = this.navParams.data.action;
		this.incident = this.navParams.data.incident;

		this.is_finished = this.navParams.data.is_finished;

		if (this.incident.prioridades) _.mapKeys(this.incident.prioridades, (value, key) => {
			this.priorities.push({ id: parseInt(key), nombre: value });
		});

		if (this.incident.tipos) _.mapKeys(this.incident.tipos, (value, key) => {
			this.types.push({ id: parseInt(key), nombre: value });
		});

		if (this.incident.anulaciones) _.mapKeys(this.incident.anulaciones, (value, key) => {
			this.cancellations.push({ id: parseInt(key), nombre: value });
		});
	}

	// Cierra el modal
	closeModal(edited: boolean) {
		this.viewCtrl.dismiss({ edited: edited });
	}

	// Cambia el estado de una incidencia según la acción asociada
	changeIncidentStatus() {
		const confirm = this.alertController.create({
			title: 'Atención',
			subTitle: 'Se cambiará el estado de esta incidencia, ¿Desea continuar?',
			buttons: [{
				text: 'Cancelar'
			}, {
				text: 'Continuar',
				handler: () => {
					if (this.action === 'adm_close') {
						if (!this.forms.adm_close.reason) { this.util.showAlert('Atención', 'Indique un motivo de cierre.'); return; }
						this.sendFinishedIncidentStatus({ texto: this.forms.adm_close.reason, incidenciaId: this.incident.id });
					} else if (this.action === 'accept' && !this.is_finished) {
						if (!this.forms.accept.priority) { this.util.showAlert('Atención', 'Seleccione una prioridad.'); return; }
						if (!this.forms.accept.type) { this.util.showAlert('Atención', 'Seleccione un tipo.'); return; }
						let body = { incidencia_id: this.incident.id, prioridad_id: this.forms.accept.priority, tipo_id: this.forms.accept.type };
						this.sendIncidentStatus(body);
					} else if (this.action === 'reject' && !this.is_finished) {
						if (!this.forms.reject.reason) { this.util.showAlert('Atención', 'Ingrese un motivo.'); return; }
						let body = { incidencia_id: this.incident.id, motivo: this.forms.reject.reason };
						this.sendIncidentStatus(body);
					} else if (this.action === 'cancel') {
						if (!this.forms.cancel.reason) { this.util.showAlert('Atención', 'Ingrese un motivo.'); return; }
						if (!this.forms.cancel.cancellation) { this.util.showAlert('Atención', 'Seleccione un tipo.'); return; }
						let body = { incidencia_id: this.incident.id, motivo: this.forms.cancel.reason, anulacion_id: this.forms.cancel.cancellation };
						this.sendIncidentStatus(body);
					} else if (this.action === 'accept' && this.is_finished) {
						let body = { tipo: 2, incidenciaId: this.incident.id };
						this.sendFinishedIncidentStatus(body);
					} else if (this.action === 'reject' && this.is_finished) {
						if (!this.forms.reject_finished.date) { this.util.showAlert('Atención', 'Ingrese una fecha.'); return; }
						if (!this.forms.reject_finished.commentary) { this.util.showAlert('Atención', 'Ingrese un comentario.'); return; }
						let body = { tipo: 1, incidenciaId: this.incident.id, comentario: this.forms.reject_finished.commentary, fecha: this.forms.reject_finished.date };
						this.sendFinishedIncidentStatus(body);
					}
				}
			}]
		});
		confirm.present();
	}

	// Envía la solicitud al servicio para actualizar una incidencia finalizada
	sendFinishedIncidentStatus(body: any) {
		const loading = this.loading.create({ content: 'Actualizando incidencia' });
		loading.present();
		this.request
			.post(this.action === 'adm_close' ? config.endpoints.newApi.post.adm_close : config.endpoints.newApi.post.change_status_finished, body, true)
			.then((response: any) => {
				loading.dismiss();
				try {
					let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
					if (temp.message === 'success') {
						this.util.showToast('Incidencia actualizada', 3000);
						this.viewCtrl.dismiss({ edited: true });
						return;
					}
					this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
				} catch (e) {
					this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
				}
			})
			.catch((error: any) => {
				loading.dismiss();
				this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
			});
	}

	// Envía la solicitud al servicio para actualizar la incidencia
	sendIncidentStatus(body: any) {
		const loading = this.loading.create({ content: 'Actualizando incidencia' });
		let endpoint = this.action === 'accept' ? config.endpoints.newApi.post.accept :
			(this.action === 'cancel' ? config.endpoints.newApi.post.cancellation : config.endpoints.newApi.post.reject);
		loading.present();
		this.request
			.post(endpoint, body, true)
			.then((response: any) => {
				loading.dismiss();
				try {
					let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
					if (temp.message === 'success') {
						this.util.showToast('Incidencia actualizada', 3000);
						this.viewCtrl.dismiss({ edited: true });
						return;
					}
					this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
				} catch (e) {
					this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
				}
			})
			.catch((error: any) => {
				loading.dismiss();
				this.util.showAlert('Atención', 'No ha sido posible actualizar esta incidencia, intente nuevamente.');
			});
	}
}
