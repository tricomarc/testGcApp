import { Component, Input, ViewChild, NgZone, OnDestroy, OnInit } from '@angular/core';
import { AlertController, Platform, Events, LoadingController, Slides, ModalController } from "ionic-angular";
import { } from '@angular/core';
import { } from "ionic-angular";
import { UUID } from 'angular2-uuid';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileTransfer, FileUploadOptions } from '@ionic-native/file-transfer';

import { globalConfig } from '../../../../config';

import * as _ from 'lodash';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import { Avram } from '../../../../shared/custom-plugins/avram';
import { global } from '../../../../shared/config/global';
import { checklistConfig } from '../../checklists.config';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { ISession } from '../../../../shared/interfaces/session.interface';
import { QuestionnaireComponent } from '../questionnaire/questionnaire';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { interval } from 'rxjs';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

@Component({
	selector: 'photo-question',
	templateUrl: 'photo-question.html'
})
export class PhotoQuestionComponent implements OnInit, OnDestroy {

	@ViewChild(Slides) slides: Slides;

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;

	private ambitId = null;
	private position = null;

	private isSlideBeginning: boolean = true;
	private isSlideEnd: boolean = false;

	private ram: number = 200;

	constructor(
		private camera: CameraProvider,
		private avram: Avram,
		private alertController: AlertController,
		private platform: Platform,
		private fileTransfer: FileTransfer,
		private zone: NgZone,
		private loadingController: LoadingController,
		private events: Events,
		private modal: ModalController,
		private utilProvider: UtilProvider) {
	}

	ngOnInit() {
		this.ambitId = QuestionnaireComponent.ambitId;
		this.position = QuestionnaireComponent.position;
	}

	ngOnDestroy() { }

	// Cambia a la siguiente slide de la derecha en caso de que exista
	goToRightSlide() {
		if (!this.slides.isEnd()) {
			this.slides.slideNext(500);
		}
	}

	// Cambia a la siguiente slide de la izquierda en caso de que exista
	goToLeftSlide() {
		if (!this.slides.isBeginning()) {
			this.slides.slidePrev(500);
		}
	}

	// Cambia a la primera slide
	goToFirstSlide() {
		if (this.slides.length()) {
			this.slides.slideTo(0, 500);
		}
	}

	// Cambia a la última slide
	goToLastSlide() {
		if (this.slides.length()) {
			this.slides.slideTo((this.slides.length() - 1), 500);
		}
	}

	// Elimina una fotografía de la respuesta de la pregunta
	deletePhoto(photo: any) {
		// Si la foto cuenta con un identificador único, la borramos utilizando ese parámetro
		if (photo.uuid) {
			_.remove(this.question.respuesta.foto, { uuid: photo.uuid });
		} else {
			// Si no, la borramos utilizando su URL
			_.remove(this.question.respuesta.foto, { foto: photo.foto });
		}
		setTimeout(() => this.goToFirstSlide(), 500);

		this.ambitState.next(true);

		// Si nos quedamos sin fotos, decimos que la pregunta está incompleta
		if (!this.question.respuesta || !this.question.respuesta.foto || !this.question.respuesta.foto.length) {
			if (this.question.validations) {
				this.question.validations.isIncomplete = true;
				return;
			}
			this.question.validations = { isIncomplete: true, missingRequiredPhoto: false };
		}
	}

	// Vuelve a tomar una fotografía y la reemplaza
	async changePhoto(photo: any, fromCameraPlugin?: boolean) {
		const params = {
			targetHeight: 700,
			targetWidth: 700,
			quality: 70,
			destinationType: 1
		}

		if (this.platform.is('android')) {
			const ram: number = await this.getAvailableRAM();

			this.utilProvider.logError(`RAM WARNING: ${ram}`, 'RW01', globalConfig.version, true);

			if (ram > 0 && ram <= this.ram) {

				const alert = this.alertController.create({
					title: 'Atención',
					message: `Tu dispositivo solo cuenta con ${Math.round(ram)} MB de memoria RAM disponible, te recomendamos enviar tu avance actual y cerrar otras aplicaciones antes de adjuntar fotografías para evitar fallas.`,
					buttons: [{
						text: 'Entiendo',
						handler: () => { }
					}, {
						text: 'Tomar fotografía',
						handler: async() => {
							let image = null;
							if(fromCameraPlugin){
								image = await this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version)
							}else {
								image = await this.getImageCamera()
							}

							const index: number = _.findIndex(this.question.respuesta.foto, (p) => {
								return p.foto === photo.foto;
							});
							let photos: any[] = await this.uploadImage(image, index);
							if (photos && _.isArray(photos) && photos.length) {

								photos = this.move(photos, (photos.length - 1), index);

								this.question.respuesta.foto = photos.map((p) => {
									return {
										foto: p.url,
										uuid: (p.uuid ? p.uuid : UUID.UUID())
									}
								});
								this.ambitState.next(true);
							}
							return;
						}
					}]
				});
				alert.present();
				return;
			}
		}

