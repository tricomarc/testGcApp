import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Events } from 'ionic-angular';

import { ISession, emptySession } from '../../interfaces/session.interface';
import { IModule } from '../../interfaces/module.interface';
import { ISetting } from '../../interfaces/setting.interface';
import { IStore } from '../../interfaces/store.interface';
import { IZone } from '../../interfaces/zone.interface';

import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { Item } from '../../models/item.class';


@Injectable()

export class SessionProvider {

	public static isSessionInitialized: BehaviorSubject<boolean> = new BehaviorSubject(false);
	public static state: BehaviorSubject<ISession> = new BehaviorSubject(emptySession);

	constructor(private storage: Storage, private event: Events) { }

	// Asigna el estado inicial de la sesión
	public async initializeState() {
		// Buscamos la sesión en el storage
		await this.storage.get('session').then((response: string) => {

			const session: any = JSON.parse(response);

			// Si no encontramos sesión actual, cortamos la ejecución del método
			if (!session || !session.usuario) return;

			// Si encontramos sesión, la asignamos al estado
			SessionProvider.state.next(this.parseSession(session));
		})
			.catch(error => { });;

		// Decimos que la sesión fue inicializada
		SessionProvider.isSessionInitialized.next(true);
	}

	// SESIÓN

	// Almacena una sesión
	saveSession(session: any) {
		return new Promise(async (resolve, reject) => {
			if (!session) reject();
			await this.storage
				.set('session', JSON.stringify(session))
				.then(async () => {
					await this.initializeState();
					resolve();
				})
				.catch((error: any) => {
					reject(error);
				});
		});
	}

	// Elimina la sesión actual
	removeSession() {
		return new Promise((resolve, reject) => {
			this.storage
				.set('session', '{}')
				.then(() => {
					SessionProvider.state.next(emptySession);
					resolve();
				})
				.catch((error: any) => {
					reject(error);
				})
		});
	}

	// Retorna la sesión en caso de que exista, en caso contrario retorna null o el error
	getSession() {
		return new Promise((resolve, reject) => {
			this.storage
				.get('session')
				.then((response: any) => {
					try {
						let session = JSON.parse(response);
						if (!session || !session.sessionid) {
							reject();
							this.event.publish('expiredSession');
						}
						else resolve(session);
					} catch (e) {
						this.event.publish('expiredSession');
						reject(e);
					}
				})
				.catch((error: any) => {
					this.event.publish('expiredSession');
					reject(error);
				});
		});
	}

	// Retorna un boolean dependiendo si hay una sesión o no
	async isSession() {
		let result: boolean = false;
		await this.storage
			.get('session')
			.then((response: any) => {
				try {
					result = (JSON.parse(response).sessionid ? true : false);
				} catch (e) {
					this.event.publish('expiredSession');
				}
			})
			.catch((error: any) => {
				this.event.publish('expiredSession');
			});
		return result;
	}

	// Busca en memoria la configuración de is_active_directory y retorna su valor
	async isActiveDirectory() {
		let result: any = false;
		await this.storage
			.get('is_active_directory')
			.then((response: any) => {
				try {
					result = JSON.parse(response);
				} catch (e) { }
			});
		return (result === true ? true : false);
	}

	// Guarda el valor para la configuración is_active_directory
	setActiveDirectory(value: boolean) {
		return new Promise((resolve) => {
			this.storage
				.set('is_active_directory', JSON.stringify(value))
				.then(() => resolve(true))
				.catch(() => resolve(false));
		});
	}

	// Verifica si el usuario tiene un módulo activado
	async isModule(moduleNames: any) {
		let result: boolean = false;

		// Obtenemos los módulos de la sesión
		let userModules = await this.getModules();

		// Recorremos los módulos
		for (let index = 0; index < userModules.length; index++) {
			// Si los nombres configurados para el módulo, contienen el nombre de alguno de los módulos de la sesión
			// decimos que el módulo buscado está disponible para el usuario
			if (
				_.includes(moduleNames, userModules[index].nombre.toLowerCase())) {
				result = true;
				break;
			}
		}
		return result;
	}

	// Retorna los módulos y cargo del usuario
	async getModules() {
		let modules = [];
		await this
			.getSession()
			.then((response: any) => {
				try {
					modules = response.usuario.modulos;
				} catch (e) { }
			})
			.catch((error: any) => { });
		return modules;
	}

