import { Component, NgZone, ViewChild } from '@angular/core';
import {
    IonicPage,
    NavController,
    NavParams,
    ModalController,
    AlertController,
    LoadingController,
    Events,
    Platform,
    Content
} from 'ionic-angular';

import {
    MediaCapture,
    MediaFile,
    CaptureError,
    CaptureImageOptions,
    CaptureVideoOptions
} from '@ionic-native/media-capture';

import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { VisualLocalProvider } from '../../services/visual.local';

// Componentes
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';
import { NoImplementationComponent } from '../../../../components/no-implementation/no-implementation';

// Configuración del componente
import { config } from './send-report.config'
import { global } from '../../../../shared/config/global';
import { globalConfig } from '../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

declare let window: any;

@IonicPage()
@Component({
    selector: 'page-send-report',
    templateUrl: 'send-report.html'
})
export class SendReportPage {

    @ViewChild(Content) content: Content;

    private visual: any = null;
    private implementationsCount: any = 0;
    private report_id: any = null;
    private form: any = {
        commentary: null
    };
    private requesting: boolean = false;
    private optionalImplementations: any = [];
    private session: any = null;
    private locked_buttons: boolean = false; // Atributo usado para bloquear los botones, al presionar un modal y abrir la cámara se mezclan las vistas
    private sync_loading: any = null;
    private using_storage: boolean = false;
    private is_network_connected: any = true;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private reportPercentage: number = null;
    private reasonReportPercentage: string = null;
    private view: string = null;
    dataFromOtherPage: any;
    constructor(private navCtrl: NavController,
        private navParams: NavParams,
        private modal: ModalController,
        private alert: AlertController,
        private loading: LoadingController,
        private media: MediaCapture,
        private events: Events,
        private geolocation: Geolocation,
        private fileTransfer: FileTransfer,
        private file: File,
        private zone: NgZone,
        private platform: Platform,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private visualLocalProvider: VisualLocalProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView('SendReportVisual');
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'SendReport', 'Visual' );

        if (!this.navParams.data.visual || !this.navParams.data.report_id) {
            this.util.showToast('Reporte inválido, falta información.', 3000);
            this.navCtrl.pop();
            return;
        }
        this.is_network_connected = this.util.isNetworkConnected(globalConfig.isBrowser);

        this.visual = this.navParams.data.visual;

        this.report_id = this.navParams.data.report_id;
        this.optionalImplementations = this.visual.classified_photos.optional;

        // Buscamos si hay implementaciones guardadas localmente para el reporte actual
        this.setLocalImplementations();

        // Buscamos si hay fotos adicionales guardadas localmente para el reporte actual
        this.setLocalOptionals();

        this.sessionProvider.getSession().then((response: any) => {
            this.session = response;
        });

        // Para cada foto agregamos el campo para agregar un comentario además contamos la cantidad de implementaciones
        // También contamos la cantidad de implementaciones realizadas
        _.forEach(this.visual.classified_photos.required.all, (photo) => {
            if (photo.implementation) {
                if (photo.implementation.id) this.implementationsCount++;
                photo.commentary_form = (photo.implementation.comentario ? photo.implementation.comentario : '');
                return;
            }
            photo.commentary_form = null;
        });

        // Evento que se ejecuta cuando se suben implementaciones guardadas localmente
        this.events.subscribe('local_implementations_uploaded', (implementations) => {
            // Si estamos en esta vista
            if (this.navCtrl.getActive().instance instanceof SendReportPage) {
                // Recorremos las fotos de referencias obligatorias
                _.forEach(this.visual.classified_photos.required.all, (photo) => {
                    let temp = _.find(implementations, {
                        extra: { report_id: this.report_id },
                        data: { parent_id: photo.id }
                    });
                    // Si encontramos que se implementó desde la base de datos local
                    if (temp && temp.data && temp.data.id) {
                        // Asignamos los valores devueltos por la API
                        this.zone.run(() => {
                            if (photo.implementation) {
                                photo.implementation.saved_locally = false;
                                photo.implementation.id = temp.data.id;
                                photo.implementation.url = ((temp.extra && temp.extra.type === 'video') ? temp.data.url : photo.implementation.url);
                                photo.implementation.comentario = (temp.data.comentario ? temp.data.comentario : '');
                            }
                        });
                    }
                });

                this.implementationsCount = 0;

                // Volvemos a contar las implementaciones subidas
                _.forEach(this.visual.classified_photos.required.all, (photo) => {
                    this.zone.run(() => {
                        if (photo.implementation && photo.implementation.id) this.implementationsCount++;
                    });
                });

                try {
                    if (this.sync_loading) this.sync_loading.dismiss();
                    this.sync_loading = null;
                } catch (e) {
                    // Registramos el error en la API
                    this.util.logError(e, 'SendReportPage.ionViewDidLoad() -> local_implementations_uploaded -> Try[0]', globalConfig.version);
                }
            }
        });

