import { Component, NgZone } from '@angular/core';
import { IonicPage, ViewController, LoadingController, ModalController, NavParams, AlertController } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../../shared/providers/session/session';

// Configuración
import { config } from './add-incident.config';
import { global } from "../../../../../shared/config/global";
import { globalConfig } from '../../../../../config';

// Componentes
import { PhotoViewerComponent } from '../../../../../components/photo-viewer/photo-viewer';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CameraComponent } from '../../../../../shared/providers/camera/component/camera';

@IonicPage()
@Component({
	selector: 'page-add-incident',
	templateUrl: 'add-incident.html',
})

export class AddIncidentPage {

	// Atributos
	private incidents: any = [];
	private user: any = {};
	private areas: any = [{ id: 0, nombre: 'Seleccionar' }];
	private services: any = [{ id: 0, nombre: 'Seleccionar' }];
	private sub_services: any = [{ id: 0, nombre: 'Seleccionar' }];
	private priorities: any = [{ id: 0, nombre: 'Seleccionar' }];
	private problems: any = [];
	private photos: any = [];
	private selected_service: any = null;
	private selected_sub_service: any = null;
	private selected_problem: any = null;
	private form: any = {
		area_id: this.areas[0].id,
		servicio_id: this.services[0].id,
		sub_servicio_id: this.sub_services[0].id,
		priority_id: this.priorities[0].id,
		commentary: null
	};
	private requesting: boolean = false;
	private incident_not_available: boolean = false; // Atributo que controla si la incidencia puede ser creada o no
	private required_photos: boolean = false;
	private locked_buttons: boolean = false;

	// Este campo nos indica cuando una incidencia se genera desde una visita a tienda
	private visit: any = null;

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private view: string = null;
	
	// Constructor
	constructor(private viewCtrl: ViewController,
		private loading: LoadingController,
		private modal: ModalController,
		private navParams: NavParams,
		private camera: Camera,
		private alert: AlertController,
		private zone: NgZone,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'AddIncidentIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'AddIncident', 'Incidents' );
		const loading = this.loading.create({ content: 'Obteniendo áreas...' });
		
		loading.present();

		// Verificamos que vengan las áreas
		if (!this.navParams.data.areas) {
			this.navParams.data.areas = await this.getAreas();
			if (!this.navParams.data.areas || !this.navParams.data.areas.length) {
				loading.dismiss();
				this.util.showAlert('Atención', 'No hemos encontrado áreas para generar la incidencia.');
				this.closeModal(false);
				return;
			}
		}

		// Verificamos que se haya asignado la información del usuario
		if (!await this.setUserData()) {
			loading.dismiss();
			this.util.showAlert('Atención', 'Falta información del usuario para generar la incidencia.');
			this.closeModal(false);
			return;
		}

		if (this.navParams.data.visit) {
			this.visit = this.navParams.data.visit;
		}

		// Asignamos las áreas
		_.forEach((this.navParams.data.areas ? this.navParams.data.areas : this.navParams.data.areas), (area) => {
			// No agregamos el área 'Todas' que viene por parámetro
			if (area && area.nombre !== 'Todas') {
				this.areas.push(area);
			}
		});

		loading.dismiss();
	}

	// Ciera el modal actual
	closeModal(value: boolean) {
		this.viewCtrl.dismiss({ incident_added: value });
	}

