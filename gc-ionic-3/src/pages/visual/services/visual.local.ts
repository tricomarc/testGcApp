import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Events } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';

import { UUID } from 'angular2-uuid';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';

import { config } from '../branch-office/send-report/send-report.config';

import { global } from '../../../shared/config/global';

@Injectable()

export class VisualLocalProvider {

	constructor(private storage: Storage,
		private events: Events,
		private fileTransfer: FileTransfer,
		private request: RequestProvider) { }

	// Agrega una implementación a la base de datos local en caso de que no esté
	saveImplementation(implementation: any, overwrite: boolean) {
		return new Promise(async (resolve, reject) => {
			// Si no se recibe una implementación cortamos la ejecución del método
			if (!implementation) { reject(); return; }
			// Obtenemos las implementaciones guardadas localmente
			let implementations: any = await this.getImplementations();
			// Verificamos que no exista una implementación guardada con las mismas claves únicas
			let temp = _.find(implementations, { report_id: implementation.report_id, parent_id: implementation.parent_id });
			// Si no existe, guardamos la implementación localmente
			if (!temp) {
				implementations.push(implementation);
				this.storage
					.set('visual_implementations', JSON.stringify(implementations))
					.then(async () => {
						resolve();
					})
					.catch(() => reject());
			} else if (overwrite) { // Si la encontramos y debemos sobre escribirla
				// Eliminamos la implementación encontrada
				_.remove(implementations, temp);
				// Agregamos la nueva implementación
				implementations.push(implementation);
				// Guardamos el arreglo de implementaciones con los cambios
				this.storage
					.set('visual_implementations', JSON.stringify(implementations))
					.then(async () => {
						resolve();
					})
					.catch(() => reject());
			} else { reject(); }
		});
	}

	// Agrega una foto adicional a la base de datos local en caso de que no esté
	saveOptionalPhoto(optional: any) {
		return new Promise(async (resolve, reject) => {
			// Si no se recibe una foto adicional cortamos la ejecución del método
			if (!optional) { reject(); return; }

			// Obtenemos las fotos adicionales guardadas localmente
			let optionals: any = await this.getOptionals();

			// Nos aseguramos de que la foto adicional no esté guardada
			let temp = _.find(optionals, (obj) => {
				return obj.url === optional.url || obj.key === optional.key;
			});

			// Si existe paramos la ejecución del método
			if (temp) {
				reject();
				return;
			}

			// Asignamos una key única a la foto adicional, para comparar más tarde
			optional.key = UUID.UUID();
			// Agregamos un flag que indica que esta foto opcional fue guardada localmente
			optional.saved_locally = true;

			optionals.push(optional);
			this.storage
				.set('visual_optionals', JSON.stringify(optionals))
				.then(async () => {
					resolve(optional);
				})
				.catch(() => reject());
		});
	}

	// Reintenta enviar las implementaciones guardadas en la base de datos local
	retryUploadImplementations() {
		return new Promise((resolveMethod, rejectMethod) => {
			// Esperamos 1 segundos ya que cuando se detecta que hay conexión
			// No significa que esté lista para utilizar
			setTimeout(async () => {
				// Obtenemos las implementaciones guardadas localmente
				let implementations: any = await this.getImplementations();

				// Si el arreglo de implementaciones no está vacío
				if (implementations.length) {
					// Avisamos al usuario que estamos sincronizando las implementaciones locales
					this.events.publish('synchronizing_implementations');

					let implementations_promise: any = [];

					// Recorremos las implementaciones guardadas localmente y las agregamos al arreglo de promesas
					_.forEach(implementations, (implementation) => {
						// Si la implementación guardada es una foto
						if (implementation.type === 'photo') {
							// Agregamos la promesa del request que envía la implementación de foto
							implementations_promise.push(
								new Promise((resolve, reject) => {
									this.request
										.post(config.endpoints.newApi.post.addPhoto, implementation.body, true)
										.then((response: any) => {
											// Agregamos report_id y tipo para proceder a eliminar los registros locales
											// En caso de que se envíen estas implementaciones
											if (response.data && response.data.id) {
												response.extra = {
													type: implementation.type,
													report_id: implementation.report_id
												};
												resolve(response);
											} else {
												reject();
											}
										})
										.catch((error: any) => {
											reject(error);
										});
								})
							);
						} else if (implementation.type === 'video') {
							// Agregamos la promesa del filetransfer que envía la implementación de video
							implementations_promise.push(
								new Promise((resolve, reject) => {
									// Creamos una instancia de file transfer
									const transfer: FileTransferObject = this.fileTransfer.create();
									// Comenzamos con la subida del video
									transfer.upload(implementation.video_path, (global.API_NEW + config.endpoints.newApi.post.addVideo), implementation.body)
										.then((response: any) => {
											try {
												// Si obtuvimos un id quiere decir que el video se registró
												let temp = JSON.parse(response.response);

												// Agregamos report_id y tipo para proceder a eliminar los registros locales
												// En caso de que se envíen estas implementaciones
												if (temp && temp.data && temp.data.id) {
													temp.extra = {
														type: implementation.type,
														report_id: implementation.report_id
													};
													resolve(temp);
												} else {
													reject();
												}
											} catch (e) {
												reject(e);
											}
										})
										.catch((error: any) => {
											reject(error);
										});
								})
							);
						}
					});

					// Esperamos que se ejecuten todas las promesas y obtenemos sus resultados
					Promise.all(implementations_promise)
						.then((response: any) => {
							// Eliminamos las implementaciones que se enviaron correctamente
							this.deleteMultiImplementations(response)
								.then(() => {
									this.events.publish('local_implementations_uploaded', response);
									resolveMethod();
								})
								.catch((error: any) => {
									this.events.publish('local_implementations_uploaded', []);
									rejectMethod();
								});
						})
						.catch((error: any) => {
							rejectMethod();
						});
				} else {
					resolveMethod();
				}
			}, 1000);
		});
	}

