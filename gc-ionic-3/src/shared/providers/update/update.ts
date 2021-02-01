import { Injectable, Inject, Optional } from '@angular/core';
import { Events } from 'ionic-angular';
import { Pro } from '@ionic/pro';
import { Observable } from 'rxjs';

import { global } from '../../config/global';
import { config } from './update.config';

import { RequestProvider } from '../request/request';

import * as semver from 'semver';

interface IUpdate {
	name: string;
	type: string;
	progress: number;
};

@Injectable()
export class UpdateProvider {
	// Atributo estático que nos indica si Ionic Pro está configurado o no
	private static configured: boolean = false;
	// Atributo estático que nos indica si se debe cancelar una actualización
	public static cancel: boolean = false;

	constructor(
		private event: Events,
		private request: RequestProvider,
		@Inject('isBrowser') @Optional() public isBrowser?: boolean) {
		this.configureDeploy();
	}

	// Configuración de Ionic Deploy con datos definido según el entorno
	async configureDeploy() {
		if (this.isBrowser) return;

		const config = {
			appId: global.pro.appId,
			channel: global.pro.channel
		};

		// Configuramos ionic pro
		await Pro.deploy.configure(config);
		// Decimos que Ionic Pro ha sido configurado
		UpdateProvider.configured = true;
	}

	// Consulta a Ionic Pro y a los servicios (sólo si checkUpdate = true) si es que hay actualizaciones disponible y retorna la respuesta
	async isUpdate(isTest: boolean, testBuild: boolean, isBrowser: boolean) {

		const result = { available: false, required: false, version: '0.0.0' };

		if (isBrowser) return result;

		// Si estamos en modo test o las actualizaciones están desactivadas, decimos que no hay actualización
		if (isTest || !await this.areUpdatesEnabled(testBuild)) {
			return result;
		}

		// Si por algún motivo, ionic pro no está configurado, lo hacemos
		if (!UpdateProvider.configured) {
			await this.configureDeploy();
		}

		// Consultamos si hay actualización
		// En Ionic Pro
		const ionicProUpdate = await Pro.deploy.checkForUpdate();

		console.log('ionicProUpdate', JSON.stringify(ionicProUpdate));

		// Si debemos consultar al servicio
		if (global.checkUpdate) {
			// Enviamos el request
			const serviceUpdate = await this.checkForServiceUpdate();
			// Si Ionic Pro y la API nos dicen que hay una actualización disponible
			if (
				ionicProUpdate
				&& ionicProUpdate.available
				&& serviceUpdate
			) {
				// Cambiamos los valores del resultado
				result.available = true;
				// La obligatoriedad y la versión de la actualización viene dada por la API
				result.required = serviceUpdate.required;
				result.version = serviceUpdate.version;
			}
		} else {
			// Si Ionic Pro nos dice que hay una actualización disponible
			if (
				ionicProUpdate
				&& ionicProUpdate.available
			) {
				// Cambiamos los valores del resultado
				result.available = true;
				// La obligatoriedad en este caso siempre será true
				result.required = true;
				// Versión '0.0.0' no requiere comparación (se asume que es una versión mayor)
				result.version = '0.0.0';
			}
		}

		console.log('result', JSON.stringify(result));

		// Retornamos el resultado
		return result;
	}

	// Realiza la actualización por Ionic Pro y retorna un observable
	// El cual informa al controlador sobre el estado de la actualización
	updateApp(): Observable<IUpdate> {
		// Creamos y retornamos un observable
		return new Observable((observer) => {
			// Definimos una función asíncrona para poder esperar a Ionic Pro 
			let fn = async () => {
				try {
					// Si por algún motivo, ionic pro no está configurado, lo hacemos
					if (!UpdateProvider.configured) {
						await this.configureDeploy();
					}
					// Descargamos la actualización
					await Pro.deploy
						.downloadUpdate((progress) => {
							// Cada vez que tengamos una actualización de progreso, la informamos
							observer.next({ name: 'downloading', progress: progress, type: 'success' });
						});

					// Si se indicó cancelar la actualización, lo hacemos
					if (UpdateProvider.cancel) {
						observer.complete();
						UpdateProvider.cancel = false;
						return;
					}

					// Se extrae la actualziación
					await Pro.deploy
						.extractUpdate((progress) => {
							// Cada vez que tengamos una actualización de progreso, la informamos
							observer.next({ name: 'extracting', progress: progress, type: 'success' });
						});

					// Si se indicó cancelar la actualización, lo hacemos
					if (UpdateProvider.cancel) {
						observer.complete();
						UpdateProvider.cancel = false;
						return;
					}

					// Si todo sale OK, reiniciamos la APP
					setTimeout(async () => {
						await Pro.deploy.reloadApp();
						observer.complete();
					}, 800);
				} catch (e) {
					// Si se produce algún error, lo enviamos al controlador
					observer.next({ name: e, progress: 0, type: 'error' });
				}
			};
			// Ejecutamos la función
			fn();
		});
	}

	// Consulta a la API si existe una actualización y retorna el resultado
	async checkForServiceUpdate() {
		let result = { available: true, required: true, version: '7.0.0' };

		/*await this.request
			.get(config.endpoints.get.checkForUpdate, true)
			.then((response: any) => {
				console.log('checkForServiceUpdate()', response);
			})
			.catch((error: any) => {
				// Registramos el error en la API
				this.util.logError(JSON.stringify(error), 'UpdateProvider.checkForServiceUpdate()', globalConfig.version);
			});*/
		return result;
	}

	// Verifica si las actualizaciones están activas
	async areUpdatesEnabled(testBuild: boolean) {
		let result: boolean = false;

		// Si estamos probando el build, decimos que hay actualización sin preguntarle a la API
		// Así los usuarios no descargan una actualización sin ser probada anteriormente
		if (testBuild) return true;

		await this.request
			.getWithoutHeaders(config.endpoints.get.areUpdatesEnabled)
			.then((response: any) => {
				if (
					response
					&& response.data
					&& response.data.actualizaVersion === 1
				) {
					result = true;
				}
			});
		return result;
	}

	// Compara dos versiones y retorna true si la disponible es mayor a la actual (Versión de la App)
	compareVersions(available: any, current: any) {
		return semver.gte(available, current);
	}
}