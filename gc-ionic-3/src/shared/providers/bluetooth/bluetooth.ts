import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Platform } from 'ionic-angular';
import { UtilProvider } from '../util/util';
import { BluetoothLE, BluetoothScanMode } from '@ionic-native/bluetooth-le';
import { Buffer } from 'buffer';

import { interval, Subscription } from 'rxjs';
import { find, includes, delay, cloneDeep, values, isObject, drop, isArray, remove, isNumber } from 'lodash';
import { GeolocationOptions, Geolocation } from '@ionic-native/geolocation';

import { SessionProvider } from '../session/session';

import * as bleadvertise from '@danke77/ble-advertise';
import { debounceTime } from 'rxjs/operators';
import { globalConfig } from '../../../config';
import { global } from '../../config/global';

@Injectable()
export class BluetoothService {

    /**
     * Service id usado para validar que el periférico sea un dispositivo usando AppO
     */
	public static HARDCODED_SERVICE_1: string = 'FFE3';

	// Valor para el service 1 'FFE3' pero en formato devuelto por Android
	public static HARDCODED_SERVICE_1_ANDOID_VERSION: string = '0000ffe3-0000-1000-8000-00805f9b34fb';

	public static resetPeripheralInterval: Subscription = null;
	public static scanSubscription: Subscription = null;

    /**
     * Cada vez que escribimos en un periférico, el dispisitivo (periférico) entra a una blackList
     * Cada dispositivo permanecerá 1 minuto en el blacklist
     * De este modo no se mandarán request simultaneos entre 2 dispositivos.
     */
	public static blackList = {
		notified: []
	};

    /**
     * Servicio a definir para cada periférico
     */
	public static SERVICE = {
		service: null,
		characteristics: [{
			uuid: '5eecf9f6-f972-4f4d-a9cf-e91ffa31df80',
			permissions: {
				read: true,
				write: true
			},
			properties: {
				read: true,
				writeWithoutResponse: true,
				write: true,
				notify: true,
				indicate: true
			}
		}]
	};

	public static blackListCheckInterval: Subscription;

	constructor(
		private platform: Platform,
		private utilProvider: UtilProvider,
		private bluetoothLE: BluetoothLE,
		private httpClient: HttpClient,
		private geolocation: Geolocation) { }

    /**
     * Logra que el dispositivo funcione como periférico
     * Para esto, primero la plataforma debe estar lista
     * Se debe inicializar el plugin y lo más importante, el usuario debe tener un UUID válido
     */
	async startPeripheral() {

		// Si está definido el intervalo que reinica el advertise, lo eliminamos
		if (BluetoothService.resetPeripheralInterval) {
			BluetoothService.resetPeripheralInterval.unsubscribe();
			BluetoothService.resetPeripheralInterval = null;
		}

		if (!SessionProvider.state.value.userId) return;
		if (!this.isUUID(SessionProvider.state.value.uuid)) return;

		if (!BluetoothService.SERVICE.service) {
			BluetoothService.SERVICE.service = cloneDeep(SessionProvider.state.value.uuid);
		}

		const name: string = `5eecf9f6-${SessionProvider.state.value.userId}`;

		if (!await this.isPlatformReady()) return;

		if (!await this.initialize()) return;
		if (!await this.initializePeripheral()) return;
		await this.removeOldServices();
		if (!await this.addNewService()) return;

		// Cada 15 segundos reiniciamos el advertise
		BluetoothService.resetPeripheralInterval = interval(15000)
			.subscribe(() => {
                /**
                 * Una vez se completan todos los pasos anterior
                 * Comenzamos a "mostrar" el dispositivo como perfiérico
                 * Con esto cada dispositivo será visible para el resto
                */
				this.bluetoothLE.startAdvertising({
					includeDeviceName: true,
					service: BluetoothService.SERVICE.service,
					name: name,
					mode: 'balanced',
					connectable: true,
					services: [
						BluetoothService.SERVICE.service,
						BluetoothService.HARDCODED_SERVICE_1
					],
					timeout: 30000,
					txPowerLevel: "high",
					includeTxPowerLevel: true,
					manufacturerId: 30000, // ID para identificar AppO
					manufacturerSpecificData: cloneDeep(SessionProvider.state.value.userId).toString()
				}).then((data) => {
					// 12 segundos después paramos el advertise
					delay(() => {
						this.stopAdvertising();
					}, 12000);
				}).catch(error => {
					// 12 segundos después paramos el advertise
					delay(() => {
						this.stopAdvertising();
					}, 12000);
				});

			});

		return true;
	}