        // Evento que se ejecuta cuando se suben las fotos adicionales guardadas localmente
        this.events.subscribe('local_optionals_uploaded', (optionals) => {
            // Si estamos en esta vista
            if (this.navCtrl.getActive().instance instanceof SendReportPage) {
                // Recorremos las fotos adicionales
                _.forEach(this.optionalImplementations, (optional) => {
                    let temp = _.find(optionals, { extra: { key: optional.key } });
                    // Si encontramos que se envió desde la base de datos local
                    if (temp && temp.data && temp.data.id) {
                        // Asignamos los valores devueltos por la API
                        this.zone.run(() => {
                            optional.id = temp.data.id;
                        });
                    }
                });

                try {
                    if (this.sync_loading) this.sync_loading.dismiss();
                    this.sync_loading = null;
                } catch (e) {
                    // Registramos el error en la API
                    this.util.logError(e, 'SendReportPage.ionViewDidLoad() -> local_optionals_uploaded -> Try[0]', globalConfig.version);
                }
            }
        });

        // Evento que se ejecuta cuando se comienzan a enviar las implementaciones locales
        this.events.subscribe('synchronizing_implementations', () => {
            // Si estamos en esta vista
            if (this.navCtrl.getActive().instance instanceof SendReportPage && !this.sync_loading) {
                this.sync_loading = this.loading.create({ content: 'Sincronizando implementaciones.' });
                this.sync_loading.present();
            }
        });

        this.events.subscribe('network-connected', () => {
            this.is_network_connected = true;
        });

        this.events.subscribe('network-disconnected', () => {
            this.is_network_connected = false;
        });

