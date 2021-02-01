import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavParams, NavController, AlertController, LoadingController, ViewController } from 'ionic-angular';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

// Proveedores
import { UtilProvider } from '../../shared/providers/util/util';
import { RequestProvider } from '../../shared/providers/request/request';

// Configuración
import { config } from './no-implementation.config';

import * as _ from 'lodash';
import { globalConfig } from '../../config';

@Component({
	selector: 'no-implementation',
	templateUrl: 'no-implementation.html'
})
export class NoImplementationComponent {

	@ViewChild('provisionalPhoto') provisionalPhoto: ElementRef;
	private context: CanvasRenderingContext2D;

	private photo: any = null;
	private report_id: any = null;
	private is_edit: any = false;

	// Objeto para manejar los motivos de no implementación
	private noImplement: any = {
		reasons: [],
		form: {
			commentary: null,
			sku: null
		},
		selected_reason: null,
		photo: null
	};

	private locked_buttons: boolean = false;

	constructor(private navParams: NavParams,
		private navCrtrl: NavController,
		private alert: AlertController,
		private loading: LoadingController,
		private view: ViewController,
		private geolocation: Geolocation,
		private barcodeScanner: BarcodeScanner,
		private util: UtilProvider,
		private request: RequestProvider) {
		if (!this.navParams.data.reasons || this.navParams.data.reasons.lenght < 1 || !this.navParams.data.photo || !this.navParams.data.report_id) {
			this.util.showToast('Falta información.', 3000);
			this.navCrtrl.pop();
			return;
		}
		this.photo = this.navParams.data.photo;
		this.noImplement.reasons = this.navParams.data.reasons;
		this.report_id = this.navParams.data.report_id;
		this.is_edit = this.navParams.data.is_edit || false;

		if (this.is_edit) {
			this.noImplement.form = {
				commentary: this.photo.implementation.motivo.comentario ? this.photo.implementation.motivo.comentario : null,
				sku: this.photo.implementation.motivo.sku ? this.photo.implementation.motivo.sku : null
			};

			let selected_reason = _.find(this.noImplement.reasons, { id: this.photo.implementation.motivo.id });
			if (selected_reason) this.noImplement.selected_reason = selected_reason;
		}
	}

	// Cierra el modal
	closeModal() {
		this.navCrtrl.pop();
	}

	// Envía un motivo de no implementación
	sendReason() {
		// Bloqueo de botones
		if (this.locked_buttons) return;
		else this.blockButtons();

		if (!this.noImplement.selected_reason) { this.util.showAlert('Atención', 'Debe seleccionar un motivo de no implementación.'); return; }
		if (this.noImplement.selected_reason.requiere_sku && !this.noImplement.form.sku) { this.util.showAlert('Atención', 'Debe indicar los SKU asociado(s) a este motivo.'); return; }

		const alert = this.alert.create({
			title: 'Atención',
			message: '¿Está seguro que desea enviar este motivo de no implementación?',
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: 'Enviar',
				handler: async () => {
					let url_image = null;

					const loading = this.loading.create({ content: 'Enviando motivo' });
					loading.present();

					let positon: any = await this.getPosition();
					// Si es una edición y hay foto de implementación, la conservamos
					if (this.is_edit && this.photo.implementation && this.photo.implementation.url) {
						try {
							// Como lo que debemos enviar es un base64 agregamos la url a un canvas y obtenemos el base64
							this.context = this.provisionalPhoto.nativeElement.getContext('2d');
							let image = new Image();
							image.crossOrigin = 'Anonymous';
							image.src = this.photo.implementation.url;
							url_image = await this.getBase64FromCanvas(image);
						} catch (e) { }
					}

					// Cuerpo para enviar al servicio, un motivo de no implementación se agrega de igual
					// forma que una foto, solo que con el base64 null
					let noImplementBody: any = {
						latitud: positon.latitude,
						longitud: positon.longitude,
						motivo: {
							id: this.noImplement.selected_reason.id,
							comentario: this.noImplement.form.commentary
						},
						foto: {
							base64: url_image,
							parent_id: this.photo.id
						},
						reporte: {
							id: this.report_id
						},
						objeto: {
							id: null,
							foto: url_image,
							comentario: (this.photo.commentary_form || null),
							parent: {
								id: this.photo.id
							}
						}
					};
					if (this.noImplement.selected_reason.requiere_sku) {
						noImplementBody.motivo.sku = this.noImplement.form.sku;
					}
					
					this.request
						.post(config.endpoints.newApi.post.addPhoto, noImplementBody, config.useNewApi)
						.then((response: any) => {
							loading.dismiss();
							try {
								// Parseamos la respuesta y si obtenemos el id generado, el motivo se agregó correctamente
								let implementation = (this.util.isJson(response) ? JSON.parse(response) : response);
								if (implementation.data && implementation.data.id) {
									implementation.data.url = url_image;
									// Agregamos la implementación a la foto de referencia
									implementation.data.motivo = {
										id: this.noImplement.selected_reason.id,
										comentario: noImplementBody.motivo.comentario,
										nombre: _.find(this.noImplement.reasons, { id: this.noImplement.selected_reason.id }).nombre
									};
									if (this.noImplement.selected_reason.requiere_sku) {
										implementation.data.motivo.sku = this.noImplement.form.sku;
									}
									this.photo.implementation = implementation.data;
									this.view.dismiss({ photo: this.photo, implemented: true });
								}
							} catch (e) { this.util.showAlert('Atención', 'No ha sido posible enviar el motivo de no implementación, intente nuevamente.'); }
						})
						.catch((error: any) => {
							try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
							loading.dismiss();
							this.util.showAlert('Atención', 'No ha sido posible enviar el motivo de no implementación, intente nuevamente.');
						});
				}
			}]
		});
		alert.present();
	}

	// Retorna la posición actual del dispositivo
    async getPosition() {
        let position: any = {
            latitude: 0,
            longitude: 0
        };

        // Si el gps está apagado, retornamos lat:0 y lng: 0
        if (!await this.util.checkGpsEnabled()) {
            return position;
        }

        let options: GeolocationOptions = { enableHighAccuracy: true, timeout: 15000 };

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

	// Retorna la imágen del canvas en base64
	async getBase64FromCanvas(image: any) {
		let url_image = await new Promise((resolve) => {
			try {
				image.onload = () => {
					this.context.canvas.width = image.width;
					this.context.canvas.height = image.height;
					this.context.drawImage(image, 0, 0, image.width, image.height);
					resolve(this.context.canvas.toDataURL());
				}
			} catch (e) { resolve(null); }
		});
		return url_image;
	}

	// Bloqueamos los botones por 1.5 segundos
	blockButtons() {
		this.locked_buttons = true;
		setTimeout(() => {
			this.locked_buttons = false;
		}, 1500);
	}

	// Escanea un sku y lo agrega al formulario
	scanSku() {
		this.barcodeScanner.scan()
			.then(barcodeData => {
				if (barcodeData.text) {
					if (this.noImplement.form.sku) {
						if (this.noImplement.form.sku.charAt(this.noImplement.form.sku.length - 1) !== ',') {
							this.noImplement.form.sku += ', ' + barcodeData.text;
						} else {
							this.noImplement.form.sku += barcodeData.text;
						}
					} else {
						this.noImplement.form.sku = barcodeData.text;
					}
				}
				if (this.noImplement.form.sku) this.noImplement.form.sku = this.noImplement.form.sku.replace(/\s/g, '');
			})
			.catch(err => {
				this.util.showToast('Ningún código escaneado', 3000);
			});
	}
}