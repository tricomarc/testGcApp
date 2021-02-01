import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    ModalController,
    NavController,
    NavParams, Platform,
    Slides
} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../shared/providers/session/session";
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {Camera, CameraOptions} from "@ionic-native/camera";
import {globalConfig} from "../../../../config";
import {config} from "../../branch-office/tasks-branch-office.config";
import {CaptureAudioOptions, CaptureError, CaptureVideoOptions, MediaCapture} from "@ionic-native/media-capture";
import {Media, MediaObject} from '@ionic-native/media';
import {File} from '@ionic-native/file';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'tareas1',
    templateUrl: 'tareas1.html',
})
export class Tareas1Page {

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private temporal_video_url: any = null;

    isAndroid: boolean = false;
    filters = [];
    areas = [];
    cargos = [];
    usuarios = [];
    zonas = [];

    hasta = new Date();
    desde = new Date(this.hasta.getFullYear(), this.hasta.getMonth(), 1);

    recording: boolean = false;
    filePath: string;
    fileName: string;
    audio: MediaObject;
    audioList: any[] = [];


    task = {
        inicio: this.desde + "",
        termino: this.hasta + "",
    };

    private view: string = null;
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public camera: Camera,
        private modal: ModalController,
        private util: UtilProvider,
        private loading: LoadingController,
        private request: RequestProvider,
        private applicationRef: ApplicationRef,
        private mediaCapture: MediaCapture,
        private platform: Platform,
        private media: Media,
        private file: File) {
    }

    async ionViewDidLoad() {
        if (this.platform.is('android')) this.isAndroid = true;
        else this.isAndroid = false;

        console.log("isAndroid ", this.isAndroid)
        this.file.tempDirectory = this.file.dataDirectory;

        this.updateDates();
        this.loadFilters();
    }

    /**
     * Trae filtros para tareas
     */
    async loadFilters() {
        const loading = this.loading.create({content: 'Obteniendo filtros'});
        loading.present();
        let data = {};
        await this.request
            .get(config.endpoints.newApi.get.question_types, true)
            .then(async (response: any) => {
                loading.dismiss();
                try {
                    console.log("question_types ", response)

                    await this.request
                        .get(config.endpoints.newApi.get.filters, true)
                        .then((response: any) => {
                            loading.dismiss();
                            try {
                                this.areas = response.data.areas;
                                this.usuarios = response.data.usuarios;

                                console.log("response ", response)
                            }
                            catch (e) {
                                console.log("error ", e);
                            }
                        })
                        .catch((error: any) => {
                            loading.dismiss();
                            console.log("error ", error);
                            //if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
                        });
                    return data;
                }
                catch (e) {
                    console.log("error ", e);
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                console.log("error ", error);
                //if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
            });
        return data;
    }


    /**
     * Captura foto y envia hacia página detalles
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFoto(fromCameraPlugin?: boolean) {
        if (!globalConfig.isBrowser) {
            if(fromCameraPlugin){
                // Configuración para la foto
                const photoOptions: CameraOptions = {
                    targetHeight: 700,
                    targetWidth: 700,
                    quality: 70,
                    destinationType: 0,
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
                        //         this.task['image'] = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
                        //     }
                        // } else {
                        // }
                        this.task['image'] = ('data:image/jpeg;base64,' + result);
    
    
                    }, (error: any) => {
                        this.util.showToast('No se ha capturado ninguna fotografía', 3000);
                    });
            }else {
                let image = await this.getImageCamera();
                if (!image) {
                    this.util.showAlert('Atención', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                    return;
                }

                this.task['image'] = image;
            }
            //this.detalle.tomarFoto(image, pregunta);
        } else {
            this.task['image'] = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            //this.detalle.tomarFoto(image, pregunta);
        }
        return this.task['image'];
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
    


    // Captura un video
    async tomarVideo() {
        let video: any = null;
        // Configuración para el video
        const videoOptions: CaptureVideoOptions = {
            limit: 1,
            quality: 1,
            duration: 5
        };
        const loading = this.loading.create({content: 'Preparando cámara'});
        //loading.present();
        await this.mediaCapture
            .captureVideo(videoOptions)
            .then(async (data: any) => {

                if (data && data[0]) this.task['video'] = data[0].fullPath;
                console.log("video ", this.task['video'])
                if (this.isAndroid == true) this.temporal_video_url = await this.util.getSanitizedBase64VideoUrl(this.task['video']);

                console.log("temporal_video_url ", this.temporal_video_url)
                loading.dismiss();
            })
            .catch((error: CaptureError) => {
                loading.dismiss();
                this.util.showToast('No se ha capturado ningún video', 3000);
            });
        return video;
    }

    /*async tomarAudio() {
        console.log("tomarAudio ", this.file)
        this.file.createFile(this.file.tempDirectory, 'my_file.m4a', true).then(() => {
            console.log("createFile")
            let file = this.media.create('my_file.m4a');
            //let file = this.media.create(this.file.tempDirectory.replace(/^file:\/\//, '') + 'my_file.m4a');
            console.log("file ", file)
            file.startRecord();
            console.log("startRecord")
            window.setTimeout(() => {
                file.stopRecord();
                this.task['audio'] = file;
                console.log("new audio ", file)

            }, 5000);
        });


        this.file.createFile(this.file.tempDirectory, 'record.m4a', true).then(() => {
            let mediaObject = this.media.create(this.file.tempDirectory.replace(/^file:\/\//, '') + 'record.m4a');
            mediaObject.startRecord();
            window.setTimeout(() => {
                mediaObject.stopRecord();
                mediaObject.release();
                /!** Do something with the record file and then delete *!/
                this.file.removeFile(this.file.tempDirectory, 'record.m4a');
            }, 10000);
        });
    }*/


    playAudio(file, idx) {
        if (this.platform.is('ios')) {
            this.filePath = this.file.documentsDirectory.replace(/file:\/\//g, '') + file;
            this.audio = this.media.create(this.filePath);
        } else if (this.platform.is('android')) {
            this.filePath = this.file.externalDataDirectory.replace(/file:\/\//g, '') + file;
            this.audio = this.media.create(this.filePath);
        }
        this.audio.play();
        this.audio.setVolume(0.8);
    }

    startRecord() {
        if (this.platform.is('ios')) {
            this.fileName = 'record' + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + '.3gp';
            this.filePath = this.file.documentsDirectory.replace(/file:\/\//g, '') + this.fileName;
            this.audio = this.media.create(this.filePath);
        } else if (this.platform.is('android')) {
            this.fileName = 'record' + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds() + '.3gp';
            this.filePath = this.file.externalDataDirectory.replace(/file:\/\//g, '') + this.fileName;
            this.audio = this.media.create(this.filePath);
        }
        this.audio.startRecord();
        this.recording = true;
    }

    stopRecord() {
        this.audio.stopRecord();
        let data = {filename: this.fileName};
        this.audioList.push(data);
        localStorage.setItem("audiolist", JSON.stringify(this.audioList));
        this.recording = false;
        //this.getAudioList();
    }

    onPlaying(file) {
        console.log("on play")
       /* if (this.platform.is('ios')) {
            this.filePath = this.file.documentsDirectory.replace(/file:\/\//g, '') + file;
            this.audio = this.media.create(this.filePath);
        } else if (this.platform.is('android')) {
            this.filePath = this.file.externalDataDirectory.replace(/file:\/\//g, '') + file;
            this.audio = this.media.create(this.filePath);
        }
        this.audio.play();
        this.audio.setVolume(0.8);*/

        /*console.log("on Playing ", file)
        const audioFile: MediaObject = this.media.create(file.localURL);
        audioFile.play();*/
    }

    onPause(index) {
        console.log("on Pause ", this.audio, index, this.audioList[index])
        this.audio.pause();
    }

    /**
     * Validación de fechas para traer comunicados
     */
    filterDate(date, from) {
        if (from == 'index') this.task.inicio = date;
        if (from == 'end') this.task.termino = date;
        console.log("date ", date)
        console.log("task ", this.task)
        var d1 = new Date(this.task.inicio);
        var d2 = new Date(this.task.termino);

        console.log("d1, d2 ", d1.getTime(), d2.getTime())
        if (d1.getTime() <= d2.getTime()) {
            //this.getAllChecklists();
        } else {
            this.util.showAlert('Atención', 'La fecha de inicio debe ser menor a la fecha de término');
            /*this.task.inicio = this.desde + "";
            this.task.termino = this.hasta + "";*/
            this.updateDates();
            this.applicationRef.tick();
        }
    }

    /**
     * Actualiza fechas por formato correcto
     */
    updateDates() {
        let curr_month1 = "";
        if ((this.desde.getMonth() + 1) < 10) {
            curr_month1 = "0" + (this.desde.getMonth() + 1);
            this.task.inicio = (this.desde.getFullYear() + "-" + curr_month1)
        } else {
            this.task.inicio = (this.desde.getFullYear() + "-" + (this.desde.getMonth() + 1))
        }
        let curr_day1 = "";
        if ((this.desde.getDate()) < 10) {
            curr_day1 = "0" + this.desde.getDate();
            this.task.inicio = this.task.inicio + "-" + curr_day1
        } else {
            this.task.inicio = this.task.inicio + "-" + this.desde.getDate();
        }
        let curr_month2 = "";
        if ((this.hasta.getMonth() + 1) < 10) {
            curr_month2 = "0" + (this.hasta.getMonth() + 1);
            this.task.termino = (this.hasta.getFullYear() + "-" + curr_month2)
        } else {
            this.task.termino = (this.hasta.getFullYear() + "-" + (this.hasta.getMonth() + 1))
        }
        let curr_day2 = "";
        if ((this.hasta.getDate()) < 10) {
            curr_day2 = "0" + this.hasta.getDate();
            this.task.termino = this.task.termino + "-" + curr_day2
        } else {
            this.task.termino = this.task.termino + "-" + this.hasta.getDate();
        }
    }

    /**
     * Construye url de servicios para envio segun los filtros activados
     * @returns {string}
     */
    async buildParams() {
        let sendTask = this.task;

        console.log("buildParams task ", this.task)

        if (!_.isNull(sendTask['inicio']) && !_.isUndefined(sendTask['inicio'])) {
            let tempDesde = new Date(sendTask['inicio']);
            tempDesde.setDate(tempDesde.getDate() + 1);
            let sendDesde = tempDesde.getFullYear() + "-" + (tempDesde.getMonth() + 1) + "-" + tempDesde.getDate();
            sendTask['inicio'] = sendDesde;
        }

        if (!_.isNull(sendTask['termino']) && !_.isUndefined(sendTask['termino'])) {
            let tempHasta = new Date(sendTask['termino']);
            tempHasta.setDate(tempHasta.getDate() + 1);
            let sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + tempHasta.getDate();
            sendTask['termino'] = sendHasta;
        }

        console.log("sendTask 1 ", sendTask)
        return sendTask
    }


    /**
     * Trae filtros para tareas
     */


    /*{
        "cargos_id": [1,2,3,4,5,  16],
        "sucursales_id": [6,7,8,9,10,  41,48],
        "usuarios_id": [1,2,3],
        "zonas_id": [1, 2],
        "area_id": 1,
        "titulo": "Tarea de prueba 01 - Alberto",
        "nombre": "Nombre de la tarea por aqui",
        "descripcion": "Descripcion aquiiii",
        "inicio": "2019-04:29 10:20:30",
        "termino": "2019-05:05 20:30:30"
    }*/
    async sendTask() {
        console.log("task ", this.task)
        let sendTask = await this.buildParams();
        console.log("sendTask 2 ", sendTask)

        /*const loading = this.loading.create({content: 'Enviando Tarea'});
        loading.present();
        let data = {};
        await this.request
            .get(config.endpoints.newApi.get.question_types, true)
            .then(async (response: any) => {
                loading.dismiss();
                try {
                    console.log("question_types ", response)

                    await this.request
                        .get(config.endpoints.newApi.get.filters, true)
                        .then((response: any) => {
                            loading.dismiss();
                            try {
                                this.areas = response.data.areas;
                                this.usuarios = response.data.usuarios;

                                console.log("response ", response)
                            }
                            catch (e) {
                                console.log("error ", e);
                            }
                        })
                        .catch((error: any) => {
                            loading.dismiss();
                            console.log("error ", error);
                        });
                    return data;
                }
                catch (e) {
                    console.log("error ", e);
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                console.log("error ", error);
            });
        return data;*/
    }

}