        try { this.content.resize() } catch (e) { }
    }

    // Cuando se cierra esta vista se activa el evento 'sendReportPoped'
    ionViewDidLeave() {
        this.events.publish('sendReportPoped');
        this.events.unsubscribe('local_implementations_uploaded');
        this.events.unsubscribe('local_optionals_uploaded');
        this.events.unsubscribe('synchronizing_implementations');
        this.events.unsubscribe('network-connected');
        this.events.unsubscribe('network-disconnected');
    }

    // Abre un modal el cual muestra la foto que entra por parámetro
    openPhotoViewer(photo: any, type: string, is_video: boolean, reference: any, evaluated: boolean) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        const modal = this.modal.create(PhotoViewerComponent, { photo: photo, type: type, is_video: is_video, reference: reference, evaluated: evaluated });
        modal.present();
    }

    // Elimina un archivo
    async deleteFile(photo: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (this.requesting) return;

        if (!photo || !photo.implementation) {
            this.util.showToast('Ningún archivo para eliminar.', 3000);
            return;
        }

        // Intentamos eliminar la implementación local en caso de que exista una guardada
        this.deleteLocalImplementation(photo);

        if (!photo.implementation.id) {
            photo.implementation = null;
            photo.commentary_form = null;
            return;
        }

        const loading = this.loading.create({ content: 'Eliminando archivo' });
        const confirm = this.alert.create({
            title: 'Atención',
            message: ('¿Está seguro que desea borrar ' + (photo.implementation.motivo ? 'este motivo?' : 'esta implementación?')),
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                }
            }, {
                text: 'Eliminar',
                handler: () => {
                    loading.present();
                    this.request
                        .post(config.endpoints.newApi.post.deletePhoto, {
                            foto_id: photo.implementation.id,
                            reporte_id: this.report_id
                        }, true)
                        .then((response: any) => {
                            loading.dismiss();
                            let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                            if (temp.message === config.api_messages.deletePhoto || temp.message === config.api_messages.deletePhotoNewApi) {
                                photo.implementation = null;
                                photo.commentary_form = null;
                                this.util.showToast('Archivo eliminado exitosamente.', 3000);
                                this.implementationsCount--;
                                return;
                            }
                            this.util.showAlert('Atención', 'No ha sido posible eliminar la foto, intente nuevamente.');
                        })
                        .catch((error: any) => {
                            // Registramos el error en la API
                            this.util.logError(JSON.stringify(error), 'SendReportPage.deleteFile()', globalConfig.version);
                            loading.dismiss();
                            this.util.showAlert('Atención', 'No ha sido posible eliminar la foto, intente nuevamente.');
                        });
                }
            }]
        });
        if (await this.isExpired()) return;
        confirm.present();
    }

    // Envía el reporte
    async sendReport() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (!this.is_network_connected) {
            this.util.showAlert('Atención', 'No tienes conexión a Internet. Si tienes cambios, estos se guardarán localmente y podrás enviarlos cuando vuelvas a tener conexión.');
            return;
        }

        if (this.visual.classified_photos.required.all.length > this.implementationsCount) {
            this.util.showAlert('Atención', 'Debe completar el reporte antes de enviarlo.');
            return;
        }

        // AGREGAR VALIDACIÓN DE CAMPO REQUERIDO

        if(this.visual.preguntar_implementacion) {
            if ((!this.reportPercentage && this.reportPercentage !== 0)) {
                this.util.showAlert('Atención', 'Indique el porcentaje de implementación.');
                return;
            }
    
            if (this.reportPercentage < 100 && !this.reasonReportPercentage) {
                this.util.showAlert('Atención', 'Indique los motivos que causaron una implementación incompleta.');
                return;
            }
        }

        let requiredImplementations = [];
        let optionalImplementations = [];

        // Armamos el arreglo con fotos obligatorias, aprovechamos de validar nuevamente que se hayan adjuntado todas las implementaciones
        for (let photo of this.visual.classified_photos.required.all) {
            if (!photo.implementation.id) {
                this.util.showAlert('Atención', 'Falta adjuntar archivos, por favor complete el reporte.');
                return;
            }
            requiredImplementations.push({
                id: photo.implementation.id,
                foto: null,
                parent_id: photo.implementation.parent_id,
                comentario: (photo.commentary_form ? photo.commentary_form : '')
            });
        }

        // Armamos el arreglo con fotos opcionales
        for (let photo of this.optionalImplementations) {
            optionalImplementations.push({
                id: photo.id,
                comentario: (photo.comentario ? photo.comentario : '')
            });
        }

        // Verificamos que el reporte no vaya vacío
        if (optionalImplementations.length < 1 && requiredImplementations.length < 1) {
            this.util.showAlert('Atención', 'No es posible enviar el reporte sin archivos.');
            return;
        }

        const loading = this.loading.create({ content: 'Enviando reporte' });
        const confirm = this.alert.create({
            title: 'Alerta',
            message: '¿Está seguro que desea enviar el reporte?',
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                }
            }, {
                text: 'Enviar',
                handler: () => {
                    loading.present();
                    this.request
                        .post(config.endpoints.newApi.post.report, {
                            fotos: optionalImplementations,
                            fotosObligatorias: requiredImplementations,
                            respuestas: [],
                            comentario: (this.form.commentary ? this.form.commentary : ''),
                            reporte_id: this.report_id,
                            porcentaje_implementacion: this.reportPercentage,
                            motivo_implementacion: this.reasonReportPercentage
                        }, true)
                        .then((response: any) => {
                            loading.dismiss();
                            try {
                                let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                                if (temp && temp.message === config.api_messages.report) {
                                    this.util.showToast('Reporte enviado', 3000);
                                    this.navCtrl.pop();
                                    return;
                                }
                                // Registramos el error en la API
                                this.util.logError(JSON.stringify(response), 'SendReportPage.sendReport() -> Success', globalConfig.version);
                                this.util.showAlert('Atención', 'No ha sido posible enviar el reporte, intente nuevamente.');
                            } catch (e) {
                                // Registramos el error en la API
                                this.util.logError(e, 'SendReportPage.sendReport() -> Try[0]', globalConfig.version);
                                this.util.showAlert('Atención', 'No ha sido posible enviar el reporte, intente nuevamente.');
                            }
                        })
                        .catch((error: any) => {
                            // Registramos el error en la API
                            this.util.logError(JSON.stringify(error), 'SendReportPage.sendReport()', globalConfig.version);
                            loading.dismiss();
                            this.util.showAlert('Atención', 'No ha sido posible enviar el reporte, intente nuevamente.');
                        });
                }
            }]
        });
        if (await this.isExpired()) return;
        confirm.present();
    }

    // Verifica si una campaña ha caducado o no, además agrega la holgura del cliente en caso de que exista
    async isExpired() {
        let result = true;
        this.requesting = true;
        await this.request
            .get(config.endpoints.newApi.get.info, true)
            .then((response: any) => {
                if (!response || !response.data || !response.data.timestamp) {
                    this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
                } else if (response.data.timestamp > (this.visual.fecha_reporte.timestamp + (this.visual.holgura ? this.visual.holgura : 0))) {
                    let formatedDate = this.visual.fecha_reporte.day.string + ' '
                        + this.visual.fecha_reporte.day.real + ' de ' + this.visual.fecha_reporte.month.string
                        + ', ' + this.visual.fecha_reporte.year.real + '<br> a las '
                        + this.visual.fecha_reporte.time + ' hrs.';
                    this.util.showAlert('Atención', 'La fecha de reporte ha caducado. Fecha de vencimiento: ' + formatedDate);
                } else {
                    result = false;
                }
            })
            .catch((error: any) => {
                // Registramos el error en la API
                this.util.logError(JSON.stringify(error), 'SendReportPage.isExpired()', globalConfig.version);
                this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
            });
        this.requesting = false;
        return result;
    }

    // Abre la cámara y captura una foto
    async capturePhoto(photo: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let image = await this.getImage();
        if (image) {
            // Mostramos la imágen provisoriamente
            photo.implementation = {
                url: image,
                id: null,
                comentario: (photo.commentary_form ? photo.commentary_form : '')
            };
            // Envíamos la fotografía
            this.sendPhoto(photo);
        }
    }

    // Abre la cámara y captura un video
    async captureVideo(photo: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let video = await this.getVideo();

        if (video) {
            // Mostramos la imágen provisoriamente
            photo.implementation = {
                url: video,
                id: null,
                comentario: (photo.commentary_form ? photo.commentary_form : '')
            };
            // Envíamos la fotografía
            this.sendVideo(video, photo);
        }
    }

    // Agrega un comentario a una implementación requerida u opcional
    addCommentaryToImplementation(photo: any, isRequiredImplementation: boolean) {
        if (isRequiredImplementation) {
            this.requesting = true;
            this.request
                .post(config.endpoints.newApi.post.addCommentary, {
                    foto_id: photo.implementation.id,
                    comentario: (photo.commentary_form ? photo.commentary_form : '')
                }, true)
                .then((response: any) => {
                    this.requesting = false;
                    // this.util.showToast('Comentario agregado.', 3000);
                })
                .catch((error: any) => {
                    try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                    this.requesting = false;
                });
        } else {
            this.requesting = true;
            this.request
                .post(config.endpoints.newApi.post.addCommentary, {
                    foto_id: photo.id,
                    comentario: (photo.comentario ? photo.comentario : '')
                }, true)
                .then((response: any) => {
                    this.requesting = false;
                    // this.util.showToast('Comentario agregado.', 3000);
                })
                .catch((error: any) => {
                    try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                    this.requesting = false;
                });
        }
    }

    // Solicita una foto al proveedor y la retorna
    async getImage(fromUtils?: boolean) {
        let image = null;
        if(fromUtils){
            await this.util.getImage(globalConfig.isBrowser)
                .then((result) => { image = result; })
                .catch((error) => { });
            return image;

        }else{
            return await this.getImageCamera();
        }
    }

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
                return resolve(null);
            }
        })
    }
    

    // Sube una imágen al servidor
    async sendPhoto(photo: any) {
        if (!photo.implementation) {
            this.util.showAlert('Atención', 'Ningún archivo para enviar.');
            return;
        }

        photo.sending = true;

        // Obtenemos la posición del dispositivo
        let position = await this.getPosition();

        let body = {
            latitud: position.latitude,
            longitud: position.longitude,
            foto: {
                base64: photo.implementation.url,
                parent_id: photo.id
            },
            reporte: {
                id: this.report_id
            },
            objeto: {
                id: null,
                foto: photo.implementation.url,
                comentario: (photo.commentary_form ? photo.commentary_form : ''),
                parent: {
                    id: photo.id
                }
            }
        };

        this.request
            .post(config.endpoints.newApi.post.addPhoto, body, true)
            .then((response: any) => {
                photo.sending = false;
                try {
                    let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                    if (temp.data.id) {
                        photo.implementation = {
                            url: photo.implementation.url,
                            id: temp.data.id,
                            comentario: (photo.commentary_form ? photo.commentary_form : '')
                        };
                        this.implementationsCount++;
                        this.util.showToast('Fotografía enviada exitosamente', 3000);

                        // Intentamos eliminar la implementación local en caso de que exista una guardada
                        this.deleteLocalImplementation(photo);
                        return;
                    }
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: body,
                        type: 'photo'
                    }, false, photo);
                    this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
                } catch (e) {
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: body,
                        type: 'photo'
                    }, false, photo);
                    this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                photo.sending = false;
                // Si el envío falla lo guardamos localmente
                this.saveImplementation({
                    report_id: this.report_id,
                    parent_id: photo.id,
                    implementation: photo.implementation,
                    body: body,
                    type: 'photo'
                }, false, photo);
                this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
            });
    }

    // Sube una foto adicional
    async sendOptionalPhoto(optionalImplementation: any, isRetry: boolean) {

        if (!optionalImplementation) {
            this.util.showAlert('Atención', 'Ningún archivo para enviar.');
            return;
        }

        // Si se sube por primera vez, agregamos la foto al arreglo de fotos adicionales
        if (!isRetry) {
            this.optionalImplementations.push(optionalImplementation);
        }

        optionalImplementation.sending = true;

        this.request
            .post(config.endpoints.newApi.post.addPhoto, optionalImplementation.body, true)
            .then((response: any) => {

                optionalImplementation.sending = false;

                let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                if (temp.data.id) {
                    optionalImplementation.url = optionalImplementation.url;
                    optionalImplementation.id = temp.data.id;

                    // Intentamos eliminar la implementación local en caso de que exista una guardada
                    this.deleteLocalOptional(optionalImplementation);
                    return;
                }
                // Si el envío falla lo guardamos localmente
                if (!isRetry || !optionalImplementation.key) this.saveOptionalPhoto(optionalImplementation);
                this.util.showAlert('Atención', 'No ha sido posible subir la fotografía adicional, intente nuevamente.');
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                optionalImplementation.sending = false;

                // Si el envío falla lo guardamos localmente
                if (!isRetry || !optionalImplementation.key) this.saveOptionalPhoto(optionalImplementation);
                this.util.showAlert('Atención', 'No ha sido posible subir la fotografía adicional, intente nuevamente.');
            });
    }

    // Intenta subir una fotografía nuevamente, puede ser obligatoria o adicional (opcional)
    retryUploadImage(photo: any, isRequiredImplementation: boolean) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (isRequiredImplementation) this.sendPhoto(photo);
        else this.sendOptionalPhoto(photo, true);
    }

    // Intenta subir un video nuevamente
    retryUploadVideo(photo: any) {

        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();
        this.sendVideo(photo.implementation.url, photo);
    }

    // Agrega una foto adicional al reporte
    async addOptionalPhoto() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        // if (await this.isExpired()) return;
        let image = await this.getImage();

        this.requesting = true;

        // Obtenemos la posición del dispositivo
        let position = await this.getPosition();

        this.requesting = false;

        if (!image) return;

        let optionalImplementation = {
            id: null,
            url: image,
            comentario: null,
            commentary_form: '',
            body: {
                latitud: position.latitude,
                longitud: position.longitude,
                foto: {
                    base64: image
                },
                reporte: {
                    id: this.report_id
                }
            }
        };
        this.sendOptionalPhoto(optionalImplementation, false);
    }

    // Elimina una foto adicional al reporte
    async deleteOptionalPhoto(photo: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        const loading = this.loading.create({ content: 'Eliminando foto' });
        const confirm = this.alert.create({
            title: 'Atención',
            message: '¿Está seguro que desea borrar esta foto adicional?',
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                }
            }, {
                text: 'Eliminar',
                handler: () => {

                    // Si la foto no se ha subido al servidor la eliminamos del arreglo y localmente
                    if (!photo.id) {
                        _.remove(this.optionalImplementations, photo);
                        this.deleteLocalOptional(photo);
                        return;
                    }

                    loading.present();
                    this.request
                        .post(config.endpoints.newApi.post.deletePhoto, {
                            foto_id: photo.id,
                            reporte_id: this.report_id
                        }, true)
                        .then((response: any) => {

                            this.deleteLocalOptional(photo);

                            loading.dismiss();
                            let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                            if (temp.message === config.api_messages.deletePhoto || temp.message === config.api_messages.deletePhotoNewApi) {
                                _.remove(this.optionalImplementations, photo);
                                return;
                            }
                            this.util.showAlert('Atención', 'No ha sido posible eliminar la foto adicional, intente nuevamente.');
                        })
                        .catch((error: any) => {
                            try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                            this.util.showAlert('Atención', 'No ha sido posible eliminar la foto adicional, intente nuevamente.');
                            loading.dismiss();
                        });
                }
            }]
        });
        if (photo.id && await this.isExpired()) return;
        confirm.present();
    }

    // Muestra un modal con los motivos de no implementación
    openNoImplementation(photo: any, is_edit: boolean) {
        let modal = this.modal.create(NoImplementationComponent, {
            photo: photo,
            reasons: (this.visual.motivos || []),
            report_id: this.report_id,
            is_edit: is_edit
        });
        modal.present();
        modal.onDidDismiss((params: any) => {
            if (!params || !params.implemented || !params.photo) return;
            photo = params.photo;
            if (!is_edit) this.implementationsCount++;
            if (photo.commentary_form) this.addCommentaryToImplementation(photo, true);
        });
    }

    // Toma una foto de no implementación y la envía con su motivo
    async takeNoImplementationPhoto(photo: any, reference: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        // Verificamos que el reporte esté vigente
        if (await this.isExpired()) {
            return;
        }

        // Tomamos la fotografía
        let image = await this.getImage();
        if (!image) {
            return;
        }
        reference.sending = true;

        // Obtenemos la posición del dispositivo
        let position = await this.getPosition();
        let body: any = {
            latitud: position.latitude,
            longitud: position.longitude,
            motivo: {
                id: photo.motivo.id,
                comentario: (photo.motivo.comentario ? photo.motivo.comentario : ''),
                sku: photo.motivo.sku
            },
            foto: {
                base64: image,
                parent_id: (photo.parent_id || photo.parent.id)
            },
            reporte: {
                id: this.report_id
            },
            objeto: {
                id: photo.id,
                foto: image,
                comentario: (photo.comentario ? photo.comentario : ''),
                parent: {
                    id: (photo.parent_id || photo.parent.id)
                }
            }
        };
        this.request
            .post(config.endpoints.newApi.post.addPhoto, body, true)
            .then((response: any) => {
                reference.sending = false;
                try {
                    let temp = (this.util.isJson(response) ? JSON.parse(response) : response);
                    if (temp.data.id) {
                        photo.url = image;
                        photo.id = temp.data.id;
                        // Intentamos eliminar la implementación local en caso de que exista una guardada
                        this.deleteLocalImplementation(photo);
                        return;
                    }
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: body,
                        type: 'photo'
                    }, false, photo);
                    this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
                } catch (e) {
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: body,
                        type: 'photo'
                    }, false, photo);
                    this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                // Si el envío falla lo guardamos localmente
                this.saveImplementation({
                    report_id: this.report_id,
                    parent_id: photo.id,
                    implementation: photo.implementation,
                    body: body,
                    type: 'photo'
                }, false, photo);
                this.util.showAlert('Atención', 'No ha sido posible subir la fotografía, intente nuevamente.');
                reference.sending = false;
            });
    }

    // Muestra una alerta con el motivo de no implementación y opciones para editar y eliminar
    showNoImplementationReason(photo: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let template = ('<p><b>' + photo.implementation.motivo.nombre + '</b><br>' + (photo.implementation.motivo.comentario ? photo.implementation.motivo.comentario : '') + '</p>');
        const confirm = this.alert.create({
            title: 'Motivo',
            message: template,
            buttons: [{
                text: 'Editar',
                handler: () => {
                    this.openNoImplementation(photo, true);
                }
            }, {
                text: 'Eliminar',
                handler: () => {
                    this.locked_buttons = false;
                    this.deleteFile(photo);
                }
            }, {
                text: 'Cerrar',
                handler: () => {
                }
            }]
        });
        confirm.present();
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

    // Bloqueamos los botones por 1.5 segundos
    blockButtons() {
        this.locked_buttons = true;
        setTimeout(() => {
            this.locked_buttons = false;
        }, 1500);
    }

    // Captura un video
    async getVideo() {
        let video: any = null;
        // Configuración para el video
        const videoOptions: CaptureVideoOptions = {
            limit: 1,
            quality: 0,
            duration: ((this.visual && this.visual.duracion_video) ? this.visual.duracion_video : 5)
        };
        const loading = this.loading.create({ content: 'Preparando cámara' });
        loading.present();
        await this.media
            .captureVideo(videoOptions)
            .then(async (data: any) => {
                loading.dismiss();
                if (data && data[0]) video = data[0].fullPath;
            })
            .catch((error: CaptureError) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                loading.dismiss();
                this.util.showToast('No se ha capturado ningún video', 3000);
            });
        return video;
    }

    // Envía un video al servicio
    async sendVideo(video: any, photo: any) {
        // Validamos que venga la implementación y la información de la sesión
        if (!photo.implementation) {
            this.util.showAlert('Atención', 'Ningún archivo para enviar.');
            return;
        }
        if (!this.session) {
            this.util.showAlert('Atención', 'No es posible enviar el video, falta información de la sesión');
            return;
        }

        // Declaramos una variable para el progreso de subida del video y declaramos que se está enviando una implementación para la referencia
        let progress: number = 0;
        photo.sending = true;

        // Obtenemos la posición y creamos los objetos para el envío del video
        let position = await this.getPosition();
        const transfer: FileTransferObject = this.fileTransfer.create();
        const options: FileUploadOptions = {
            fileKey: 'video',
            fileName: 'video.mp4',
            headers: { 'Authorization': (this.session.sessionid + '-' + this.session.usuario.id + '-local') },
            params: {
                parent_id: photo.id,
                reporte_id: this.report_id,
                latitud: position.latitude,
                longitud: position.longitude
            }
        };

        // Si hay comentario lo agregamos a los params de file transfer
        if (photo.commentary_form) options.params.comentario = photo.commentary_form;

        // Declaramos una función que retorna el progreso de la subida
        transfer.onProgress((response: any) => {
            if (response.lengthComputable) {
                // Vamos asignando el progreso a la variable
                progress = (Math.round((response.loaded / response.total) * 100));
                this.zone.run(() => {
                    photo.progress = progress;
                });
            }
        });

        // Comenzamos con la subida del video
        transfer.upload(video, (global.API_NEW + config.endpoints.newApi.post.addVideo), options)
            .then((result: any) => {
                photo.sending = false;
                photo.progress = null;
                try {
                    // Si obtuvimos un id quiere decir que el video se registró
                    let temp = (this.util.isJson(result.response) ? JSON.parse(result.response) : result.response);

                    if (temp.data.id) {
                        photo.implementation = {
                            parent_id: photo.id,
                            url: temp.data.url,
                            id: temp.data.id,
                            comentario: (photo.commentary_form ? photo.commentary_form : '')
                        };
                        this.implementationsCount++;
                        this.util.showToast('Video enviado exitosamente', 3000);

                        // Intentamos eliminar la implementación local en caso de que exista una guardada
                        this.deleteLocalImplementation(photo);
                        return;
                    }
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        video_path: video,
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: options,
                        type: 'video'
                    }, false, photo);
                    this.util.showAlert('Atención', 'Video no enviado, intente nuevamente.');
                } catch (e) {
                    // Si el envío falla lo guardamos localmente
                    this.saveImplementation({
                        video_path: video,
                        report_id: this.report_id,
                        parent_id: photo.id,
                        implementation: photo.implementation,
                        body: options,
                        type: 'video'
                    }, false, photo);
                    this.util.showAlert('Atención', 'Video no enviado, intente nuevamente.');
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                photo.sending = false;
                photo.progress = null;
                // Si el envío falla lo guardamos localmente
                this.saveImplementation({
                    video_path: video,
                    report_id: this.report_id,
                    parent_id: photo.id,
                    implementation: photo.implementation,
                    body: options,
                    type: 'video'
                }, false, photo);
                this.util.showAlert('Alerta', 'Video no enviado, intente nuevamente.');
            });
    }

    // Aumenta en 15 el scroll de un textarea
    scrollTextArea(textarea: any) {
        textarea.scrollTop = textarea.scrollTop + 15;
    }

    // Busca las implementaciones guardadas localmente y las asigna a las referencias
    setLocalImplementations() {
        // Obtenemos las implementaciones guardadas localmente
        this.visualLocalProvider
            .getImplementationsByReport(this.report_id)
            .then((response: any) => {
                if (response && response.length) {
                    // Recorremos las referencias
                    _.forEach(this.visual.classified_photos.required.all, (reference) => {
                        // Para cada referencia, buscamos si tiene implementación en la base de datos local
                        let temp: any = _.find(response, { parent_id: reference.id });
                        // Si encontramos una implementación la asignamos a la referencia
                        if (temp) {
                            temp.implementation.saved_locally = true;
                            reference.implementation = temp.implementation;
                            reference.sending = false;
                        }
                    });
                }
            })
            .catch((error: any) => { });
    }

    // Solicita al servicio guardar una implementación localmente
    saveImplementation(data, overwrite, photo) {
        // Si se está guardando una implementación que falló anteriormente, esperamos 1.5 segundos antes de intentarlo nuevamente
        if (this.using_storage) {
            setTimeout(() => {
                this.saveImplementation(data, overwrite, photo);
            }, 1500);
            return;
        }
        this.using_storage = true;
        this.visualLocalProvider
            .saveImplementation(data, overwrite)
            .then(() => {
                photo.implementation.saved_locally = true;
                this.using_storage = false;
            })
            .catch(() => {
                this.using_storage = false;
            });
    }

    // Elimina una implementación guardada localmente
    deleteLocalImplementation(photo) {
        // Si se está usando la db local, esperamos 1.5 segundos antes de intentarlo nuevamente
        if (this.using_storage) {
            setTimeout(() => {
                this.deleteLocalImplementation(photo);
            }, 1500);
            return;
        }
        this.using_storage = true;
        this.visualLocalProvider
            .deleteLocalImplementation(this.report_id, photo)
            .then(() => {
                this.using_storage = false;
            })
            .catch(() => {
                this.using_storage = false;
            });
    }

    // Solicita al servicio guardar una foto adicional localmente
    saveOptionalPhoto(data: any) {
        // Si se está guardando una foto adicional que falló anteriormente, esperamos 1.5 segundos antes de intentarlo nuevamente
        if (this.using_storage) {
            setTimeout(() => {
                this.saveOptionalPhoto(data);
            }, 1500);
            return;
        }
        this.using_storage = true;
        this.visualLocalProvider
            .saveOptionalPhoto(data)
            .then((response: any) => {
                data.key = response.key;
                data.saved_locally = true;
                this.using_storage = false;
            })
            .catch(() => {
                this.using_storage = false;
            });
    }

    // Busca las fotos adicionales guardadas localmente
    setLocalOptionals() {
        this.visualLocalProvider
            .getOptionalsByReport(this.report_id)
            .then((response: any) => {
                if (response && response.length) {
                    _.forEach(response, (optional) => {
                        this.optionalImplementations.push(optional);
                    });
                }
            })
            .catch((error: any) => { });
    }

    // Elimina una foto adicional guardada localmente
    deleteLocalOptional(optional: any) {
        // Si se está usando la db local, esperamos 1.5 segundos antes de intentarlo nuevamente
        if (this.using_storage) {
            setTimeout(() => {
                this.deleteLocalOptional(optional);
            }, 1500);
            return;
        }
        this.using_storage = true;
        this.visualLocalProvider
            .deleteLocalOptional(optional)
            .then(() => {
                this.using_storage = false;
            })
            .catch(() => {
                this.using_storage = false;
            });
    }
}