	stopAdvertising() {
		try {
			this.bluetoothLE.stopAdvertising()
				.then((response) => { })
				.catch((error) => { });
		} catch (e) { }
	}

	async startCentral() {

		if (!await this.isPlatformReady()) return;
		if (!await this.initialize()) return;

		// Si está definido el intervalo que limpia la lista negra, lo eliminamos
		if (BluetoothService.blackListCheckInterval) {
			BluetoothService.blackListCheckInterval.unsubscribe();
			BluetoothService.blackListCheckInterval = null;
		}

		// Si está definido la suscripción que devuelve los dispositivos escaneados, lo eliminamos
		if (BluetoothService.scanSubscription) {
			BluetoothService.scanSubscription.unsubscribe();
			BluetoothService.scanSubscription = null;
		}

        /**
         * Cada 5 segundos busca los usuarios que están en blackList
         * Si un usuario llevá más de 1 minuto, lo saca del blackList
         */
		BluetoothService.blackListCheckInterval = interval(5000)
			.subscribe(() => {
				const addressToRemove = [];
				BluetoothService.blackList.notified.forEach((user: any) => {
					const elapsedSeconds = ((new Date().getTime() - user.date.getTime()) / 1000);
					if (elapsedSeconds > 60) {
						addressToRemove.push(user.IdOrUUID);
					}
				});

				addressToRemove.forEach((IdOrUUID) => {
					remove(BluetoothService.blackList.notified, (user: any) => {
						return user.IdOrUUID === IdOrUUID;
					});
				})
			});


		BluetoothService.scanSubscription = this.bluetoothLE.startScan({
			allowDuplicates: true,
			scanMode: BluetoothScanMode.SCAN_MODE_BALANCED
		})
			.pipe(debounceTime(500))
			.subscribe((device: any) => {

                /**
                 * Dependiendo la plataforma debemos buscar los identificadores
                 * de los usuarios de distintas formas
                 * puede ser su uuid o su id
                 */

				if (device.address) {

					let foundUserId: number = null;

					// Desde android
					if (this.platform.is('android') && device.advertisement) {

						// Para detectar otro Android
						foundUserId = this.decodeAndroidAdvertisementAndFindId(device.advertisement);

						// Para detectar iOS
						if (!foundUserId) {
							this.sendUUIDCandidate(device);
						}

					}
					// Desde iOS
					else if (this.platform.is('ios')) {

						// Para detectar Android
						if (device.advertisement && device.advertisement.manufacturerData) {
							foundUserId = this.decodeAndroidManufactureDataAndFindId(device.advertisement.manufacturerData);
						}
						// Para detectar otro iOS
						else if (device.advertisement && device.advertisement.serviceUuids) {
							this.sendUUIDCandidatesIOS(device);
						}
					}

					if (foundUserId && !this.isBlackListed(foundUserId)) {
						BluetoothService.blackList.notified.push({
							date: new Date(),
							IdOrUUID: foundUserId
						});
						this.notifyScannedDevice(null, foundUserId, device.rssi);
					}
				}
			});
		return true;
	}

	async isPlatformReady(): Promise<boolean> {
		return await this.platform.ready()
			.then(() => true)
			.catch(() => false);
	}

	async initialize(): Promise<boolean> {
		return await this.bluetoothLE.initialize()
			.then((data) => {
				if (data.status === 'enabled') {
					return true;
				}
				return false;
			})
			.catch((error) => {
				return false;
			});
	}

