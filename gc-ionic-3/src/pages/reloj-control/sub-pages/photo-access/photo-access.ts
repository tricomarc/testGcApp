import {Component, ViewChild} from '@angular/core';
import {
    Content,
    IonicPage,
    LoadingController,
    MenuController,
    ModalController,
    NavController,
    NavParams,
    Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {Camera, CameraOptions} from "@ionic-native/camera";
import {globalConfig} from "../../../../config";
import {config} from "../../../visita/sub-pages/map/map.config";
import {SessionProvider} from "../../../../shared/providers/session/session";
import {Storage} from "@ionic/storage";
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

/**
 * Generated class for the PhotoAccessPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'photo-access',
    templateUrl: 'photo-access.html',
})
export class PhotoAccessPage {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready: boolean = false;
    isCheckout: boolean = false;
    photo: string;
    password: string;
    message: string;

    sucursales = [];
    markers = [];
    selectedSuc = null;
    user = 0;
    checkin_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private view: string = null;
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        public camera: Camera,
        private modal: ModalController,
        private session: SessionProvider,
        private storage: Storage,
        private platform: Platform) {

        this.ready = true;
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    async ionViewDidLoad() {

        /* if (!_.isUndefined(this.navParams.data.sucursales) && !_.isNull(this.navParams.data.sucursales)) {
             this.sucursales = this.navParams.data.sucursales;
         }*/
        if (!_.isUndefined(this.navParams.data.markers) && !_.isNull(this.navParams.data.markers)) {
            this.markers = this.navParams.data.markers;
        }
        if (!_.isUndefined(this.navParams.data.user) && !_.isNull(this.navParams.data.user)) {
            this.user = this.navParams.data.user;
        }
        if (!_.isUndefined(this.navParams.data.checkin_id) && !_.isNull(this.navParams.data.checkin_id)) {
            if (this.navParams.data.checkin_id > 0) {
                this.checkin_id = this.navParams.data.checkin_id;
                this.isCheckout = true;
            }
        }
        if (!_.isUndefined(this.navParams.data.selectsuc) && !_.isNull(this.navParams.data.selectsuc)) {
            this.selectedSuc = this.navParams.data.selectsuc;
        }
    }

    /**
     * Captura foto para envio
     * @param pregunta
     * @returns {Promise<any>}
     */
    async tomarFoto(fromCameraPlugin?: boolean) {
        let image = null;
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
            this.photo = image;
        } else {
            image = ('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
            this.photo = image;
        }
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
     * Elimina foto tomada
     */
    deletePhoto() {
        this.photo = "";
    }

    /**
     * Seleccion de sucursal para checkin
     */
    changeSuc(suc) {
    }


    /**
     * Valida que se halla completado con campos requeridos para hacer checkin
     */
    checkinReady() {
        if (this.photo == "" || (_.isNull(this.photo)) || (_.isUndefined(this.photo))) {
            this.message = "Debe ingresar foto";
            return false;
        } else if (this.password == "" || (_.isNull(this.password)) || (_.isUndefined(this.password))) {
            this.message = "Debe ingresar Contraseña";
            return false;
        } else if (this.selectedSuc == 0 || (_.isNull(this.selectedSuc)) || (_.isUndefined(this.selectedSuc))) {
            this.message = "Debe seleccionar Sucursal";
            return false;
        } else {
            this.message = "";
            return true;
        }
    }

    /**
     * Envio y validación de checkin en servidor, si el retorno es correcto, se actualizan los markers
     * en memoria con el nuevo estado de la sucursal seleccionada
     */
    sendCheckin() {
        const loading = this.loading.create({content: 'Enviando Checkin'});
        loading.present();
        var toSend = {
            "sucursal_id": this.selectedSuc,
            "latitud_inicial": null,
            "longitud_inicial": null
        };
        this.request
            .post(config.endpoints.post.checkIn, toSend, true)
            .then((response: any) => {
                this.storage.set('checkin_' + this.user, response.data[0].control_checkin_id);
                var foundMark = _.find(this.markers, {'id': this.selectedSuc});
                if (!_.isUndefined(foundMark) && !_.isNull(foundMark)) {
                    var index = _.indexOf(this.markers, foundMark);
                    if (!_.isUndefined(index) && !_.isNull(index)) {
                        this.markers[index]['estado_checkin'] = {
                            codigo: 'incompleta',
                            icono: 'ico-mapa-incompleto.png',
                            nombre: 'Incompleta'
                        };
                        loading.dismiss();
                        this.storage.get('visita_tienda_' + this.user).then((val) => {
                            let visita_tienda = {};
                            if (val) visita_tienda = JSON.parse(val);
                            visita_tienda['markers'] = this.markers;
                            this.storage.set('visita_tienda_' + this.user, JSON.stringify(visita_tienda));
                            this.navCtrl.pop();
                        });
                    } else {
                        loading.dismiss();
                    }
                } else {
                    loading.dismiss();
                }

            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast("Ocurrió un error al marcar Checkin, por favor intente mas tarde", 3000);
            });
    }

    /**
     * Envio y validación de checkout en servidor, si el retorno es correcto, se actualizan los markers
     * en memoria con el nuevo estado de la sucursal seleccionada
     */
    sendCheckout() {
        const loading = this.loading.create({content: 'Enviando Checkout'});
        loading.present();

        var toSend = {
            "control_checkin_id": this.checkin_id,
            "latitud_final": null,
            "longitud_final": null
        };
        this.request
            .post(config.endpoints.post.checkOut, toSend, true)
            .then((response: any) => {
                this.storage.set('checkin_' + this.user, 0);
                var foundMark = _.find(this.markers, {'id': this.selectedSuc});
                if (!_.isUndefined(foundMark) && !_.isNull(foundMark)) {
                    var index = _.indexOf(this.markers, foundMark);
                    if (!_.isUndefined(index) && !_.isNull(index)) {
                        this.markers[index]['estado_checkin'] = {
                            codigo: "visitada",
                            icono: "ico-mapa-finalizado.png",
                            nombre: "OK"
                        };
                        loading.dismiss();
                        this.storage.get('visita_tienda_' + this.user).then((val) => {
                            let visita_tienda = {};
                            if (val) visita_tienda = JSON.parse(val);
                            visita_tienda['markers'] = this.markers;
                            this.storage.set('visita_tienda_' + this.user, JSON.stringify(visita_tienda));
                            this.navCtrl.pop();

                        });
                    } else {
                        loading.dismiss();
                    }
                } else {
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast("Ocurrió un error al marcar Checkin, por favor intente mas tarde", 3000);
            });
    }
}