	// Reintenta enviar las fotos adicionales guardadas en la base de datos local
	retryUploadOptionals() {
		return new Promise((resolveMethod, rejectMethod) => {
			// Esperamos 1 segundos ya que cuando se detecta que hay conexión
			// No significa que esté lista para utilizar
			setTimeout(async () => {
				let optionals: any = await this.getOptionals();

				if (optionals.length) {
					// Avisamos al usuario que estamos sincronizando las fotos adicionales locales
					this.events.publish('synchronizing_implementations');

					let optionals_promise: any = [];

					// Recorremos las fotos adicionales guardadas localmente y las agregamos al arreglo de promesas
					_.forEach(optionals, (optional) => {
						optionals_promise.push(
							new Promise((resolve, reject) => {
								this.request
									.post(config.endpoints.newApi.post.addPhoto, optional.body, true)
									.then((response: any) => {
										// Agregamos report_id y key para proceder a eliminar los registros locales
										// En caso de que se envíen estas fotos adicionales
										if (response.data && response.data.id) {
											response.extra = {
												key: optional.key
											};
											resolve(response);
										} else {
											reject();
										}
									})
									.catch((error: any) => {
										reject(error);
									});
							})
						);
					});

					// Esperamos que se ejecuten todas las promesas y obtenemos sus resultados
					Promise.all(optionals_promise)
						.then((response: any) => {
							// Eliminamos las fotos adicionales que se enviaron correctamente
							this.deleteMultiOptionals(response)
								.then(() => {
									this.events.publish('local_optionals_uploaded', response);
									resolveMethod();
								})
								.catch((error: any) => {
									this.events.publish('local_optionals_uploaded', []);
									rejectMethod();
								});
						})
						.catch((error: any) => {
							rejectMethod();
						});
				} else {
					resolveMethod();
				}
			}, 1000);
		});
	}

	// Obtiene la lista de implementaciones guardadas localmente
	async getImplementations() {
		let implementations: any = [];
		await this.storage
			.get('visual_implementations')
			.then((result: any) => {
				try {
					if (result) implementations = JSON.parse(result);
				} catch (e) { }
			})
			.catch((error: any) => { });
		return implementations;
	}

	// Obtiene la lista de fotos adicionales guardadas localmente
	async getOptionals() {
		let optionals: any = [];
		await this.storage
			.get('visual_optionals')
			.then((result: any) => {
				try {
					if (result) optionals = JSON.parse(result);
				} catch (e) { }
			})
			.catch((error: any) => { });
		return optionals;
	}

	// Retorna las implementaciones de un reporte específico
	async getImplementationsByReport(report_id: any) {
		let implementations: any = [];
		await this.storage
			.get('visual_implementations')
			.then((result: any) => {
				try {
					let temp = JSON.parse(result);
					if (temp) {
						implementations = _.filter(temp, { report_id: report_id });
					}
				} catch (e) { }
			})
			.catch((error: any) => { });
		return implementations;
	}