	parseSession(response: any): ISession {
		// Generamos los arreglos con los modulos, settings y tiendas del usuario
		let modules: IModule[] = this.getModulesI(response.usuario.modulos);
		let settings: ISetting[] = this.getSettings(response.usuario.settings);
		let stores: IStore[] = this.getStores(response.usuario.sucursales_completo, false);
		let storesToVisit: IStore[] = this.getStores(response.usuario.sucursales_visita, true);
		let terms: Item[] = this.getTermsItems(response.usuario.legales)

		return {
			name: response.usuario.nombre,
			lastName: response.usuario.apellidos,
			uuid: response.usuario.uuid,
			avatar: response.usuario.imagen,
			sessionId: response.sessionid,
			token: `${response.sessionid}-${response.usuario.id}-local`,
			userId: response.usuario.id,
			chargeCode: response.usuario.cargo_codigo,
			type: response.usuario.tipo,
			zones: response.usuario.zonas,
			email: response.usuario.email,
			hierarchy: response.usuario.jerarquia,
			isChatModule: response.usuario.modulo_chat,
			isIncidentsModule: response.usuario.modulo_incidencias,
			mesiboToken: response.usuario.token_mesibo,
			passwordRules: response.usuario.reglas_password,
			zoneId: response.usuario.zona_id,
			modules: modules,
			settings: settings,
			stores: stores,
			storesToVisit: storesToVisit,
			userType: this.getUserType(response.usuario.tipo, response.usuario.jerarquia),
			terms: terms,
			dictionary: response.usuario.diccionario || null
		};
	}

	// Retorna el tipo de usuario a partir de su jerarquía o código de tipo
	getUserType(type: string, hierarchy: any) {
		let userType = { id: null, name: '', mainModule: '' };
		// Administrador
		if (type === 'administrador') {
			userType.id = 5;
			userType.name = 'admin';
			/*userType.mainModule = '/incidents-admin';*/
			userType.mainModule = '/menu/visapp-store';
			return userType;
		}
		// Tiendas
		if (!hierarchy || (hierarchy >= 0 && hierarchy < 98)) {
			userType.id = 3;
			userType.name = 'store';
			/*userType.mainModule = '/index-store';*/
			userType.mainModule = '/menu/visapp-store';
			return userType;
		}
		// Zonales
		if (hierarchy >= 98 && hierarchy <= 99) {
			userType.id = 2;
			userType.name = 'zonal';
			/*userType.mainModule = '/index-managment';*/
			userType.mainModule = '/menu/visapp-store';
			return userType;
		}
		// Generales
		if (hierarchy > 98) {
			userType.id = 1;
			userType.name = 'general';
			/*userType.mainModule = '/index-managment';*/
			userType.mainModule = '/menu/visapp-store';
			return userType;
		}
		// Vendedores
		if (hierarchy === -50) {
			userType.id = 4;
			userType.name = 'salesman';
			/*userType.mainModule = '/index-managment';*/
			userType.mainModule = '/menu/visapp-store';
			return userType;
		}
	}

	// Retorna el arreglo de módulos del usuario
	getModulesI(modules: any): IModule[] {
		let result: IModule[] = [];
		_.forEach(modules, (mod: any) => {
			result.push({
				code: mod.url_prefix,
				icon: mod.icon,
				image: mod.imagen,
				name: mod.nombre,
				order: mod.orden,
				showDashboard: mod.dashboard,
				showHome: mod.home,
				showMenu: mod.menu,
				url: mod.redirect
			});
		});
		return result;
	}

	// Retorna el arreglo de settings del usuario
	getSettings(settings: any): ISetting[] {
		let result: ISetting[] = [];
		_.forEach(settings, (setting: any) => {
			result.push({
				active: setting.valor,
				id: setting.id,
				name: setting.nombre,
				params: setting.params,
				value: setting.value,
				visible: setting.visible
			});
		});
		return result;
	}

	// Retorna el arreglo de sucursales del usuario
	getStores(stores: any, isVisit: boolean): IStore[] {
		let result: IStore[] = [];

		// Si son sucursales de visita, debemos agregar el estado del checkin
		if (isVisit) {
			_.forEach(stores, (store: any) => {
				result.push({
					id: store.id,
					lat: store.latitud,
					lng: store.longitud,
					realName: store.nombre_real,
					name: store.nombre_real,
					zoneId: store.zona_id,
					zoneType: store.tipo_zona,
					checkinStatus: {
						code: store.estado_checkin.codigo,
						icon: store.estado_checkin.icono,
						name: store.estado_checkin.nombre
					}
				});
			});
			return result;
		}

		_.forEach(stores, (store: any) => {
			result.push({
				id: store.id,
				lat: store.latitud,
				lng: store.longitud,
				realName: store.nombre_real,
				name: store.nombre_real,
				zoneId: store.zona_id,
				zoneType: store.tipo_zona
			});
		});
		return result;
	}

	getTermsItems(array: any): Item[] {
		let items: Item[] = [];

		if (!_.isArray(array)) return items;

		try {
			items = array.map((obj: any) => Item.parse(obj));
		} catch (e) { }

		return items;
	}

	async resetSessionWithTermUpdate(data: { id: number, accepted: boolean }): Promise<boolean> {
		return await this.storage.get('session').then(async (response: string) => {

			const session: any = JSON.parse(response);

			// Si no encontramos sesión actual, cortamos la ejecución del método
			if (!session || !session.usuario) return false;

			const rawItem: any = _.find(session.usuario.legales, (lgl: any) => lgl.id === data.id);

			if (rawItem) {
				rawItem.aceptado = data.accepted;

				await this.saveSession(session);

				SessionProvider.state.next(this.parseSession(session));
				return true;
			}
			return false;
		})
			.catch(error => { return false; });;
	}
}