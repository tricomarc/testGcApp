import { ApplicationRef, Component, Input, ViewChild } from '@angular/core';
import { PreguntasChecklistDirectiveComponent } from "../../preguntas-checklist-directive/preguntas-checklist-directive";
import { globalConfig } from "../../../../../config";
import { Camera, CameraOptions } from "@ionic-native/camera";
import { DetallePage } from '../../../sub-pages/detalle/detalle';
import * as _ from 'lodash';
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { ModalController, Platform, Slides } from "ionic-angular";
import { global } from "../../../../../shared/config/global";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CameraComponent } from '../../../../../shared/providers/camera/component/camera';
/**
 * Generated class for the SubfotoVisitaDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'subfoto-visita-directive',
    templateUrl: 'subfoto-visita-directive.html'
})
export class SubfotoVisitaDirectiveComponent {

    @Input() alternativa: {};
    @ViewChild(Slides) slides: Slides;
    @Input() ambitState: BehaviorSubject<any>;
    private view: string = null;
    constructor(
        private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent,
        private detalle: DetallePage,
        private util: UtilProvider,
        public camera: Camera,
        private modal: ModalController,
        private applicationRef: ApplicationRef,
        private platform: Platform) {


    }

    ngOnInit() {

        /**
         * Si no tiene alternativa seleccionada, se crea con el formato por defecto
         */
        if (_.isNull(this.alternativa) || _.isUndefined(this.alternativa)) {
            this.alternativa = {
                foto: {
                    texto_respuesta: "",
                    foto: null
                }
            };
        } else {
            /**
             * Si no tiene texto asociado, se crea con el formato por defecto
             */

            if (!_.isArray(this.alternativa['foto']) && (!_.isNull(this.alternativa['foto']) && !_.isUndefined(this.alternativa['foto'])) && (_.isNull(this.alternativa['foto'].texto_respuesta) || _.isUndefined(this.alternativa['foto'].texto_respuesta))) {
                this.alternativa['foto']['texto_respuesta'] = "";
            } else if (_.isArray(this.alternativa['foto'])) {
                _.forEach(this.alternativa['foto'], (foto) => {
                    if (_.isNull(foto.texto_respuesta) || _.isUndefined(foto.texto_respuesta)) foto['texto_respuesta'] = "";
                })
            }
        }

        //this.applicationRef.tick();
    }

    /**
     * Captura foto en visita y envia hacia página detalles
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFotoSubPregunta(alternativa, fromCameraPlugin?: boolean) {
        let image = null;
        if (!globalConfig.isBrowser) {

            if (fromCameraPlugin) {
                // Configuración para la foto
                const photoOptions: CameraOptions = {
                    targetHeight: 700,
                    targetWidth: 700,
                    quality: 70,
                    destinationType: this.camera.DestinationType.DATA_URL,
                    correctOrientation: true,
                    saveToPhotoAlbum: (global.savePhotosInAlbum === true ? true : false)
                };
                // Abrimos la cámara
                await this.camera
                    .getPicture(photoOptions)
                    .then(async (result: any) => {
                        if (!result) {
                            this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                            return;
                        }

                        // Completamos el base64
                        // if (this.platform.is('android')) {
                        //     let base64: string = await this.util.convertLocalFileToBase64(result, true);

                        //     if (base64) {
                        //         image = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
                        //     }
                        // } else {
                        // }
                        image = ('data:image/jpeg;base64,' + result);

                    }, (error: any) => {
                        this.util.showToast('No se ha capturado ninguna fotografía', 3000);
                    });
            } else {
                image = await this.getImageCamera();
                if (!image) {
                    this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                    return;
                }
            }

            if (this.ambitState) this.ambitState.next(true);
            alternativa.foto = {
                foto: image,
                texto_respuesta: ""
            };

        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            if (this.ambitState) this.ambitState.next(true);
            alternativa.foto = {
                foto: image,
                texto_respuesta: ""
            };
        }
        this.applicationRef.tick();
        return image;
    }


    async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.view = 'CAMERA';
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
                modal.present();
                modal.onDidDismiss((data) => {
                    this.view = 'CONTENT';
                    const image = data && data.image || null;
                    return resolve(image);
                });

            } catch (error) {
                return resolve(null);
            }
        })
    }
    
    /**
     * Elimina foto en visita
     * @param pregunta
     * @param photo
     */
    deletePhoto(alternativa) {
        alternativa.foto = {};
        this.applicationRef.tick();
        if (this.ambitState) this.ambitState.next(true);
    };


    /**
     * Elimina foto en visita
     * @param pregunta
     * @param photo
     */
    deletePhotoArray(alternativa, photo) {
        alternativa.foto = _.remove(alternativa.foto, function (r) {
            return r.foto != photo;
        });

        if (this.ambitState) this.ambitState.next(true);

        if (!_.isNull(alternativa.foto) && !_.isUndefined(alternativa.foto)) {
            if (this.slides.getActiveIndex() >= (this.slides.length() - 1)) this.goToLeftSlide();
        }
    };

    /**
     * Reemplaza foto tomada en visita
     * @param pregunta
     * @param photo
     * @returns {Promise<any>}
     */
    async returnPhoto(alternativa, photo, fromCameraPlugin?: boolean) {
        let image = null;
        if (!globalConfig.isBrowser) {
            if(fromCameraPlugin){
                // Configuración para la foto
                const photoOptions: CameraOptions = {
                    targetHeight: 700,
                    targetWidth: 700,
                    quality: 70,
                    destinationType: this.camera.DestinationType.DATA_URL,
                    correctOrientation: true,
                    saveToPhotoAlbum: (global.savePhotosInAlbum === true ? true : false)
                };
                // Abrimos la cámara
                await this.camera
                    .getPicture(photoOptions)
                    .then(async (result: any) => {
                        if (!result) {
                            this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                            return;
                        }
                        // Completamos el base64
                        // if (this.platform.is('android')) {
                        //     let base64: string = await this.util.convertLocalFileToBase64(result, true);
    
                        //     if (base64) {
                        //         image = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
                        //     }
                        // } else {
                        // }
                        image = ('data:image/jpeg;base64,' + result);
                    }, (error: any) => {
                        this.util.showToast('No se ha capturado ninguna fotografía', 3000);
                    });

            }else {
                image = await this.getImageCamera();
                if (!image) {
                    this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                    return;
                }
            }
            
            if (this.ambitState) this.ambitState.next(true);

        } else {
            if (this.ambitState) this.ambitState.next(true);
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
        }
        var foundIndex = _.findIndex(alternativa.foto, { foto: photo });
        if (foundIndex != -1) {
            alternativa.foto[foundIndex] = {};
            alternativa.foto[foundIndex].foto = image;
        }
        return image;
    };

    /**
     * Verifica si el elemento es un array
     * @param array
     * @returns {any}
     */
    checkIfArray(array) {
        let arr = _.isArray(array);
        return arr
    }

    /**
     * Cambia a foto siguiente
     */
    slideChanged() {
        let currentIndex = this.slides.getActiveIndex();
    }

    goToRightSlide() {
        if (!this.slides.isEnd()) this.slides.slideTo(this.slides.getActiveIndex() + 1, 500);
    }

    goToLeftSlide() {
        if (!this.slides.isBeginning()) this.slides.slideTo(this.slides.getActiveIndex() - 1, 500);
    }
}