	// Retorna las fotos adicionales de un reporte específico
	async getOptionalsByReport(report_id: any) {
		let optionals: any = [];
		await this.storage
			.get('visual_optionals')
			.then((result: any) => {
				try {
					let temp = JSON.parse(result);
					if (temp) {
						optionals = _.filter(temp, { body: { reporte: { id: report_id } } });
					}
				} catch (e) { }
			})
			.catch((error: any) => { });
		return optionals;
	}

	// Elimina una implementación local
	deleteLocalImplementation(report_id: any, photo: any) {
		return new Promise(async (resolve, reject) => {
			if (!photo || !photo.id) { reject(); return; }
			// Traemos las implementaciones guardadas localmente
			let implementations: any = await this.getImplementations();
			// Buscamos la implementación a eliminar
			let temp = _.find(implementations, { report_id: report_id, parent_id: photo.id });
			if (temp) {
				// Si la encontramos la eliminamos y guardamos el nuevo arreglo
				let removed_implementation = _.remove(implementations, temp);
				if (removed_implementation && removed_implementation.length) {
					await this.storage
						.set('visual_implementations', JSON.stringify(implementations))
						.then(() => resolve())
						.catch(() => reject());
				} else {
					reject();
				}
			} else {
				reject();
			}
		});
	}

	// Elimina una foto adicional local
	deleteLocalOptional(optional: any) {
		return new Promise(async (resolve, reject) => {
			if (!optional) { reject(); return; }
			// Traemos las fotos adicionales guardadas localmente
			let optionals: any = await this.getOptionals();
			// Buscamos la implementación a eliminar
			let temp = _.find(optionals, (obj) => {
				return obj.key === optional.key || obj.url === optional.url;
			});
			if (temp) {
				// Si la encontramos la eliminamos y guardamos el nuevo arreglo
				let removed_optional = _.remove(optionals, temp);
				if (removed_optional && removed_optional.length) {
					await this.storage
						.set('visual_optionals', JSON.stringify(optionals))
						.then(() => resolve())
						.catch(() => reject());
				} else {
					reject();
				}
			} else {
				reject();
			}
		});
	}

	// Recibe un arreglo de respuestas y elimina las implementaciones que se enviaron correctamente
	deleteMultiImplementations(response: any) {
		return new Promise(async (resolve, reject) => {
			// Traemos las implementaciones guardadas localmente
			let implementations: any = await this.getImplementations();
			if (implementations.length) {
				let implementations_to_remove: any = [];
				// Recorremos las respuestas de la API
				_.forEach(response, (temp) => {
					// Si se cumplen estas condiciones la implementación se envió correctamente
					if (temp.code === 200 && temp.data && temp.data.id) {
						// Agregamos la implementación de la base de datos local al arreglo para eliminar
						implementations_to_remove.push({ report_id: temp.extra.report_id, parent_id: temp.data.parent_id });
					}
				});

				// Recorremos las implementaciones a eliminar y las borramos de la base de datos local
				_.forEach(implementations_to_remove, (implementation) => {
					_.remove(implementations, implementation);
				});

				// Guardamos el nuevo arreglo de implementaciones
				await this.storage
					.set('visual_implementations', JSON.stringify(implementations))
					.then(() => resolve())
					.catch((error) => reject(error));
			} else {
				reject(null);
			}
		});
	}

	// Recibe un arreglo de respuestas y elimina las fotos adicionales que se enviaron correctamente
	deleteMultiOptionals(response: any) {
		return new Promise(async (resolve, reject) => {
			// Traemos las fotos adicionales guardadas localmente
			let optionals: any = await this.getOptionals();
			if (optionals.length) {
				let optionals_to_remove: any = [];
				// Recorremos las respuestas de la API
				_.forEach(response, (temp) => {
					// Si se cumplen estas condiciones la foto adicional se envió correctamente
					if (temp.code === 200 && temp.data && temp.data.id) {
						// Agregamos la foto adicional de la base de datos local al arreglo para eliminar
						optionals_to_remove.push({ key: temp.extra.key });
					}
				});

				// Recorremos las fotos adicionales a eliminar y las borramos de la base de datos local
				_.forEach(optionals_to_remove, (optional) => {
					_.remove(optionals, optional);
				});

				// Guardamos el nuevo arreglo de fotos adicionales
				await this.storage
					.set('visual_optionals', JSON.stringify(optionals))
					.then(() => resolve())
					.catch((error) => reject(error));
			} else {
				reject(null);
			}
		});
	}
}