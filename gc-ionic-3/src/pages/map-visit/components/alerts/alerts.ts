import { Component } from '@angular/core';
import { NavParams, NavController, Events, App, ViewController, AlertController, LoadingController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Storage } from '@ionic/storage';

import * as _ from 'lodash';

import { UtilProvider } from "../../../../shared/providers/util/util";
import { RequestProvider } from "../../../../shared/providers/request/request";

import { config } from '../../map-visit.config';
import { global } from '../../../../shared/config/global';

import { globalConfig } from '../../../../config';

import { ChecklistTiendaPage } from '../../../checklist/tienda/checklist-tienda';
import { ISetting } from '../../../../shared/interfaces/setting.interface';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
	selector: 'alerts',
	templateUrl: 'alerts.html'
})

export class AlertsComponent {

	private availableServices: any = {
		internet: false,
		gps: false,
		position: false
	};

	private customNavCtrl: any = null;

	private currentCheckin: any = null;
	private session: any = null;
	private module: string = UtilProvider.actualModule ? UtilProvider.actualModule : 'Visita a tienda'; //Nombre para mostrar del módulo seleccionado

	private checklistSetting: any = null;

	constructor(
		private navParams: NavParams,
		private locationAccuracy: LocationAccuracy,
		private events: Events,
		private appCtrl: App,
		private navCtrl: NavController,
		private viewCtrl: ViewController,
		private alertCtrl: AlertController,
		private loadingCtrl: LoadingController,
		private storage: Storage,
		private util: UtilProvider,
		private request: RequestProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
	) {
		this.customNavCtrl = this.appCtrl.getRootNav();
	}

	ionViewWillEnter() {
		this.getChecklistStatuses();
	}

	ionViewDidLoad() {
		// TRACK DE VISTA
		this.firebaseAnalyticsProvider.trackView( 'AlertsMapVisit' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'Alerts', 'MapVisit' );

		if (!this.navParams.data.availableServices) {
			this.navCtrl.pop();
			return;
		}

		try {
			const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

			if (auxSetting && auxSetting.params) {
				this.checklistSetting = { value: JSON.parse(auxSetting.params).version }
			} else { this.checklistSetting = null }
		} catch (e) { }
		
		this.availableServices = this.navParams.data.availableServices;
		this.session = this.navParams.data.session;

		// Si tenemos internet y sólo problemas de GPS, buscamos si tiene un checkin activo
		if (
			(
				!this.availableServices.position
				|| !this.availableServices.position
			)
			&& this.availableServices.internet
		) {
			this.getCheckInFromService();
		}

		this.events.subscribe('alert-not-closed', () => {
			try {
				this.viewCtrl.dismiss();
			} catch (e) { }
		});
	}

	ionViewWillLeave() {
		this.events.unsubscribe('alert-not-closed');
	}

