import { Component } from '@angular/core';
import { Events, MenuController, Platform } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { OpenNativeSettings } from '@ionic-native/open-native-settings';

import * as _ from 'lodash';

import { UtilProvider } from "../../shared/providers/util/util";

import { permissions } from '../../shared/providers/util/util';

@Component({
	selector: 'permissions-request',
	templateUrl: 'permissions-request.html'
})
export class PermissionRequestComponent {

	// Atributos

	// Permisos rechazados permanentemente (Solo se pueden habilitar de forma manual)
	private permissions_denied_always = [];
	private waiting: boolean = false;

	private resume_subscriber: any = null;

	constructor(
		private events: Events,
		private menu: MenuController,
		private diagnostic: Diagnostic,
		private platform: Platform,
		private openNativeSettings: OpenNativeSettings,
		private util: UtilProvider) {
	}

	// Método que se ejecuta cuando la vista carga completamente
	ionViewDidLoad() {
		// Deshabilitamos el menú
		this.menu.enable(false, "menu");

		// Nos suscribimos al evento que indica que hay permisos requeridos
		this.events.subscribe('permissions_required', () => {
			// Cada vez que se ejecute, solicitamos el estado de cada permiso
			this.getPermissionsStatuses();
		});

		this.platform.ready().then(async () => {
			this.resume_subscriber = this.platform.resume.subscribe(() => {
				// Solicitamos el estado de cada permiso, si es que no se está consultando por permisos
				if (!this.waiting) this.getPermissionsStatuses();
			});
		});
	}

	// Método que se ejecuta cuando la vista carga completamente
	ionViewWillEnter() {
		// Solicitamos el estado de cada permiso
		this.getPermissionsStatuses();
	}

	// Método que se ejecuta cuando la vista se destruye
	ionViewWillUnload() {
		// Borramos la suscripción al evento que indica que hay permisos requeridos
		this.events.unsubscribe('permissions_required');
		if (this.resume_subscriber) {
			this.resume_subscriber.unsubscribe();
		}
	}

	// Solicita al proveedor la lista de estados para los permisos obligatorios y arma un arreglo 
	async getPermissionsStatuses() {

		this.permissions_denied_always = [];

		// Estados de los permisos obligatorios
		let permissions_statuses: any = await this.util.getPermissionsStatuses();

		// Arreglo con los permisos a solicitar
		let permissions_to_grant: any = [];

		// Se manejan diferentes estados por SO
		if (this.platform.is('android')) {
			// Obtenemos los permisos que no están autorizados

			// En Android si un permiso tiene estado distinto a granted o denied_always, lo agregamos para solicitarlo
			permissions_to_grant = _.filter(permissions_statuses, (permission) => {

				// A su vez si fue negado por siempre (denied_always), lo agregamos al arreglo de negados por siempre para informar al usuario
				if (permission.status === 'DENIED_ALWAYS') {
					this.addPermissionToDeniedAlways(permission.key);
				}
				// Si el estado del permiso es granted o denied_always, consideramos que es un permiso para solicitar
				return (permission.status !== 'GRANTED' && permission.status !== 'DENIED_ALWAYS');
			});
		} else if (this.platform.is('ios')) {
			// Obtenemos los permisos que no están autorizados

			// En iOS si un permiso tiene estado not_determined o not_requested, lo agregamos para solicitarlo
			permissions_to_grant = _.filter(permissions_statuses, (permission) => {

				// A su vez si fue negado (denied), lo agregamos al arreglo de negados por siempre para informar al usuario
				if (permission.status === 'denied') {
					this.addPermissionToDeniedAlways(permission.key);
				}
				// Si el estado del permiso es not_determined o not_requested, consideramos que es un permiso para solicitar
				return (permission.status === 'not_determined' || permission.status === 'not_requested');
			});
		}


		if (!this.permissions_denied_always.length && !permissions_to_grant.length) {
			// Si no hay permisos denegados ni por solicitar, volvemos a setear la página root ('Evento suscrito en el menú')
			this.events.publish('permissions_granted');
			return;
		}

		this.waiting = true;

		// Esperamos 3 segundos antes de solicitar los permisos (Para que el usuario lea el mensaje)
		setTimeout(async () => {
			this.waiting = false;
			// Solicitamos que acepte los permisos faltantes
			if (this.platform.is('android')) {
				// Solicitamos los permisos correspondientes para android
				this.requestAndroidPermissions(permissions_to_grant);
			} else if (this.platform.is('ios')) {
				// Solicitamos los permisos correspondientes para iOS
				this.requestIOSPermissions(permissions_to_grant);
			}
		}, 3000);
	}

	// Abre la configuración de la app
	showSettings() {
		// Vamos a los detalles de configuración (directo a permisos)
		this.openNativeSettings.open('application_details');
	}

	// Busca un permiso y si lo encuentra y no ha sido agregado, lo incluye en el arreglo de permisos denegados
	addPermissionToDeniedAlways(key: any) {
		// Buscamos el permiso por su llave
		let permission_aux = _.find(permissions, { key: key });
		// Si encontramos el permiso y no lo hemos agregado, lo agregamos a los permisos denegados
		if (permission_aux && !_.find(this.permissions_denied_always, { key: key })) {
			this.permissions_denied_always.push({
				key: key,
				label: permission_aux.label
			});
		}
	}

	// Solicita los permisos correspondientes para android
	async requestAndroidPermissions(permissions_to_grant: any) {
		this.waiting = true;
		// En Android solicitamos todos los permisos del arreglo
		await this.diagnostic
			.requestRuntimePermissions(_.map(permissions_to_grant, 'key'))
			.then((result: any) => {
				// Una vez haya respondido todas las solicitudes vemos si alguno fue negado por siempre
				_.mapKeys(result, (value, key) => {
					// Si fue negado por siempre lo agregamos al arreglo de negado s por siempre para mostrarle al usuario
					if (value === 'DENIED_ALWAYS') {
						this.addPermissionToDeniedAlways(key);
					}
				});
				// Si no hay permisos denegados volvemos a setear la página root ('Evento suscrito en el menú')
				if (!this.permissions_denied_always.length) this.events.publish('permissions_granted');
			})
			.catch((error: any) => { console.log(error); });
		this.waiting = false;
	}

	// Solicita los permisos correspondientes para ios
	async requestIOSPermissions(permissions_to_grant: any) {
		this.waiting = true;
		// En iOS recorremos el arreglo de permisos a solicitar y los solicitamos de a uno
		for (let index = 0; index < permissions_to_grant.length; index++) {
			// Si fue negado lo agregamos al arreglo de negados por siempre para mostrarle al usuario
			if (permissions_to_grant[index].key === 'ACCESS_FINE_LOCATION') {
				await this.diagnostic.requestLocationAuthorization()
					.then((response: any) => {
						if (response === 'denied') {
							this.permissions_denied_always.push({ key: 'ACCESS_FINE_LOCATION', label: 'Servicio de ubicación' });
						}
					});
			} else if (permissions_to_grant[index].key === 'CAMERA') {
				await this.diagnostic.requestCameraAuthorization()
					.then((response: any) => {
						if (response === 'denied') {
							this.permissions_denied_always.push({ key: 'CAMERA', label: 'Servicio de cámara' });
						}
					});
			}
		}
		// Si no hay permisos denegados volvemos a setear la página root ('Evento suscrito en el menú')
		if (!this.permissions_denied_always.length) this.events.publish('permissions_granted'); 
		this.waiting = false;
	}
}