	async removeOldServices(): Promise<boolean> {
		return await this.bluetoothLE.removeAllServices()
			.then((a) => { return true })
			.catch((e) => { return false });
	}

	async addNewService(): Promise<boolean> {
		return await this.bluetoothLE.addService(BluetoothService.SERVICE)
			.then((r) => {
				return true
			})
			.catch((e) => {
				return false
			});
	}

	async initializePeripheral(): Promise<any> {
		return await new Promise((resolve) => {
			const aux = this.bluetoothLE.initializePeripheral()
				.subscribe((data) => {
					if (data.status === 'enabled') {
						aux.unsubscribe();
						resolve(true);
					}
				}, (error) => {
					resolve(false);
				});
		});
	}

	async notifyScannedDevice(uuid: string, id: number, rssi: any) {

		const position = await this.getCurrentPosition();

		const body: any = {
			rssi: rssi
		};

		if (uuid) {
			body.unique_id = uuid;
		} else if (id) {
			body.id = id;
		} else {
			return;
		}

		if (position.latitude) {
			body.geolocation = position;
		}

		const session = SessionProvider.state.value;

		const headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': (session.sessionId + '-' + session.userId + '-local')
		};

		await this.httpClient
			.post(`${global.API_OLD}/tracing`, body, { headers: new HttpHeaders(headers) })
			.toPromise()
			.then((response) => { })
			.catch((error) => { this.utilProvider.logError(error.message, 'BLS315', globalConfig.version, true); });

