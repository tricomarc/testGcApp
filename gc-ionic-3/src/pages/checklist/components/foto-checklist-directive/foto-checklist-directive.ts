import { Component, Input, ViewChild } from '@angular/core';
import { Camera, CameraOptions } from "@ionic-native/camera";
import { UtilProvider } from "../../../../shared/providers/util/util";
import { PreguntasChecklistDirectiveComponent } from "../preguntas-checklist-directive/preguntas-checklist-directive";
import { DetallePage } from '../../sub-pages/detalle/detalle';
import { globalConfig } from "../../../../config";
import { global } from "../../../../shared/config/global";
import { ModalController, Platform, Slides } from "ionic-angular";
import * as _ from 'lodash';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

/**
 * Generated class for the FotoChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'foto-checklist-directive',
    templateUrl: 'foto-checklist-directive.html'
})
export class FotoChecklistDirectiveComponent {

    @Input() pregunta: {};
    @Input() public isTask: boolean;
    @Input() checklistEnviado: boolean;
    @Input() fromStats: boolean;
    @ViewChild(Slides) slides: Slides;
    @Input() ambitState: BehaviorSubject<any>;

    visitPhoto = [];
    private view: string = null;
    constructor(
        private preguntasChecklistDirectiveComponent: PreguntasChecklistDirectiveComponent,
        private detalle: DetallePage,
        private util: UtilProvider,
        public camera: Camera,
        private modal: ModalController,
        private platform: Platform) {

        this.visitPhoto = [];
    }

    /**
     * Captura foto y envia hacia página detalles
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFoto(pregunta, fromCameraPlugin?: boolean) {
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
    
                        if (this.ambitState) this.ambitState.next(true);
    
                    }, (error: any) => {
                        this.util.showToast('No se ha capturado ninguna fotografía', 3000);
                    });

            }else {
                image = await this
                    .getImageCamera() 
                    .catch((err) => {
                        this.util.showToast('No se ha capturado ninguna fotografía', 3000);
                    })
                if (this.ambitState) this.ambitState.next(true);
            }

            this.detalle.tomarFoto(image, pregunta);
        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            if (this.ambitState) this.ambitState.next(true);
            this.detalle.tomarFoto(image, pregunta);
        }
        return image;
    }

    async tomarFotoMultiple(pregunta, fromCameraPlugin?: boolean) {
        let image = null;

        if (!globalConfig.isBrowser) {
            // Configuración para la foto
            
            if (fromCameraPlugin) {
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
                        return;
                    });
            } else {
                image = await this.getImageCamera();
                if(!image){
                    this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                    return;
                }
            }

            if (this.ambitState) this.ambitState.next(true);

            this.detalle.tomarFotoMultiple(image, pregunta);
            let context = this;
            if (_.isArray(context.pregunta['respuesta'].foto) && context.pregunta['respuesta'].foto.length > 1) {
                setTimeout(function () {
                    context.goToRightSlide();
                }, 1000);
            }
        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            if (this.ambitState) this.ambitState.next(true);
            this.detalle.tomarFotoMultiple(image, pregunta);
            let context = this;
            if (_.isArray(context.pregunta['respuesta'].foto) && context.pregunta['respuesta'].foto.length > 1) {
                setTimeout(function () {
                    context.goToRightSlide();
                }, 1000);
            }
        }
        return image;
    }

    /**
     * Captura foto en visita y envia hacia página detalles
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFotoVisita(pregunta, fromCameraPlugin?: boolean) {
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

            this.detalle.saveVisitPhoto(image, pregunta).then(ret => {

                let context = this;
                if (_.isArray(context.pregunta['respuesta'].foto) && context.pregunta['respuesta'].foto.length > 1) {
                    setTimeout(function () {
                        context.goToRightSlide();
                    }, 1000);
                }
            });


        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            if (this.ambitState) this.ambitState.next(true);
            this.detalle.saveVisitPhoto(image, pregunta).then(ret => {
                let context = this;
                if (_.isArray(context.pregunta['respuesta'].foto) && context.pregunta['respuesta'].foto.length > 1) {
                    setTimeout(function () {
                        context.goToRightSlide();
                    }, 1000);
                }
            });
        }
        return image;
    }

    /**
     * Captura foto en tarea
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFotoTarea(pregunta, fromCameraPlugin?: boolean) {
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

            pregunta.respuesta.foto = image

        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            pregunta.respuesta.foto = image;
        }
        return image;
    }

    /**
     * Elimina foto en visita
     * @param pregunta
     * @param photo
     */
    deletePhoto(pregunta, photo) {
        pregunta.respuesta.foto = _.remove(pregunta.respuesta.foto, function (r) {
            return r.foto != photo;
        });

        if (this.ambitState) this.ambitState.next(true);

        if (!_.isNull(pregunta.respuesta.foto) && !_.isUndefined(pregunta.respuesta.foto)) {
            if (this.slides.getActiveIndex() >= (this.slides.length() - 1)) this.goToLeftSlide();
        }
    };

    /**
     * Reemplaza foto tomada en visita
     * @param pregunta
     * @param photo
     * @returns {Promise<any>}
     */
    async returnPhoto(pregunta, photo, fromCameraPlugin?: boolean) {
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
            }else{
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
        var foundIndex = _.findIndex(pregunta.respuesta.foto, { foto: photo });
        if (foundIndex != -1) {
            pregunta.respuesta.foto[foundIndex] = {};
            pregunta.respuesta.foto[foundIndex].foto = image;
        }
        return image;
    };


    /**
     * Abre la camara in app
     */
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
                return reject(null);
            }
        })
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
