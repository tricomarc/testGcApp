import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, LoadingController, ModalController, NavParams, Events, Content } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';

// Configuración
import { config } from './detail-incident.config';

// Configuración global
import { global } from '../../../../../shared/config/global';
import { globalConfig } from '../../../../../config';

// Páginas
import { LogsIncidentPage } from '../logs-incident/logs-incident';
import { EvaluateIncidentPage } from '../evaluate-incident/evaluate-incident';
import { IncidentsBranchOfficePage } from '../../incidents-branch-office';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';
import { SessionProvider } from '../../../../../shared/providers/session/session';
import { CameraComponent } from '../../../../../shared/providers/camera/component/camera';

@IonicPage()
@Component({
	selector: 'page-detail-incident',
	templateUrl: 'detail-incident.html',
})

export class DetailIncidentPage {

	@ViewChild(Content) content;

	// Atributos
	private incident: any = {};
	private requesting: boolean = false;
	private form: any = {
		commentary: null
	};
	private status_info: any = { color: 'light', icon: '' };
	private locked_buttons: boolean = false;
	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	private from_statistics: boolean = false; // Si este valor es true, se deshabilitan las opciones de tienda (resolución por ejemplo)

	private session: any = null;
	private view: string = null;
	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private modal: ModalController,
		private navParams: NavParams,
		private camera: Camera,
		private browser: InAppBrowser,
		private events: Events,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
		private sessionProvider: SessionProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'DetailIncidentIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailIncident', 'Incidents' );

		// Verificamos que vengan las áreas, si no vienen, cerramos la vista
		if (!this.navParams.data.incident_id) {
			this.util.showAlert('Atención', 'No hemos encontrado el detalle de esta incidencia.');
			this.navCtrl.pop();
			return;
		}

		this.session = await this.sessionProvider.getSession();

		// Vemos si se navegó desde estadísticas
		this.from_statistics = (this.navParams.data.from_statistics === true) ? true : false;

		this.requesting = true;

		// Solicitamos el detalle de la incidencia
		this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);

		if (this.incident && this.incident.datos) {
			// Si tenemos la incidencia, asignamos la información de su estado
			this.status_info = IncidentsBranchOfficePage.getStatusInfo(this.incident.datos.estado);
		}

		this.requesting = false;
		// Redimensionamos el contenido
		/*
			Esto es necesario ya que la vista está condicionada (*ngIf) y el atributo
			del cual depende cambia a través de una función asíncrona y esto provoca
			que la vista no se "actualice"
		*/
		this.content.resize();
	}

	// Método que se activa cuando se cierra esta página
	ionViewWillLeave() {
		// Públicamos el evento 'getIncidents'
		this.events.publish('getIncidents');
	}

	// Abre un modal y muestra los logs de una incidencia
	showLogs() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		// Si no tenemos el arreglo de logs o si está vacío
		if (!this.incident.logs || this.incident.logs.length < 1) {
			// Informamos al usuario que no hay logs para mostrar
			this.util.showAlert("Atención", "Esta incidencia no tiene registros.");
			return;
		}

		// En caso contrario, mostramos los logs
		const modal = this.modal.create(LogsIncidentPage, { logs: this.incident.logs });
		modal.present();
	}

	// Obtiene el detalle de una incidencia
	async getIncidentDetail(incident_id: any) {
		// Objeto a retornar que contiene el detalle de una incidencia
		let incident: any = {};

		// Solicitamos el detalle de la incidencia a la API
		await this.request
			.get(config.endpoints.oldApi.get.incidentDetail + incident_id + (
				(this.session && this.session.usuario) ? `&tipo=${this.session.usuario.tipo}` : ''
			), config.useNewApi)
			.then((response: any) => {
				try {
					// Si tenemos respuesta, data y esta última no es un arreglo
					/*
						response.data debe ser un objeto, cuando no existe la incidencia,
						la API retorna con un arreglo, consideramos esto como error

					*/
					if (response && response.data && !_.isArray(response.data)) {
						// Asignamos la respuesta al objeto a retornar
						incident = response.data;
						return;
					}
					this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la incidencia. intente nuevamente.');
				} catch (e) { }
			}, (error: any) => {
				this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la incidencia. intente nuevamente.');
			});
		return incident;
	}

	// Agrega un comentario a la incidencia
	addCommentary() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		// Si el comentario está vacido, informamos al usuario y paramos la ejecución del método
		if (!this.form.commentary) {
			this.util.showAlert('Atención', 'Debe ingresar un comentario.');
			return;
		}

		const loading = this.loading.create({ content: 'Enviando comentario' });
		loading.present();

		// Objeto a enviar a la API		
		let commentary: any = {
			incidencia_id: this.incident.datos.id, texto: this.form.commentary, visible: true
		};

		// Enviamos la solicitud a la API
		this.request
			.post((config.endpoints.newApi.post.addCommentary + this.incident.datos.id), commentary, true)
			.then(async (response: any) => {
				loading.dismiss();
				try {
					// Si la respuesta es un json la parseamos.
					let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
					// Si el mensaje es de éxito
					if (temp.message === config.api_messages.commentary) {
						// Actualizamos la información de la incidencia
						this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);
						// Limpiamos el formulario de comentario
						this.form = { commentary: null };
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

	// Agrega una foto nueva a la incidencia
	async addPhoto() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		// Tomamos una fotografía
		let image = await this.getImage();		
		// Si no está la fotografía, paramos la ejecución del método
		if (!image) return;

		// Creamos el cuerpo para enviar la fotografía
		let body = {
			incidencia_id: this.incident.datos.id,
			foto: image
		};

		const loading = this.loading.create({ content: 'Enviando fotografía' });
		loading.present();

		// Enviamos la solicitud a la API
		this.request
			.post(config.endpoints.oldApi.post.addPhoto, body, config.useNewApi)
			.then(async (response: any) => {
				loading.dismiss();
				try {
					// Si la respuesta es un json la parseamos
					let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
					// Si el mensaje es de éxito
					if (temp.message === config.api_messages.addPhoto) {
						// Informamos al usuario
						this.util.showToast('Fotografía agregada exitosamente', 3000);
						// Actualizamos la información de la incidencia
						this.incident = await this.getIncidentDetail(this.navParams.data.incident_id);
						return;
					}
					this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
				} catch (e) { this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.'); }
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
			});
	}

	// Solicita una foto al proveedor y la retorna
	async getImage(fromUtils?: boolean) {
        let image = null;
        if(fromUtils){
            await this.util.getImage(globalConfig.isBrowser)
                .then((result) => { image = result; })
                .catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
            return image;

        }else{
            return await this.getImageCamera();
        }
    }

    /**
     * Abre la camara in app
     */
    async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.view = 'CAMERA';
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
                modal.present();
                modal.onDidDismiss((data) => {
                    this.view = 'CONTENT';
                    const image = data && data.image || null;
                    return resolve(image);
                });

            } catch (error) {
                return resolve(null);
            }
        })
    }
    

	// Solicita la url de una foto y la abre en un navegador
	downloadPhoto(photo: any) {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		const loading = this.loading.create({ content: 'Abriendo archivo.' });
		loading.present();

		// Solicitamos al servicio el link de descarga de la fotografía
		// Pasamos por parámetros el id de la fotografía y el de la incidencia
		this.request
			.get((
				config.endpoints.oldApi.get.downloadPhoto
				+ '?archivo_id=' + photo.id + '&incidencia_id='
				+ this.incident.datos.id
				+ (
					(this.session && this.session.usuario) ? `&tipo=${this.session.usuario.tipo}` : ''
				)
			), config.useNewApi)
			.then(async (response: any) => {
				loading.dismiss();
				try {
					// Si la respuesta tiene la ruta de la fotografía
					if (response.data.file_path) {
						// La abrimos en un navegador
						let options: InAppBrowserOptions = { location: 'no', };
						let browser = this.browser.create(response.data.file_path, '_system', options);
						return;
					}
					this.util.showAlert('Atención', 'No ha sido posible abrir el archivo, intente nuevamente.');
				} catch (e) { this.util.showAlert('Atención', 'No ha sido posible abrir el archivo, intente nuevamente.'); }
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				this.util.showAlert('Atención', 'No ha sido posible abrir el archivo, intente nuevamente.');
			});
	}

	// Bloqueamos los botones por 1.5 segundos
	blockButtons() {
		// Bloquea los botones
		this.locked_buttons = true;
		setTimeout(() => {
			// Los habilita luego de 1.5 segundos
			this.locked_buttons = false;
		}, 1500);
	}

	// Muestra los proveedores
	/*showProvider() {
	}*/

	// Viaja hasta la vista para resolver una incidencia
	evaluateIncident() {
		// Creamos y abrimos el modal con la página 'EvaluateIncidentPage'
		// Pasamos por parámetro la incidencia
		let modal = this.modal.create(EvaluateIncidentPage, { incident: this.incident });
		modal.present();

		// Cuando el modal se haya cerrado
		modal.onDidDismiss(async (data) => {
			// Recibimos por parámetro si es que la incidencia fue evaluada o no
			if (data && data.evaluated) {
				// Si fue evaluada, actualizamos la información de la incidencia
				this.incident = await this.getIncidentDetail(this.incident.datos.id);
				this.status_info = IncidentsBranchOfficePage.getStatusInfo(this.incident.datos.estado);
			}
		});
	}
}