		return;
	}

	async getCurrentPosition() {
		let options: GeolocationOptions = { enableHighAccuracy: true, timeout: 10000 };

		let position = {
			latitude: 0,
			longitude: 0
		};

        /* El timeout del plugin geolocation no está funcionando correctamente,
        por lo cual, implementamos un timeout custom */

		const promise = new Promise((resolve, reject) => {

			// Timeout custom, si la ubicación no la obtenemos después de x segundos, rechazamos la promesa
			const timer = setTimeout(() => {
				clearTimeout(timer);
				reject({ error: 'Custom timeout error.' });
			}, options.timeout)

			// Solicitamos la ubicación actual
			this.geolocation
				.getCurrentPosition(options)
				.then((response: any) => {
					clearTimeout(timer);
					try {
						resolve({
							latitude: response.coords.latitude,
							longitude: response.coords.longitude
						});
					} catch (e) {
						reject(e);
					}
				})
				.catch((error: any) => {
					clearTimeout(timer);
					reject(error);
				});
		});

		await promise
			.then((response: any) => {
				position = response;
			})
			.catch((error) => { });

		return position;
	}

	isUUID(candidate: string) {
		const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return regex.test(candidate);
	}

	isBlackListed(IdOrUUID: any) {
		return find(BluetoothService.blackList.notified, (user: any) => {
			return user.IdOrUUID === IdOrUUID;
		}) ? true : false;
	}

    /**
     * Busca los uuid que tengan como key su mismo valor
     * Se editó el plugin de Android para que esto sea posible
     * Si un key value es igual y es uuid
     * Enviamos un request a la Api
     * @param device 
     */
	sendUUIDCandidate(device: any) {
		const candidates: string[] = [];

		for (let key in device) {
			if (key === device[key] && this.isUUID(key)) {
				candidates.push(key);
			}
		}

		if (includes(candidates, BluetoothService.HARDCODED_SERVICE_1_ANDOID_VERSION)) {
			const uuid = find(candidates, (candidate: any) => {
				return candidate !== BluetoothService.HARDCODED_SERVICE_1_ANDOID_VERSION;
			});

			if (uuid && this.isUUID(uuid) && !this.isBlackListed(uuid)) {
				BluetoothService.blackList.notified.push({
					date: new Date(),
					IdOrUUID: uuid
				});
				this.notifyScannedDevice(uuid, null, device.rssi);
			}
		}
	}

    /**
     * Decodea el advertisement en base64 que genera Android
     * luego obtenemos los paquetes de info
     * Acá buscamos el paquete de tipo 'Manufacturer Specific Data'
     * Acá viene lo "hacky" que ojalá se pueda mejorar en un futuro
     * la data que obtenemos es un unit8Array, se editó el plugin para que
     * cuando fuera un id de usuario, venga al final del arreglo
     * antecedido por tres 14, si se cumple esto sabemos que es un id de usuario
     * @param advertisement 
     */
	decodeAndroidAdvertisementAndFindId(advertisement: any) {
		let id: any = null;
		try {
			const bytes = this.bluetoothLE.encodedStringToBytes(advertisement);
			let packets = bleadvertise.parse(Buffer.from(bytes));

			if (packets) {
				const manufacture = find(packets, (p) => {
					return p.type === 'Manufacturer Specific Data';
				});

				if (manufacture && manufacture.data) {

					const length = manufacture.data.length;
					if (length < 4) return null;

					// Dejamos el arreglo con 4 elementos
					const ids = drop(manufacture.data, manufacture.data.length - 4);

					if (ids[0] !== 14 || ids[1] !== 14 || ids[2] !== 14) return null;

					id = ids[3];
				}
			}
		} catch (e) { }

		return id;
	}

	decodeAndroidManufactureDataAndFindId(manufacturerData: any) {
		let id: number = null;
		const bytes = this.bluetoothLE.encodedStringToBytes(manufacturerData);

		if (!isObject(bytes)) return null;
		const array = values(bytes);

		const length = array.length;
		if (length < 4) return null;

		// Dejamos el arreglo con 4 elementos
		const ids = drop(array, array.length - 4);

		if (ids[0] !== 14 || ids[1] !== 14 || ids[2] !== 14) return null;
		id = ids[3];

		return id;
	}

	sendUUIDCandidatesIOS(device: any) {
		if (isArray(device.advertisement.serviceUuids) && device.advertisement.serviceUuids.length === 2 && device.advertisement.serviceUuids[1] === BluetoothService.HARDCODED_SERVICE_1) {

			if (!this.isBlackListed(device.advertisement.serviceUuids[0].toLowerCase())) {
				BluetoothService.blackList.notified.push({
					date: new Date(),
					IdOrUUID: device.advertisement.serviceUuids[0].toLowerCase()
				});
				this.notifyScannedDevice(device.advertisement.serviceUuids[0].toLowerCase(), null, device.rssi);
			}
		} else {
			if (device.name && device.name.startsWith('5eecf9f6')) {
				const array = device.name.split('-');
				const id: number = (array.length === 2 && isNumber(parseInt(array[1])) ? parseInt(array[1]) : null);
				if (id) {
					BluetoothService.blackList.notified.push({
						date: new Date(),
						IdOrUUID: id
					});
					this.notifyScannedDevice(null, id, device.rssi);
				}
			}
		}
	}

	async stopCentral(): Promise<boolean> {

		// Si está definido el intervalo que limpia la lista negra, lo eliminamos
		if (BluetoothService.blackListCheckInterval) {
			BluetoothService.blackListCheckInterval.unsubscribe();
			BluetoothService.blackListCheckInterval = null;
		}

		// Si está definido la suscripción que devuelve los dispositivos escaneados, lo eliminamos
		if (BluetoothService.scanSubscription) {
			BluetoothService.scanSubscription.unsubscribe();
			BluetoothService.scanSubscription = null;
		}

		return await this.bluetoothLE.stopScan()
			.then(() => true)
			.catch(() => false);
	}

	async stopPeripheral(): Promise<boolean> {

		// Si está definido el intervalo que reinica el advertise, lo eliminamos
		if (BluetoothService.resetPeripheralInterval) {
			BluetoothService.resetPeripheralInterval.unsubscribe();
			BluetoothService.resetPeripheralInterval = null;
		}
		return await this.bluetoothLE.stopAdvertising()
			.then(() => true)
			.catch(() => false);
	}
}