	// Ve si se puede solcitar alta presición, y lo hace si es posible
	async turnOnGps() {
		try {
			await this.locationAccuracy.canRequest()
				.then(async (canRequest: boolean) => {
					if (canRequest) {
						await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
							() => {
								return;
							}, error => {
								this.util.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
								return;
							}
						);
					} else {
						this.util.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
					}
				})
				.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} catch (e) {
			this.util.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
		}
	}

	// Consulta al servicio si existe un checkin activo
	async getCheckInFromService() {
		let checkin: any = null;
		await this.request
			.get(config.endpoints.get.checkIn, true)
			.then((response: any) => {
				// Si se cumplen estas condiciones quiere decir que hay un checkin activo
				if (
					response
					&& response.data
					&& response.data[0]
					&& response.data[0].check_out
					&& response.data[0].sucursal
					&& response.data[0].sucursal.id
				) {
					this.currentCheckin = response.data[0];
				}
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	// Navegamos hasta la vista de visita de una sucursal
	navigateToBranchOffice() {
		if (
			this.currentCheckin
			&& this.currentCheckin.sucursal
			&& this.currentCheckin.sucursal.id
		) {

			// Si no tenemos el setting de checklist privilegiamos el módulo antiguo
			if (!this.checklistSetting) {
				this.navCtrl.push('ChecklistTiendaPage', {
					sucursal: this.currentCheckin.sucursal.id
				});
				return;
			}

			const value: any = this.checklistSetting.value;

			if (value === 2) {
				this.navCtrl.push('ChecklistsBranchOfficePage', {
					branchOfficeId: this.currentCheckin.sucursal.id,
					checkinId: (this.currentCheckin ? this.currentCheckin.control_checkin_id : null),
					fromCheckStore: true
				});
				return;
			}

			this.navCtrl.push('ChecklistTiendaPage', {
				sucursal: this.currentCheckin.sucursal.id
			});
		}
	}

	// Redirecciona al usuario a su inicio dependiendo de su jerarquía
	goToMenu() {
		this.events.publish('close-from-alert');
		if (this.session) {
			if (this.session.jerarquia) {
				// Zonal / País
				if (this.session.jerarquia >= 98) {
					this.customNavCtrl.setRoot('IndexPage');
				} else {
					// Tienda
					if (global.title === 'OPERA APP') {
						this.customNavCtrl.setRoot('IndexOperaappPage');
					} else {
						this.customNavCtrl.setRoot('DashboardPage');
					}
				}
			} else {
				// Tienda
				this.customNavCtrl.setRoot('DashboardPage');
			}
		} else {
			this.customNavCtrl.setRoot('LoginPage');
		}
	}

	// Levanta una alerta de confirmación para realizar un checkout
	confirmCheckOut(checkin_id) {
		const confirm = this.alertCtrl.create({
			title: 'Atención',
			message: "Se marcará la salida de la tienda. ¿Desea continuar?",
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: 'Continuar',
				handler: () => {
					this.doCheckOut();
				}
			}]
		});
		confirm.present();
	}

	// Realiza un checkout
	async doCheckOut() {
		// Si no tenemos un checkin activo, cortamos la ejecución del método
		if (!this.currentCheckin || !this.currentCheckin.control_checkin_id) return;

		const loading = this.loadingCtrl.create({ content: 'Registrando checkout.' });
		loading.present();

		try {
			// Objeto para enviar al servicio de checkout
			let body = {
				control_checkin_id: this.currentCheckin.control_checkin_id,
				latitud_final: null,
				longitud_final: null,
				intento: 1
			};

			let count: number = 1;
			let timeout: number = 5000;
			let success: boolean = false;

			// Intentamos hasta 4 veces hacer checkout
			while (count < 5) {

				let content = `Registrando checkout. Intento ${count} de 4.`;
				loading.setContent(content);

				body.intento = count;

				// Recibimos el estado del checkout
				let checkoutSuccess = await this.tryCheckOut(body, timeout);

				// Si el checkout es exitoso, limpiamos el checkin actual y actualizamos la información
				if (checkoutSuccess) {
					loading.dismiss();
					this.currentCheckin = null;
					this.util.showToast('Checkout registrado con éxito.', 3000);
					this.events.publish('registered-checkout');
					success = true;
					break;
				}

				// Si el intento actual no es exitoso, aumentamos el timeout y pasamos al siguiente intento
				timeout += 5000;
				count++;
			}

			// Si fallan todos los intentos, informamos al usuario
			if (!success) {
				this.util.showAlert('Atención', 'No ha sido posible registrar el checkout, por favor intente nuevamente.');
				loading.dismiss();
			}
		} catch (e) {
			loading.dismiss();
			this.util.logError(e, config.errors.checkout.code, globalConfig.version);
			this.util.showAlert('Atención', ('Error desconocido, contacte a soporte con el código: ' + config.errors.checkout.code));
		}
	}

	// Envía un intento de checkout a la API
	async tryCheckOut(body: any, timeout: number) {
		let success: boolean = false;
		await this.request
			.postWithTimeout(config.endpoints.post.checkOut, body, true, timeout)
			.then((response: any) => {
				// Si el mensaje es de éxito, limpiamos el checkin y sucursal selccionada
				if (
					response.message === config.messages.checkoutSuccess
					|| response.message === config.messages.checkoutAlreadyDone
				) {
					success = true;
				} else {
					try { this.util.logError(JSON.stringify(response), null, globalConfig.version); } catch (e) { }
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
			});
		return success;
	}

	getChecklistStatuses() {
		if(this.currentCheckin) {
			ChecklistTiendaPage.getData2(this.storage, this.session.id, this.currentCheckin.sucursal.id).then((checklists: any) => {

				let completos = true;

				for(let checklist of checklists) {
					if(checklist.estado_id < 4) {
						completos = false;
						break;
					}
				}

				if(completos) {	
					const confirm = this.alertCtrl.create({
						title: 'Checklists completos',
						message: "Haz completado todos los checklists de esta visita. ¿Deseas registrar el Checkout?",
						buttons: [{
							text: 'Cancelar',
							handler: () => { }
						}, {
							text: 'Checkout',
							handler: () => {
								this.doCheckOut();
							}
						}]
					});
					confirm.present();
				}

			});
		}
	}
}