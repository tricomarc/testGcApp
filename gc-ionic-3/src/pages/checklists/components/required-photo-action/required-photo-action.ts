import { Component, Input, ViewChild } from '@angular/core';
import { ModalController, Slides } from "ionic-angular";
import { UUID } from 'angular2-uuid';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { globalConfig } from '../../../../config';

import * as _ from 'lodash';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

@Component({
	selector: 'required-photo-action',
	templateUrl: 'required-photo-action.html'
})
export class RequiredPhotoActionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;
	@Input() currentUbi;
	@Input() auxAmbitId;

	constructor(
		private camera: CameraProvider,
		private modal: ModalController,
		private utilProvider: UtilProvider) {}

	ngOnInit() { }

	// Toma una fotografía y la asigna a una respuesta de foto única
	async takePhoto(fromCameraPlugin?: boolean) {
		let image = null;
		if(fromCameraPlugin){
			const params = { 
				targetHeight: 700,
				targetWidth: 700,
				quality: 70,
				destinationType: 0
			}
			this.camera.getPhoto(params, globalConfig.isBrowser, globalConfig.version)
				.then((_image) => { image = _image })
				.catch(() => { });
		}else{
			image = await this.getImageCamera();
		}

		this.ambitState.next(true);
		// Si ya existe el atributo respuesta
		// asignamos obligatorio.foto a la respuesta
		if (this.question.respuesta) {
			this.question.respuesta.obligatorio = {
				foto: image
			};
		} else {
			// Si no, lo creamos
			this.question.respuesta = {
				obligatorio: {
					foto: image
				},
				data: null,
				foto: [],
				checked: false
			}
		}

		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}
	}

	async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
                modal.present();
                modal.onDidDismiss((data) => {
                    const image = data && data.image || null;
                    return resolve(image);
                });

            } catch (error) {
                return resolve(null);
            }
        })
    }
}