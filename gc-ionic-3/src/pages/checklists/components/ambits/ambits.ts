import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ModalController, Platform, Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { ImageViewerController } from 'ionic-img-viewer';

import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

import { QuestionnaireComponent } from '../questionnaire/questionnaire';
import { QuestionnaireTemplateComponent } from '../questionnaire-template/questionnaire-template';


import { checklistConfig } from '../../checklists.config';
import { SignatureViewerComponent } from '../../../../components/signature-viewer/signature-viewer';

import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { AlertsComponent } from '../../../map-visit/components/alerts/alerts';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { globalConfig } from '../../../../config';
import * as _ from 'lodash';

@Component({
	selector: 'ambits',
	templateUrl: 'ambits.html'
})
export class AmbitsComponent {
	private filterPrev: number = null;
	private filterSelected: number;
	private auxAmbits: any;
	private checklist: any = null;
	private requesting: boolean = true;
	private session: any = null;
	private branchOfficeId: any = null;
	private checkinId: number = null;

	private checklistState: BehaviorSubject<boolean>;

	private moduleName: string = UtilProvider.actualModule;
	private historicDates: any = null;
	private signature: string = null;

	// Geoloca
	private currentUbi = {
		latitude: null,
		longitude: null,
	};
	private gpsEnabled: boolean;
	private ubiRequire: any;
	private loading: any;