	// Trae de la sesión, la información necesaria del usuario y retorna un boolean
	async setUserData() {
		let result = false;

		// Ontenemos la sesión desde la memoria
		await this.sessionProvider
			.getSession()
			.then((session: any) => {
				// Si encontramos la sesión
				if (session) {
					try {
						// Asignamos la información al usuario
						this.user = {
							user_id: session.usuario.id, session_id: session.sessionid
						};
						result = true;
					} catch (e) { }
				}
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return result;
	}

	// Se activa cuando cambia el área seleccionada y asigna los servicios de esta
	areaChanged() {
		// Decimos que la incidencia puede ser creada
		this.incident_not_available = false;
		// Decimos que la foto no es obligatoria
		this.required_photos = false;

		// Si no se selecciona área, limpiamos los campos y arreglos
		if (!this.form.area_id) {
			// Decimos que no hay servicio seleccionado
			this.selected_service = null;
			// Decimos que no hay sub servicio seleccionado
			this.selected_sub_service = null;
			// No tenemos problemas (estos van asociados al área)
			this.problems = [];
			// No tenemos servicios en la lista
			this.services = [{ id: 0, nombre: 'Seleccionar' }];
			// No tenemos sub servicios en la lista
			this.sub_services = [{ id: 0, nombre: 'Seleccionar' }];
			// No tenemos prioridades en la lista
			this.priorities = [{ id: 0, nombre: 'Seleccionar' }];
			// Asignamos la opcion 'Seleccionar' para servicios, sub servicios y prioridades (única opción debido a que no hay área seleccionada)
			this.form.servicio_id = this.services[0].id;
			this.form.sub_servicio_id = this.sub_services[0].id;
			this.form.priority_id = this.priorities[0].id;
			return;
		}

		/* SI SE SELECCIONA UNA ÁREA */

		let services = [{ id: 0, nombre: 'Seleccionar' }];

		// Buscamos el área seleccionada
		let selected_area = _.find(this.areas, { id: this.form.area_id });
		// Si la encontramos
		if (selected_area && selected_area.servicios) {
			// Recorremos sus servicios y los agregamos a sus servicios
			_.forEach(selected_area.servicios, (service) => {
				services.push(service);
			});
		}

		this.services = services;
		this.sub_services = [{ id: 0, nombre: 'Seleccionar' }];
		this.priorities = [{ id: 0, nombre: 'Seleccionar' }];
		this.form.servicio_id = this.services[0].id;
		this.form.sub_servicio_id = this.sub_services[0].id;
		this.form.priority_id = this.priorities[0].id;

		this.selected_service = null;
		this.selected_sub_service = null;
	}

	// Se activa cuando cambia el servicio seleccionado y asigna los sub servicios de este
	async serviceChanged() {
		this.incident_not_available = false;
		this.required_photos = false;

		// Si no se selecciona servicio asignamos solo la opción 'Seleccionar'
		if (!this.form.servicio_id) {
			this.selected_service = null;
			this.selected_sub_service = null;
			this.problems = [];
			this.sub_services = [{ id: 0, nombre: 'Seleccionar' }];
			this.priorities = [{ id: 0, nombre: 'Seleccionar' }];
			this.form.sub_servicio_id = this.sub_services[0].id;
			this.form.priority_id = this.priorities[0].id;
			return;
		}

		let sub_services = [{ id: 0, nombre: 'Seleccionar' }];
		// Buscamos el servicio seleccionado
		let selected_service = _.find(this.services, { id: this.form.servicio_id });

		// Asignamos las prioridades y problemas del servicio
		let priorities = [{ id: 0, nombre: 'Seleccionar' }];
		_.forEach(selected_service.prioridades, (priority) => {
			priorities.push(priority);
		});
		this.priorities = priorities;

		// Asignamos el valor por defecto 'Seleccionar'
		this.form.priority_id = this.priorities[0].id;
		// Asignamos los problemas / soluciones de este servicio
		this.problems = await this.getProblems(selected_service.id);

		// Asignamos los sub servicios a la vista
		_.forEach(selected_service.sub_servicio, (sub_service) => {
			sub_services.push(sub_service);
		});
		this.sub_services = sub_services;
		this.selected_service = selected_service;
		// Vemos si el servicio es reportable desde la app
		if (this.selected_service.tiene_archivos_iniciales) this.incident_not_available = true;
		// Vemos si las fotos son requeridas
		if (this.selected_service.fotos_obligatorias) this.required_photos = true;
		// Asignamos el valor por defecto 'Seleccionar'
		this.form.sub_servicio_id = this.sub_services[0].id;
	}

	// Se activa cuando cambia el sub servicio seleccionado y asigna las prioridades de este
	async subServiceChanged() {
		// Vemos si el servicio es reportable desde la app
		if (this.selected_service && this.selected_service.tiene_archivos_iniciales) this.incident_not_available = true;
		else this.incident_not_available = false;
		// Vemos si el servicio es reportable desde la app
		if (this.selected_service && this.selected_service.fotos_obligatorias) this.required_photos = true;
		else this.required_photos = false;

		// Si no se selecciona sub servicio asignamos solo la opción 'Seleccionar'
		if (!this.form.sub_servicio_id) {
			// En este punto no se seleccionó un sub servicio, entonces comprobamos si hay un servicio seleccionado
			// Asignamos sus prioridades y consultamos por sus problemas
			if (this.selected_service) {
				let service_priorities = [{ id: 0, nombre: 'Seleccionar' }];
				_.forEach(this.selected_service.prioridades, (priority) => {
					service_priorities.push(priority);
				});
				this.priorities = service_priorities;
				this.problems = await this.getProblems(this.selected_service.id);
				this.form.priority_id = this.priorities[0].id;
				return;
			}
			// Si no hay servicio seleccionado, simplemente reiniciamos las prioridades y el sub servicio seleccionado
			this.priorities = [{ id: 0, nombre: 'Seleccionar' }];
			this.form.priority_id = this.priorities[0].id;
			this.selected_sub_service = null;
			return;
		}

		// Como tenemos un sub servicio seleccionado, asignamos sus prioridades y problemas / soluciones
		let priorities = [{ id: 0, nombre: 'Seleccionar' }];
		// Buscamos el sub servicio seleccionado
		let selected_sub_service = _.find(this.sub_services, { id: this.form.sub_servicio_id });
		if (!selected_sub_service) { this.selected_sub_service = null; return; }

		this.selected_sub_service = selected_sub_service;
		// Asignamos los problemas / soluciones de este sub servicio
		this.problems = await this.getProblems(selected_sub_service.id);

		if (selected_sub_service.prioridades) {
			_.forEach(selected_sub_service.prioridades, (priority) => {
				priorities.push(priority);
			});
		}
		this.priorities = priorities;
		// Vemos si el sub servicio es reportable desde la app
		if (this.selected_sub_service.tiene_archivos_iniciales) this.incident_not_available = true;
		// Vemos si las fotos son requeridas
		if (this.selected_sub_service.fotos_obligatorias) this.required_photos = true;
		// Asignamos el valor por defecto 'Seleccionar'
		this.form.priority_id = this.priorities[0].id;
	}

	// Retorna los problemas de un sub servicio y sus posibles soluciones
	async getProblems(service_id: any) {
		let problems = [];
		this.requesting = true;
		await this.request
			.get((config.endpoints.newApi.get.problems + '?cuenta_id=' + service_id), true)
			.then((response: any) => {
				try {
					if (response.data.length > 0) {
						_.forEach(response.data, (problem) => {
							problem.open = false;
						});
						problems = response.data;
					}
				} catch (e) { }
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		this.requesting = false;
		return problems;
	}

	// Alterna el problema seleccionado
	selectProblem(problem: any) {
		problem.open = (!problem.open || false);
	}

	sendIncident() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		if (!this.form.area_id) { this.util.showAlert('Atención', 'Seleccione un área.'); return; }
		if (!this.form.servicio_id && !this.form.sub_servicio_id) { this.util.showAlert('Atención', 'Seleccione un servicio o sub servicio.'); return; }
		if (!this.form.priority_id) { this.util.showAlert('Atención', 'Seleccione un prioridad.'); return; }
		if (this.required_photos && this.photos.length < 1) { this.util.showAlert('Atención', 'Agregue al menos una fotografía.'); return; }
		if (!this.form.commentary) { this.util.showAlert('Atención', 'Debe agregar una descripción.'); return; }

		let body: any = {
			usuario_id: this.user.user_id,
			session_id: this.user.session_id,
			area_id: this.form.area_id,
			cuenta_id: (this.form.sub_servicio_id ? this.form.sub_servicio_id : this.form.servicio_id),
			prioridad_id: this.form.priority_id,
			descripcion: this.form.commentary,
			foto: this.photos
		};

		// Si tenemos un id de visita, lo agregamos al cuerpo del request
		if (this.visit) {
			try {
				body.sucursal_id = this.visit.sucursal.id;
				body.control_checkin_id = this.visit.control_checkin_id
				body.zonal = true;
			} catch (e) { }
		}

		const confirm = this.alert.create({
			title: 'Atención',
			message: '¿Está seguro que desea enviar esta incidencia?',
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: 'Enviar',
				handler: () => {
					const loading = this.loading.create({ content: 'Enviando incidencia' });
					loading.present();

					this.request
						.post(config.endpoints.oldApi.post.addIncident, body, config.useNewApi)
						.then((response: any) => {
							loading.dismiss();
							try {
								let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
								if (temp.message === config.api_messages.addIncident) {
									this.util.showAlert('Éxito', temp.message);
									this.closeModal(true);
									return;
								}
								this.util.showAlert('Atención', temp.message);
							} catch (e) { this.util.showAlert('Atención', 'Incidencia no agregada, intente nuevamente.'); }
						})
						.catch((error: any) => {
							try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
							loading.dismiss();
							this.util.showAlert('Atención', 'Incidencia no agregada, intente nuevamente.');
						});
				}
			}]
		});
		confirm.present();
	}

	// Valora una solución
	async like(solution: any) {
		let result = 0;
		this.requesting = true;
		this.request
			.post(config.endpoints.newApi.post.like, { solucion_id: solution.id }, true)
			.then((response: any) => {
				this.requesting = false;
				try {
					let temp = (this.util.isJson(response) ? JSON.parse(response).data : response.data);
					temp === 'disliked' ? (solution.like = 0) : (solution.like = 1);
				} catch (e) {
					this.util.showToast('No ha sido posible guardar la valoración', 3000);
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.requesting = false;
				this.util.showToast('No ha sido posible guardar la valoración', 3000);
			});
		return result;
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
    

	// Solicita abrir la cámara y guarda la foto en el arreglo en caso de que se tome una
	async captureMedia() {
		if (this.photos.length > 9) {
			this.util.showAlert('Atención', 'Sólo puede subir 10 fotos al crear una incidencia. Puede subir más desde el detalle de la incidencia.');
			return;
		}
		let image = await this.getImage();
		if (image) this.photos.push(image);
	}

	// Elimina una foto del arreglo de fotos
	removePhoto(photo, index) {
		this.photos.splice(index, 1);
	}

	// Muestra una fotografía
	showPhoto(photo) {
		let modal = this.modal.create(PhotoViewerComponent, { photo: { url: photo }, type: 'none' });
		modal.present();
	}

	// Bloqueamos los botones por 1.5 segundos
	blockButtons() {
		this.locked_buttons = true;
		setTimeout(() => {
			this.locked_buttons = false;
		}, 1500);
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
				} catch (e) { }
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return areas;
	}
}

