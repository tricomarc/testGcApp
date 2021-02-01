import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController, Events, ModalController, Content } from 'ionic-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

// Configuración del componente
import { config } from './visual-revision-detail.config'

// Componentes
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';

// Páginas
import { SendReportPage } from '../send-report/send-report';
import { EditReportPage } from '../edit-report/edit-report';
import { ShowReportPage } from '../show-report/show-report';

// Configuración global
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-visual-revision-detail',
	templateUrl: 'visual-revision-detail.html',
})
export class VisualRevisionDetailPage {

	// Atributos
	private visual: any = null;
	private visual_id: any = null;
	private report_id: any = null;
	private branch_office_id: any = null;
	private areRequiredPhotos: boolean = false;
	private statuses: any = [];
	private form: any = {
		commentary: ''
	};
	private session: any = null;
	private locked_buttons: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    @ViewChild(Content) content: Content;

	// Representa el estado de carga cuando se actualiza un atributo del reporte
	private requesting: boolean = false;
	private status_data: any = { icon: 'help', color: 'default' };

	constructor(private navCtrl: NavController,
		private navParams: NavParams,
		private alert: AlertController,
		private loading: LoadingController,
		private modal: ModalController,
		private events: Events,
		private browser: InAppBrowser,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

	// Método que se inicia automáticamente cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'VisualRevisionDetailVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualRevisionDetail', 'Visual' );

		let visual_id = this.navParams.data.visual_id;
		let report_id = this.navParams.data.report_id;
		let branch_office_id = this.navParams.data.branch_office_id;

		// Si la vista no recibe "report_id, visual_id o branch_office_id", se cierra automáticamente
		if (!visual_id || !report_id || !branch_office_id) {
			this.util.showToast('Reporte inválido, falta información', 3000);
			this.navCtrl.pop();
			return;
		}

		// De lo contrario asignamos los valores
		this.visual_id = visual_id;
		this.report_id = report_id;
		this.branch_office_id = branch_office_id;

		this.sessionProvider.getSession().then((response: any) => {
			this.session = response;
		});

		// Obtenemos la data del reporte
		this.visual = await this.getVisualReport(true, null);

		// Obtenemos los estados y asignamos color e ícono al visual
		this.statuses = await this.getStatuses();
		if (this.statuses.length > 0) this.visual.status_data = this.getStatusValueByKey(this.visual.estado);

		// Verificamos si el visual tiene fotos requeridas
		this.checkRequiredPhotos();
	}

	// Método que se ejecuta cuando se cierra esta vista
	ionViewDidLeave() {
		// Activa el evento "visualReportPoped"
		this.events.publish('visualReportRevisionPoped');
	}

	// Obtiene el reporte del visual (Recibe la vía por la cual se debe mostrar la carga)
	// En el primer request se muestra un loading con un texto
	async getVisualReport(firstRequest: boolean, refresher: any) {
		let result = {};
		let loading = this.loading.create({ content: 'Obteniendo reporte' });

		if (!refresher) {
			if (firstRequest) loading.present();
			else this.requesting = true;
		}

		// Solicitamos el reporte del visual al servicio
		await this.request
			.get(config.endpoints.newApi.get.report + this.report_id, true)
			.then((response: any) => {
				if (response.data) {
					// Para cada foto de referencia asignamos su implementación
					this.setImplementations(response.data.fotos, response.data.implementaciones);
					// Agrupamos las fotos que han sido clasificadas y las agregamos al visual
					response.data.classified_photos = this.groupClassifiedPhotos(response.data.fotos, response.data.fotos_clasificadas);
					// Asignamos las implementaciones extras
					response.data.classified_photos.optional = response.data.implementaciones.normales;
					result = _.merge(response.data, { status_data: this.status_data });
				}
				else this.util.showAlert("Atención", "No ha sido posible obtener el reporte, intente nuevamente");
			})
			.catch((error: any) => {
				this.util.showToast('No ha sido posible obtener el reporte, intente nuevamente', 3000);
			});
		if (refresher) refresher.complete();
		else {
			if (firstRequest) loading.dismiss();
			this.requesting = false;
		}

		return result;
	}