		let image = null;
		if(fromCameraPlugin){
			image = await this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version)
		}else {
			image = await this.getImageCamera()
		}

		if (image) {
			const index: number = _.findIndex(this.question.respuesta.foto, (p) => {
				return p.foto === photo.foto;
			});
			let photos: any[] = await this.uploadImage(image, index);
			if (photos && _.isArray(photos) && photos.length) {

				photos = this.move(photos, (photos.length - 1), index);

				this.question.respuesta.foto = photos.map((p) => {
					return {
						foto: p.url,
						uuid: (p.uuid ? p.uuid : UUID.UUID())
					}
				});
				this.ambitState.next(true);
			}
			return;
		}
	}


	async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                // this.view = 'CAMERA';
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
                modal.present();
                modal.onDidDismiss((data) => {
                    // this.view = 'CONTENT';
                    const image = data && data.image || null;
                    return resolve(image);
                });

            } catch (error) {
                return resolve(null);
            }
        })
	}
	
	// Toma una fotografía y la asigna a una respuesta de foto única
	async takePhoto(fromCameraPlugin?: boolean) {
		const params = {
			targetHeight: 700,
			targetWidth: 700,
			quality: 70,
			destinationType: 1
		}

		if (this.platform.is('android')) {
			const ram: number = await this.getAvailableRAM();

			this.utilProvider.logError(`RAM WARNING: ${ram}`, 'RW02', globalConfig.version, true);

			if (ram > 0 && ram <= this.ram) {

				const alert = this.alertController.create({
					title: 'Atención',
					message: `Tu dispositivo solo cuenta con ${Math.round(ram)} MB de memoria RAM disponible, te recomendamos enviar tu avance actual y cerrar otras aplicaciones antes de adjuntar fotografías para evitar fallas.`,
					buttons: [{
						text: 'Entiendo',
						handler: () => { }
					}, {
						text: 'Tomar fotografía',
						handler: () => {
							this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version)
								.then((image) => {
									this.question.respuesta.data = image;
									if (this.question.validate) {
										this.question.validations = this.question.validate(this.question);
									}
								})
								.catch(() => { });
						}
					}]
				});
				alert.present();
				return;
			}
		}

		let image = null;
		if (fromCameraPlugin) {
			image = await this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version);
		}else {
			image = await this.getImageCamera();
		}

		if (image) {
			const photos: any[] = await this.uploadImage(image);

			if (photos && _.isArray(photos) && photos.length) {
				this.question.respuesta.data = photos[photos.length - 1].url;
				if (this.question.validate) {
					this.question.validations = this.question.validate(this.question);
				}
				this.ambitState.next(true);
			}
			return;
		}
	}

	// Toma una foto y la agrega al arreglod de fotos múltimples
	async addPhoto(fromCameraPlugin?: boolean) {
		const params = {
			targetHeight: 700,
			targetWidth: 700,
			quality: 70,
			destinationType: 1
		}

		if (this.platform.is('android')) {
			const ram: number = await this.getAvailableRAM();

			this.utilProvider.logError(`RAM WARNING: ${ram}`, 'RW03', globalConfig.version, true);

			if (ram > 0 && ram <= this.ram) {
				const alert = this.alertController.create({
					title: 'Atención',
					message: `Tu dispositivo solo cuenta con ${Math.round(ram)} MB de memoria RAM disponible, te recomendamos enviar tu avance actual y cerrar otras aplicaciones antes de adjuntar fotografías para evitar fallas.`,
					buttons: [{
						text: 'Entiendo',
						handler: () => { }
					}, {
						text: 'Tomar fotografía',
						handler: () => {
							this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version)
								.then((image) => {
									this.question.respuesta.foto.push({
										foto: image,
										uuid: UUID.UUID()
									});
									setTimeout(() => this.goToLastSlide(), 500);
									if (this.question.validate) {
										this.question.validations = this.question.validate(this.question);
									}
								})
								.catch(() => { });
						}
					}]
				});
				alert.present();
				return;
			}
		}


		let image = null;
		if(fromCameraPlugin){
			image = await this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version);
		}else{
			image = await this.getImageCamera();
		}

		if (image) {
			const photos: any[] = await this.uploadImage(image);


			if (photos && _.isArray(photos) && photos.length) {

				this.question.respuesta.foto = photos.map((p) => {
					return {
						foto: p.url,
						uuid: (p.uuid ? p.uuid : UUID.UUID())
					}
				});

				setTimeout(() => this.goToLastSlide(), 500);
				if (this.question.validate) {
					this.question.validations = this.question.validate(this.question);
				}
				this.ambitState.next(true);
			}
			return;
		}
	}

	async getAvailableRAM(): Promise<number> {
		return await this.avram.getAvailableRAM()
			.then((res) => {
				if (res && res.availableMemory && _.isNumber(res.availableMemory)) {
					return res.availableMemory;
				}
			})
			.catch((err) => {
				this.utilProvider.logError(JSON.stringify(err), 'AVR01', globalConfig.version);
				return -1;
			});
	}

	async uploadImage(file: string, ind?: number): Promise<any[]> {

		const session: ISession = SessionProvider.state.value;

		if (!session || !session.sessionId) {
			this.utilProvider.showToast('Falta información de la sesión.', 3000);
			return null;
		}

		const params = {
			ambito_id: this.ambitId,
			checklist_id: this.checklist.id,
			latitud: this.position ? this.position.latitude : null,
			longitud: this.position ? this.position.longitude : null,
			'respuestas[0][cuestionario_id]': ((this.question.PQQuestionnaireId && this.question.isAlternative) ? this.question.PQQuestionnaireId : this.question.cuestionario_id),
			'respuestas[0][cuestionario_sucursal_id]': ((this.question.PQQuestionnaireStoreId && this.question.isAlternative) ? this.question.PQQuestionnaireStoreId : this.question.cuestionario_sucursal_id),
			'respuestas[0][pregunta_tipo_id]': ((this.question.PQTypeId && this.question.isAlternative) ? this.question.PQTypeId : this.question.tipo_id),
			'respuestas[0][alternativa_tipo_id]': (this.question.isAlternative ? this.question.tipo_id : null),
			'respuestas[0][pregunta_id]': ((this.question.isAlternative && this.question.PQId) ? this.question.PQId : this.question.id),
			'respuestas[0][alternativa_id]': (this.question.isAlternative ? this.question.id : null),
			'respuestas[0][incidencia_id]': null,
			'respuestas[0][alternativa_nombre]': (this.question.isAlternative ? this.question.texto : null),
			'respuestas[0][pregunta_nombre]': ((this.question.PQName && this.question.isAlternative) ? this.question.PQName : this.question.pregunta),
			'respuestas[0][peso]': ((this.question.isAlternative && this.question.peso) ? this.question.peso : null),
			'respuestas[0][checklist_nombre]': null,
			'respuestas[0][ambito_nombre]': null,
			'respuestas[0][ambito_id]': this.ambitId,
			'respuestas[0][respuesta][checked]': this.question.isAlternative ? true : null,
			'respuestas[0][respuesta][alternativa_id]': null,
			'respuestas[0][respuesta][no_aplica]': ((this.question.PQNoAplica > -1 && this.question.PQNoAplica < 3) ? this.question.PQNoAplica : 2),
			'respuestas[0][multi_foto]': (this.question.multi_foto == 1 ? 1 : 0)
		};

		if (this.question.multi_foto === 0) {
			params['respuestas[0][respuesta][foto]'] = '';
		}

		if (!this.question.respuesta.foto || !_.isArray(this.question.respuesta.foto)) {
			this.question.respuesta.foto = [];
		}

		let index: number = 0;

		let removed = null;

		if (this.question.multi_foto === 1) {

			if (_.isNumber(ind) && ind >= 0) {
				const pulled = _.pullAt(this.question.respuesta.foto, ind);
				if (pulled && pulled.length) removed = pulled[0];
			}

			if (this.question.respuesta.foto.length) {
				this.question.respuesta.foto.forEach((item: any) => {
					params[`respuestas[0][respuesta][foto][${index}][foto]`] = item.foto;
					params[`respuestas[0][respuesta][foto][${index}][uuid]`] = UUID.UUID();
					index++;
				});
			}
			params[`respuestas[0][respuesta][foto][${index}][uuid]`] = UUID.UUID();
		}

		let transfer = this.fileTransfer.create();
		const options: FileUploadOptions = {
			fileKey: this.question.multi_foto == 0 ? 'respuestas[0][respuesta][data]' : `respuestas[0][respuesta][foto][${index}][foto]`,
			fileName: `${UUID.UUID()}.jpg`,
			headers: { 'Authorization': session.token },
			params: params,

		};

		console.log('options', options)

		const loading = this.loadingController.create({
			content: 'Subiendo imagen...'
		});

		loading.present();

		let duration = 0;

		const intv = interval(1000).subscribe(() => {
			duration++;
			if (duration >= 60) {
				transfer.abort();
			}
		});

		// Comenzamos con la subida del archivo
		return await transfer.upload(file, (`${global.API_NEW}${checklistConfig.endpoints.newApi.post.sendAnswers}`), options)
			.then(async (result: any) => {

				loading.dismiss();

				try {
					intv.unsubscribe();
				} catch (e) { }


				if (result.response) {
					try {
						const temp = JSON.parse(result.response);
						return temp.data.fotos;
					} catch (e) {

						try {
							let base64: string = ('data:image/jpeg;base64,' + file);
							// Si falla la subida, obtenemos la foto local en base64
							// let base64: string = await this.utilProvider.convertLocalFileToBase64(file, true);
							if (base64) {
								// base64 = ('data:image/jpeg;base64,' + base64.split('base64,').pop());

								const temp = this.question.respuesta.foto.map(p => {
									return {
										url: p.foto,
										uuid: p.uuid ? p.uuid : UUID.UUID()
									}
								});

								temp.push({
									url: base64,
									text: ''
								});

								this.utilProvider.showAlert('Atención', 'Si no visualizas correctamente alguna imagen, verifica tu conexión a internet.');

								return temp;
							}
						} catch (e) { }

						if (removed) {
							this.question.respuesta.foto.push(removed);
							this.move(this.question.respuesta.foto, this.question.respuesta.foto.length - 1, index);
						}
						this.utilProvider.showToast('No ha sido posible subir la fotografía, intente nuevamente.', 3000);
						this.utilProvider.logError(e, 'PHUP01', globalConfig.version);
						return null;
					}
				} else {

					try {
						// Si falla la subida, obtenemos la foto local en base64
						let base64: string = ('data:image/jpeg;base64,' + file);
						// let base64: string = await this.utilProvider.convertLocalFileToBase64(file, true);
						if (base64) {
							// base64 = ('data:image/jpeg;base64,' + base64.split('base64,').pop());

							const temp = this.question.respuesta.foto.map(p => {
								return {
									url: p.foto,
									uuid: p.uuid ? p.uuid : UUID.UUID()
								}
							});

							temp.push({
								url: base64,
								text: ''
							});

							this.utilProvider.showAlert('Atención', 'Si no visualizas correctamente alguna imagen, verifica tu conexión a internet.');

							return temp;
						}
					} catch (e) { }


					if (removed) {
						this.question.respuesta.foto.push(removed);
						this.move(this.question.respuesta.foto, this.question.respuesta.foto.length - 1, index);
					}
					this.utilProvider.showToast('No ha sido posible subir la fotografía, intente nuevamente.', 3000);
					this.utilProvider.logError(result, 'PHUP02', globalConfig.version);
					return null;
				}
			})
			.catch(async (error: any) => {

				loading.dismiss();

				try {
					intv.unsubscribe();
					// Si falla la subida, obtenemos la foto local en base64
					let base64: string = ('data:image/jpeg;base64,' + file);
					// let base64: string = await this.utilProvider.convertLocalFileToBase64(file, true);
					if (base64) {
						// base64 = ('data:image/jpeg;base64,' + base64.split('base64,').pop());

						const temp = this.question.respuesta.foto.map(p => {
							return {
								url: p.foto,
								uuid: p.uuid ? p.uuid : UUID.UUID()
							}
						});

						temp.push({
							url: base64,
							text: ''
						});

						this.utilProvider.showAlert('Atención', 'Si no visualizas correctamente alguna imagen, verifica tu conexión a internet.');

						return temp;
					}
				} catch (e) { }

				if (removed) {
					this.question.respuesta.foto.push(removed);
					this.move(this.question.respuesta.foto, this.question.respuesta.foto.length - 1, index);
				}

				this.utilProvider.showToast('No ha sido posible subir la fotografía, intente nuevamente.', 3000);
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				return null;
			});
	}

	move(arr, old_index, new_index) {
		if (new_index >= arr.length) {
			var k = new_index - arr.length + 1;
			while (k--) {
				arr.push(undefined);
			}
		}
		arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
		return _.cloneDeep(arr);
	}
}