	// diccionarios
	private ambitos: string;
	private sucursal: string;
	private statusColors = { 
		"completo": null, 
		"enviado": null, 
		"fuera_horario": null, 
		"incompleto": null, 
		"sin_contestar": null
	}

	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private loadingController: LoadingController,
		private browser: InAppBrowser,
		private modalController: ModalController,
		private imgViewer: ImageViewerController,
		private requestProvider: RequestProvider,
		private utilProvider: UtilProvider,
		private sessionProvider: SessionProvider,
		private geolocation: Geolocation,
		private diagnostic: Diagnostic,
		private modal: ModalController,
		private platform: Platform,
		private locationAccuracy: LocationAccuracy,
		private events: Events
	) { }

	// Al cargar la vista comprobamos que venga el id del checklist y obtenemos su detalle
	async ionViewDidLoad() {
		if (!this.navParams.data.checklistId) {
			this.utilProvider.showToast('Falta información del checklist.', 3000);
			this.navCtrl.pop();
			return;
		}

		this.branchOfficeId = this.navParams.data.branchOfficeId;
		this.checkinId = this.navParams.data.checkinId;
		this.historicDates = this.navParams.data.historicDates;

		await this.sessionProvider.getSession().then((session: any) => {
			this.session = session;
		});

		if (this.navParams.data.checklistState) {
			this.checklistState = this.navParams.data.checklistState;
		} else {
			this.checklistState = new BehaviorSubject<boolean>(true);
		}

		this.requesting = true;

		this.checklistState.subscribe((update: boolean) => {
			if (update && !this.requesting) {
				this.refreshChecklist(null);
			}
		});

		this.getCustomStatusColor();
		await this.getChecklistById();
		this.requesting = false;

		console.log( 'ambitos', this.checklist )
	}

	// Obtiene el detalle de un checklist por su Id
	async getChecklistById() {
		await this.requestProvider.get(`${checklistConfig.endpoints.newApi.get.assignment}/${this.navParams.data.checklistId}`, true)
			.then((response: any) => {
				if (response && response.data) {
					this.checklist = response.data;
					this.auxAmbits= this.checklist.ambitos;
					this.checklist.periodicity = this.getChecklistPeriodicityLabelById(response.data.periocidad_id);
					this.checklist.showTemplate = (this.navParams.data.showTemplate === true ? true : false);
					this.checklist.fromStatistics = (this.navParams.data.fromStatistics === true ? true : false);
					this.ubiRequire = response.data.requiere_ubicacion;
					if(this.checklist.requiere_firma && this.checklist.firma) {
						this.signature = this.checklist.firma;
					}
					return;
				}
				this.utilProvider.showToast('No ha sido posible obtener la información del checklist, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				this.utilProvider.showToast('No ha sido posible obtener la información del checklist, intente nuevamente.', 3000);
			});
	}

	// Actualiza la información del checklist
	async refreshChecklist(event: any) {
		this.filterSelected = null;
		await this.getChecklistById();
		if (event) {
			event.complete();
		}
	}

	// Retorna la etiqueta de la periodicidad de un checklist por su id
	getChecklistPeriodicityLabelById(periodicityId: any) {
		if (periodicityId === 1) return 'Diario';
		if (periodicityId === 2) return 'Semanal';
		if (periodicityId === 3) return 'Mensual';
		if (periodicityId === 4) return 'Ocasional';
		if (periodicityId === 5) return 'Único';
		return '';
	}

	// Muestra la vista de respuesta del ambito seleccionado
	showQuestionnaire(ambit: any) {
		this.navCtrl.push((this.checklist.showTemplate === true ? QuestionnaireTemplateComponent : QuestionnaireComponent), { checklist: this.checklist, ambit: ambit, checklistState: this.checklistState, branchOfficeId: this.branchOfficeId });
	}

	// Finaliza un checklist
	async confirmSendChecklist() {
		// ubicacion obligatoria chekiamos permisos y gps
		if( this.ubiRequire === 1 ){
			await this.checkPermissions();
			
			return;

		// Sino, mandamos asi
		}else{
			//enviamos asi, para evitar la demora en la respuesta por si no hay internet, gps o permisos.
			this.loading = this.loadingController.create({ content: 'Finalizando checklist.' });
			this.loading.present();
			
			this.currentPoss();
			
			//this.sendChecklist();
			setTimeout( () => this.sendChecklist()  , 2000);
			return;
		};
	}

	async sendChecklist(){
		
		let body: any = {
			usuario_id: this.session.usuario.id,
			session_id: this.session.sessionid,
			checklist_id: this.checklist.id,
			firma: this.signature,
			latitud: this.currentUbi.latitude,
			longitud: this.currentUbi.longitude
		};

		if (this.checkinId) body.checkin_id = this.checkinId;

		await this.requestProvider.post(checklistConfig.endpoints.newApi.post.finish, body, true)
			.then((response: any) => {
				if (response.status === true) {
					this.utilProvider.showToast(response.message, 3000);
					this.checklist.estado_id = 4;
					if (this.checklistState) {
						this.checklistState.next(true);
					}
					this.navCtrl.pop();
					return;
				}
				this.utilProvider.showToast('No ha sido posible finalizar el checklist, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				this.utilProvider.showToast('No ha sido posible finalizar el checklist, intente nuevamente.', 3000);
			});
		this.loading.dismiss();
	}

	downloadFile(url: string) {
		const options: InAppBrowserOptions = { location: 'no', };
		const browser = this.browser.create(url, '_system', options);
	}

	openSignatureDrawer() {
		// le enviamos al modal el checklist_id para ligar la firma con su checklist
		const modal = this.modalController.create(SignatureViewerComponent, { checklist_id: this.checklist.check_id });

		modal.present();

		modal.onDidDismiss((data) => {
			/* this.refreshChecklist(null); */
			this.signature = data.image;
		});
	}

	openImage( image: any, ) {
		console.log( 'signature', image )
		const imageViewer = this.imgViewer.create( image );
		imageViewer.present();
	}

	async checkPermissions(){
		let permissions = await this.utilProvider.getPermissionsStatuses();
		let gps = await this.utilProvider.checkGpsEnabled();

		let permiso = permissions[0]

		// si no tengo permisos
		if( permiso.status == "DENIED" ){

			setTimeout( () =>  this.checkPermissions() , 1000);
			//this.checkPermissions()
			return;

		// si ya tengo permisos
		}else if ( gps == false ){
			this.turnOnGPS();
			return;
			
		}else{
			this.loading = this.loadingController.create({ content: 'Enviando respuestas.' });
			this.loading.present();
			
			await this.currentPoss( );
			
			setTimeout( () =>  this.sendChecklist() , 2000);
		}
		return;
	}

	async turnOnGPS() {
		try {
			await this.locationAccuracy.canRequest()
				.then(async (canRequest: boolean) => {
					if ( canRequest ) {
						await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
							async () => {
								return;
							}, error => {
								this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
								return;
							}
						);
						setTimeout( () =>  this.checkPermissions() , 1000);
					} else {
						this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
						return;
					}
				})
				.catch((error) => { try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} catch (e) {
			this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
			return;
		}
	}

	async currentPoss( ){
		const options: GeolocationOptions = { timeout: 15000, enableHighAccuracy: false, maximumAge: 100 };

        /* El timeout del plugin geolocation no está funcionando correctamente,
        por lo cual, implementamos un timeout custom */
		const promise = new Promise((resolve, reject) => {

			// Timeout custom, si la ubicación no la obtenemos después de x segundos, rechazamos la promesa
			const timer = setTimeout(() => {
				clearTimeout(timer);
				reject({ error: 'Custom timeout error.', code: 3 });
			}, options.timeout)

			// Solicitamos la ubicación actual
			this.geolocation
				.getCurrentPosition(options)
				.then((response: any) => {
					clearTimeout(timer);
					try {
						resolve({
							latitude: response.coords.latitude,
							longitude: response.coords.longitude,
						});
					} catch (e) {
						reject(e);
					}
				})
				.catch((error: any) => {
					try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
					clearTimeout(timer);
					reject(error);
				});
		});

		await promise
			.then((response: any) => {
				this.currentUbi = response;
			})
			.catch(async (error) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				if (error && error.code === 3) {
					return;
				}
			});

		return;
	}

	async getCustomStatusColor(){
		const { checklist } = await this.utilProvider.getColors();
		if(!checklist) return;

		const statusColor = checklist.status || null;
		if(!statusColor) return;

		this.statusColors = {
			enviado: 		statusColor.enviado,
			completo: 		statusColor.completo,
			incompleto: 	statusColor.incompleto,
			sin_contestar: 	statusColor.sin_contestar,
			fuera_horario: 	statusColor.fuera_horario

		}

	}

	filterStatus( status: any ){
		if( status == this.filterPrev ){
			this.checklist.ambitos = this.auxAmbits;

			this.filterSelected = null;
			this.filterPrev = null;

			return;
		}else{
			this.filterSelected = status;

			this.filterPrev = status;

			this.checklist.ambitos = _.filter( this.auxAmbits, [ 'orden_status', status ] )
			
			return;
		}
	}

}