	// Abre un modal el cual muestra la foto que entra por parámetro
    openPhotoViewer(photo: any, type: string, is_video: boolean, reference: any, evaluated: boolean) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let modal = this.modal.create(PhotoViewerComponent, { photo: photo, type: type, is_video: is_video, reference: reference, evaluated: evaluated });
        modal.present();
    }

	// Para cada foto de referencia obligatoria se le asigna su foto/video de implementación (en caso de que exista)
	setImplementations(photos: any, implementations: any) {
		_.forEach(photos, (photo) => {
			let implementation = _.find(implementations.obligatorias, { parent_id: photo.id });
			if (photo.obligatoria && implementation) photo.implementation = implementation;
		});
		return photos;
	}

	// Agrupa las fotos clasificadas por su estado y obligatoriedad
	groupClassifiedPhotos(photos: any, classifiedPhotos: any) {
		let result = {
			required: {
				pending: [], rejected: [], accepted: [], all: []
			}
		};
		try {
			_.forEach(photos, (photo) => {
				if (photo.obligatoria) {
					// Buscamos la implementación de la foto para ver su estado
					let implementation = _.find(classifiedPhotos, (cph) => {
						if (cph.parent) return cph.parent.id === photo.id;
						return null;
					});
					if (implementation) {
						if (photo.implementation) photo.implementation.rechazos = (implementation.rechazos || []);
						if (implementation.rechazada === 1) {
							result.required.rejected.push(photo);
						}
						else if (implementation.rechazada === 0) {
							result.required.accepted.push(photo);
						}
						else {
							result.required.pending.push(photo);
						}
					}
					result.required.all.push(photo);
				}
			});
		} catch (e) { }
		return result;
	}

	// Descarga un archivo
	downloadFile(file: any) {
		this.request
			.post(config.endpoints.newApi.post.downloadFile, { reporte_id: this.report_id, archivo: file.nombre }, true)
			.then((response: any) => {
				let options: InAppBrowserOptions = { location: 'no', };
				let browser = this.browser.create(file.url, '_system', options);
			})
			.catch((error: any) => {
				this.util.showToast('Error al abrir el archivo, intente nuevamente', 3000);
			});
	}

	// Agrega un comentario para el visual
	addCommentary() {
		if (!this.form.commentary) { this.util.showAlert('Atención', 'Debe ingresar un comentario.'); return; }
		this.requesting = true;
		this.request
			.post(config.endpoints.newApi.post.commentary, { comentario: this.form.commentary, reporte_id: this.report_id }, true)
			.then(async (response: any) => {
				this.requesting = false;
				this.util.showToast('Comentario agregado.', 3000);
				this.visual = await this.getVisualReport(false, null);
				// Obtenemos los estados y asignamos color e ícono al visual
				this.visual.status_data = this.getStatusValueByKey(this.visual.estado);
				// Verificamos si el visual tiene fotos requeridas
				this.checkRequiredPhotos();
				this.form = { commentary: null };
			})
			.catch((error: any) => {
				this.requesting = false;
				this.util.showAlert('Atención', 'Comentario no agregado, intente nuevamente.');
			});
	}

	// Retorna true o false dependiendo si hay fotos requeridas con implementación
	checkRequiredPhotos() {
		let count = 0;
		try {
			if (this.visual && this.visual.id) {
				// Contamos las fotos que cuentan con implementación
				_.forEach(this.visual.classified_photos.required.all, (photo) => {
					if (photo.implementation) count++;
				});
			}
		} catch (e) { }
		this.areRequiredPhotos = count > 0;
	}

	// Verifica si una campaña ha caducado o no, además agrega la holgura del cliente en caso de que exista
	async isExpired() {
		let result = true;
		await this.request
			.get(config.endpoints.newApi.get.info, true)
			.then((response: any) => {
				if (!response || !response.data || !response.data.timestamp) {
					this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
				} else if (response.data.timestamp > (this.visual.fecha_reporte.timestamp + (this.visual.holgura ? this.visual.holgura : 0))) {
					let formatedDate = this.visual.fecha_reporte.day.string + ' '
						+ this.visual.fecha_reporte.day.real + ' de ' + this.visual.fecha_reporte.month.string
						+ ', ' + this.visual.fecha_reporte.year.real + '<br> a las '
						+ this.visual.fecha_reporte.time + ' hrs.';
					this.util.showAlert('Atención', 'La fecha de reporte ha caducado. Fecha de vencimiento: ' + formatedDate);
				} else {
					result = false;
				}
			})
			.catch((error: any) => {
				this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
			});
		return result;
	}

	// Actualiza el reporte
	async refreshVisualReport(refresher: any) {
		this.visual = await this.getVisualReport(false, refresher);
		// Actulizamos la información del estado
		this.visual.status_data = this.getStatusValueByKey(this.visual.estado);
		// Verificamos si el visual tiene fotos requeridas
		this.checkRequiredPhotos();
	}

	// Muestra una alerta con el motivo de no implementación
	showNoImplementationReason(reason: any) {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		let template = ('<p><b>' + reason.nombre + '</b><br>' + (reason.comentario ? reason.comentario : '') + '</p>');
		this.util.showAlert('Motivo', template);
	}

	// Retorna un aproximado del ícono usado en ionic 1
	/*(CONFIGURAR EN ADMIN ICONOS PARA IONIC 2+ Y DEJAR DE USAR ESTA FUNCIÓN)*/
	getIconByStatus(info: any) {
		let data = this.util.getIconAndColorFromV1(info);
		return data;
	}

	// Retorna el valor (nombre) del estado actual o del estado que entra por parámetro (id)
	getStatusValueByKey(key: any) {
		let value = _.find(this.statuses, { id: key });
		if (value) return value;
		return { nombre: 'Desconocido' };
	}

	// Bloqueamos los botones por 1.5 segundos
	blockButtons() {
		this.locked_buttons = true;
		setTimeout(() => {
			this.locked_buttons = false;
		}, 1500);
	}

	// Aumenta en 15 el scroll de un textarea
	scrollTextArea(textarea: any) {
		textarea.scrollTop = textarea.scrollTop + 15;
	}

	// Obtiene los estados desde el servicio
	async getStatuses() {
		let results = [];
		this.requesting = true;
		await this.request
			.get(config.endpoints.newApi.get.statuses, true)
			.then((response: any) => {
				// Antes de retornar los estados, cambiamos los íconos a ionic 2+
				_.forEach(response.data, (result) => {
					// if (result.nombre !== 'Caducado') {
						let info = this.getIconByStatus(result.icono_app);
						result = _.merge(result, info);
						results.push(result);
					// }
				});
			})
			.catch((error: any) => {
				this.util.showToast('No ha sido posible traer la lista de estados', 3000);
			});
		this.requesting = false;
		return results;
	}

	// Acepta o rechaza la revisión de un visual
	sendVisualRevision(accept: boolean) {
		const confirm = this.alert.create({
			title: 'Atención',
			message: '¿Está seguro que desea ' + (accept ? 'aceptar' : 'rechazar') + ' esta campaña?',
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: (accept ? 'Aceptar' : 'Rechazar'),
				handler: (data: any) => {
					let body: any = { reporte_id: this.report_id };
					if (!accept) {
						if (!data.commentary) {
							this.util.showAlert('Atención', 'Debe agregar un comentario a la revisión');
							return;
						}
						body.comentario = data.commentary;
					}
					const loading = this.loading.create({ content: 'Enviando revisión' });
					loading.present();
					this.request
						.post(accept ? config.endpoints.newApi.post.accept : config.endpoints.newApi.post.reject, body, true)
						.then((response: any) => {
							loading.dismiss();
							if (!accept && config.message_api.reject === response.message) {
								this.navCtrl.pop();
								this.util.showAlert('Éxito', 'Campaña revisada exitosamente');
							} else if (accept && config.message_api.accept === response.message) {
								this.navCtrl.pop();
								this.util.showAlert('Éxito', 'Campaña revisada exitosamente');
							} else {
								loading.dismiss();
								this.util.showAlert('Atención', 'No ha sido posible revisar la campaña, intente nuevamente');
							}
						})
						.catch((error: any) => {
							loading.dismiss();
							this.util.showAlert('Atención', 'No ha sido posible revisar la campaña, intente nuevamente');
						});
				}
			}]
		});
		if (!accept) confirm.addInput({ name: 'commentary', placeholder: 'Comentario de la revisión', });
		confirm.present();
	}
}
