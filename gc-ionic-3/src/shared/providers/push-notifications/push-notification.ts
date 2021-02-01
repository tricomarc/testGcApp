import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Events, ToastController, App, Platform } from 'ionic-angular';
import { OneSignal } from '@ionic-native/onesignal';
import { AlertController } from 'ionic-angular';
import { PhonegapLocalNotification } from '@ionic-native/phonegap-local-notification';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { delay } from 'lodash';

import { global } from '../../config/global';

import { SessionProvider } from '../session/session';
import { UtilProvider } from '../util/util';
import { RoomComponent } from '../../../pages/chat/components/room/room';
import { ChatPage } from '../../../pages/chat/chat';
import { MenuComponent } from '../../../components/menu/menu';

declare var window;


@Injectable()
export class PushNotificationProvider {

	public static displayNone: boolean = false;

	constructor(private storage: Storage,
		private event: Events,
		private oneSignal: OneSignal,
		private alert: AlertController,
		private app: App,
		private platform: Platform,
		private toastController: ToastController,
		private localNotifications: LocalNotifications,
		private session: SessionProvider,
		private util: UtilProvider) {
		this.event.subscribe('changeDisplayOption', (none: boolean) => {
			this.init(none).then(() => { }).catch(() => { });
		});
	}

	// Inicializa el plugin
	init(none) {
		return new Promise(async (resolve, reject) => {
			// Suscribimos el dispositivo en one signal
			this.oneSignal.startInit(global.one_signal.id);

			if(none) {
				this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.None);
				PushNotificationProvider.displayNone = true;
			} else {
				this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.Notification);
				PushNotificationProvider.displayNone = false;
			}

			// Acciones para ejecutar cuando llega una notificación
			this.oneSignal.handleNotificationReceived().subscribe(async (data: any) => {
				if (PushNotificationProvider.displayNone) {
					if (this.isChatNotification(data)) {
						if(
							(this.app.getActiveNav().getActive().instance instanceof RoomComponent)
							&& RoomComponent.currentRoomId !== data.payload.additionalData.payload.data.conversacion_id) {
							this.localNotifications.schedule({
								id: 1,
								title: data.payload.additionalData.payload.title,
								text: data.payload.additionalData.payload.message,
								data: data.payload,
								smallIcon: 'resources/android/icon/ic_notification/drawable-xxxhdpi/ic_stat_icon_250x250.png',
							icon: 'resources/android/icon/ic_notification/drawable-xxxhdpi/ic_stat_icon_250x250.png'
							});
						}
					} else {
						this.localNotifications.schedule({
							id: 1,
							title: data.payload.additionalData.payload.title,
							text: data.payload.additionalData.payload.message,
							data: data.payload,
							smallIcon: 'resources/android/icon/ic_notification/drawable-xxxhdpi/ic_stat_icon_250x250.png',
							icon: 'resources/android/icon/ic_notification/drawable-xxxhdpi/ic_stat_icon_250x250.png'
						});
					}
				} else {
					if (data.isAppInFocus) {
						if (await this.session.isSession()) {
							try {
								let buttons: any = [];

								// Si como parámetro tenemos el id de un checklist, mostramos un botón que nos permita navegar hasta él
								if (
									data.payload
									&& data.payload.additionalData
									&& data.payload.additionalData.payload
									&& data.payload.additionalData.payload.action === 'app.checklist-ambito'
									&& data.payload.additionalData.payload.data
									&& data.payload.additionalData.payload.data.params
									&& data.payload.additionalData.payload.data.params.checklist_id
								) {
									buttons.push('Cerrar');
									buttons.push({
										text: 'Ver',
										handler: () => {
											this.event.publish('navigate-from-notification', {
												module: 'checklist',
												id: data.payload.additionalData.payload.data.params.checklist_id
											});
										}
									});
								} else {
									buttons.push('Aceptar');
								}

								console.log('data de la push', data.payload);

								const alert = this.alert.create({
									title: data.payload.title,
									subTitle: data.payload.additionalData.message,
									buttons: buttons
								});
								alert.present();
							} catch (e) { }
							return;
						}
						this.util.showAlert(data.payload.body, 'Debes iniciar sesión para revisar esta notificación.');
						return;
					}
				}
			});

			// Acciones para ejecutar cuando se abre una notificación
			this.oneSignal.handleNotificationOpened().subscribe(async (data: any) => {
				if (await this.session.isSession()) {
					try {
						data = data.notification;
						let buttons: any = [];

						if (
							data.payload
							&& data.payload.additionalData
							&& data.payload.additionalData.payload
						) {
							// Si como parámetro tenemos el id de un checklist, mostramos un botón que nos permita navegar hasta él
							if (
								data.payload.additionalData.payload.action === 'app.checklist-ambito'
								&& data.payload.additionalData.payload.data
								&& data.payload.additionalData.payload.data.params
								&& data.payload.additionalData.payload.data.params.checklist_id
							) {
								this.event.publish('navigate-from-notification', {
									module: 'checklist',
									id: data.payload.additionalData.payload.data.params.checklist_id
								});
							}
							// Si como parámetro tenemos el id de una conversación, navegamos hasta ella
							else if
								(
								data.payload.additionalData.payload.data
								&& data.payload.additionalData.payload.data.url_prefix === 'chat'
								&& data.payload.additionalData.payload.data.conversacion_id
							) {
								this.event.publish('navigate-from-notification-to-chat', {
									roomId: data.payload.additionalData.payload.data.conversacion_id
								});
							}
						}
						this.oneSignal.clearOneSignalNotifications();
					} catch (e) { }
				}
			});

			this.oneSignal.endInit();

			// Obtenemos el id de usuario y el que está guardado en sesión
			let currentPushToken = await this.getPushToken();
			await this.oneSignal.getIds()
				.then(async (data: any) => {
					console.log('Token OneSignal: ', data.userId);
					// Si no hay token almacenado o es nuevo, lo guardamos
					if (currentPushToken === 'null' || !currentPushToken || data.userId !== currentPushToken) {
						await this.setPushToken(data.userId);
					}
					resolve();
				})
				.catch((error: any) => {
					reject();
				});
		});
	}

	isChatNotification(notification: any) {
		if (
			notification
			&& notification.payload
			&& notification.payload.additionalData
			&& notification.payload.additionalData.payload
			&& notification.payload.additionalData.payload.data
			&& notification.payload.additionalData.payload.data.url_prefix === 'chat'
		) {
			return true;
		}
		return false;
	}

	// Retorna el push token del dispositivo
	async getPushToken() {
		let result = null;
		await this.storage
			.get('push_token')
			.then((response: any) => {
				result = response;
			})
			.catch((error: any) => { });
		return result;
	}

	// Guarda el push token en sesión
	async setPushToken(push_token: string) {
		let result: boolean = false;
		await this.storage
			.set('push_token', push_token)
			.then((response: any) => {
				result = true;
			})
			.catch((error: any) => { });
		return result;
	}
}