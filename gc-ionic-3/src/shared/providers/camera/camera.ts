import { Injectable } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Platform } from 'ionic-angular';

import { global } from '../../config/global';
import { constants } from '../../config/constants';
import { UtilProvider } from '../util/util';

@Injectable()
export class CameraProvider {

	constructor(
		private platform: Platform,
		private camera: Camera,
		private utilProvider: UtilProvider) { }

	// Toma o selecciona y retorna una fotografía dependiendo de los parámetros entrantes
	async getPhoto(params: any, isBrowser: boolean, version: any) {

		// Si se ejecuta desde un browser retorna la imagen ficticia
		if (isBrowser) {
			return constants.dummyImage;
		}

		let photo: any = null;

		let options: any = {
			targetHeight: (params.targetHeight ? params.targetHeight : 700),
			targetWidth: (params.targetWidth ? params.targetWidth : 700),
			quality: (params.quality ? params.quality : 70),
			destinationType: (params.destinationType ? params.destinationType : 0), // Base64 por defecto
			correctOrientation: (params.correctOrientation === false ? false : true),
			saveToPhotoAlbum: (params.saveToPhotoAlbum === true ? true : false),
			allowEdit: (params.allowEdit === true ? true : false),
			sourceType: ((params.sourceType || params.sourceType === 0) ? params.sourceType : 1) // Cámara por defecto
		};

		// Abrimos la cámara
		await this.camera
			.getPicture(options)
			.then(async (result: any) => {
				if (result) {

					// if (this.platform.is('android') && params.destinationType === 0) {
					// 	let base64: string = await this.utilProvider.convertLocalFileToBase64(result, true);

					// 	if (base64) {
					// 		photo = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
					// 	}
					// } else {
					// 	// Si el tipo de destino es DATA_URL, debemos agregar 'data:image/jpeg;base64,' al base64
					// }
					photo = (params.destinationType === 0 ? ('data:image/jpeg;base64,' + result) : result);
				}
			}, (error: any) => {
				this.utilProvider.logError(JSON.stringify(error), 'CameraProvider.TakePhoto', version);
			});
		return photo;
	}
}