import { Injectable, Inject } from '@angular/core';
import { ToastController, AlertController, Platform } from 'ionic-angular';
import { Base64 } from '@ionic-native/base64';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Network } from "@ionic-native/network";

import { File } from '@ionic-native/file';
import { DomSanitizer } from '@angular/platform-browser';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Geolocation, GeolocationOptions } from "@ionic-native/geolocation";

import { global } from '../../config/global';

import _ from 'lodash';

import { SessionProvider } from "../session/session";
import { RequestProvider } from "../request/request";
import { UpdateProvider } from "../update/update";
import { config } from "../../../pages/visita/visita.config";
import { Storage } from "@ionic/storage";

@Injectable()
export class UtilProvider {

    //Variables para eliminar la doble carga en módulos
    static checklistZonalIntent = 0;
    static comunicadosZonalIntent = 0;
    static menuIntent = 0;

    //Variables para geolocalización
    static backCoords = {
        lat: 0,
        lng: 0,
        dis: 0,
        accuracy: 0
    };
    static sucCoords = {
        lat: 0,
        lng: 0
    };

    /*static accuracy = 0;
    static backLat = 0;
    static backLong = 0;*/
    static hasCheckin = false;
    static hasInternet = true;
    //Variable para registrar actualizaciones desde repositorio ionic pro
    static hasUpdate = false;

    static actualModule = "";

    visita_tienda = {};
    thisSession = null;

    constructor(private toast: ToastController,
        private alert: AlertController,
        private base64: Base64,
        private domSanitizer: DomSanitizer,
        private session: SessionProvider,
        private file: File,
        private camera: Camera,
        private diagnostic: Diagnostic,
        private platform: Platform,
        private network: Network,
        private request: RequestProvider,
        private update: UpdateProvider,
        private storage: Storage,
        private geolocation: Geolocation) {

    }

    // Consulta al servicio e Ionic Pro, si es que hay una actualización
    async checkForUpdate(version: any, isTest: boolean, testBuild: boolean, isBrowser: boolean) {
        const result = {
            required: false,
            available: false
        };
        this.update.isBrowser = isBrowser;
        // Consultamos si existe una actualización disponible
        const updateCheck = await this.update.isUpdate(isTest, testBuild, isBrowser);

        // Si existe y la versión disponible es mayor a la actual (versión '0.0.0', se considera "mayor" por definición)
        if (updateCheck.available && (updateCheck.version === '0.0.0' || this.update.compareVersions(updateCheck.version, version))) {
            result.available = true;
            if (updateCheck.required) {
                result.required = true;
            }
        }

        console.log('result2', JSON.stringify(result));

        return result;
    }


    // Recibe un texto y lo retorna sin acentos y en minúscula
    cleanText(text: string) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    //Evalua si el string ingresado por parámetro es un email válido
    isEmail(email: string) {
        let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(email);
    }

    // Valida el largo de un password
    isPassword(password: string) {
        return password.length >= 6;
    }

    // Retorna un objeto traducido listo para enviar a la API
    // Usar solamente para objetos simples {key1: value1, key2: value2, etc..}
    translateSimpleBody(translations: any, body: any) {
        return _.mapKeys(body, (value, key) => {
            return translations[key];
        });
    }

    // Muestra un mensaje mediante un Toast
    showToast(message: any, duration: number) {
        let t = this.toast.create({
            message: message,
            duration: 5000,
            position: 'top',
            closeButtonText: 'OK',
            showCloseButton: true
        });
        t.present();
    }

    //Muestra un mensaje a través de una alerta
    showAlert(title: string, subtitle: string) {
        let alert = this.alert.create({
            title: title,
            subTitle: subtitle,
            buttons: ['Aceptar']
        });
        alert.present();
    }

    //Muestra un mensaje que espera confirmacion. Retorna true/false en el dismiss
    showConfirmAlert(title: string, subTitle: string) {
        let alert = this.alert.create({
            title,
            subTitle,
            buttons: [
                {
                    text: 'Cancelar',
                    handler: () => {
                        alert.dismiss(false);
                        return false;
                    }
                },
                {
                    text: 'Aceptar',
                    handler: () => {
                        alert.dismiss(true);
                        return false;
                    }
                }
            ]
        });
        return alert;
    }

    // Abre la cámara toma y retorna una foto en base64
    getImage(isBrowser: boolean) {
        return new Promise((resolve, reject) => {

            if (isBrowser) {
                resolve('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
                return;
            }

            let image = null;
            // Configuración para la foto
            const photoOptions: CameraOptions = {
                targetHeight: 1200,
                targetWidth: 900,
                quality: 50,
                destinationType: 0,
                correctOrientation: true,
                saveToPhotoAlbum: (global.savePhotosInAlbum === true ? true : false)
            };
            // Abrimos la cámara
            this.camera
                .getPicture(photoOptions)
                .then(async (result: any) => {
                    if (!result) {
                        this.showAlert('Alerta', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                        reject();
                        return;
                    }

                    if (this.platform.is('android')) {
                        
                        // let base64: string = await this.convertLocalFileToBase64(result, true);

                        // if (!base64) {
                        //     this.showAlert('Alerta', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                        //     reject();
                        //     return;
                        // }

                        // base64 = ('data:image/jpeg;base64,' + base64.split('base64,').pop());

                        // resolve(base64);
                        // return;
                    }

                    // Completamos el base64
                    image = ('data:image/jpeg;base64,' + result);
                    resolve(image);

                }, (error: any) => {
                    this.showToast('No se ha capturado ninguna fotografía', 3000);
                    reject();
                });
        });
    }

    // Abre la librería y retorna una foto en base64
    openLibrary(isBrowser: boolean) {
        return new Promise((resolve, reject) => {

            if (isBrowser) {
                resolve('data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==');
                return;
            }

            let image = null;
            // Configuración para la foto
            const photoOptions: CameraOptions = {
                targetHeight: 700,
                targetWidth: 700,
                quality: 70,
                destinationType: 0,
                correctOrientation: true,
                sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
            };
            // Abrimos la cámara
            this.camera
                .getPicture(photoOptions)
                .then(async (result: any) => {
                    if (!result) {
                        this.showAlert('Alerta', 'No ha sido posible seleccionar una fotografía, intente nuevamente.');
                        reject();
                        return;
                    }

                    // Completamos el base64
                    // if (this.platform.is('android')) {
                    //     let base64: string = await this.convertLocalFileToBase64(result, true);

                    //     if (base64) {
                    //         image = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
                    //     }
                    // } else {
                    // }
                    image = ('data:image/jpeg;base64,' + result);

                    resolve(image);

                }, (error: any) => {
                    this.showToast('No ha sido posible seleccionar una fotografía', 3000);
                    reject();
                });
        });
    }

    // Abre la cámara toma y retorna una foto en base64
    getCorectiveImage() {
        return new Promise((resolve, reject) => {

            let image = null;
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
            this.camera
                .getPicture(photoOptions)
                .then(async (result: any) => {
                    if (!result) {
                        this.showAlert('Alerta', 'No se ha capturado ninguna fotografía, intente nuevamente.');
                        reject();
                        return;
                    }

                    // Completamos el base64
                    // if (this.platform.is('android')) {
                    //     let base64: string = await this.convertLocalFileToBase64(result, true);

                    //     if (base64) {
                    //         image = ('data:image/jpeg;base64,' + base64.split('base64,').pop());
                    //     }
                    // } else {
                    // }
                    image = ('data:image/jpeg;base64,' + result);

                    resolve(image);

                }, (error: any) => {
                    this.showToast('No se ha capturado ninguna fotografía', 3000);
                    reject();
                });
        });
    }


    // Recibe clases css que representan íconos y colores de ionic 1 y retorna los valores para ionic 2
    getIconAndColorFromV1(info: any) {
        // Del servicio recibimos la clase css que usaba ionic 1
        // Dividimos las clases
        let values = info.split(' ');
        let iconV1 = '';
        let data: any = {};
        try {
            // Idetificamos el ícono (v1) que resulta del split
            iconV1 = _.find(values, (value) => {
                return (_.includes(value, 'ion-') || _.includes(value, 'icon-'));
            });

            // Luego buscamos el ícono en su versión 2
            data.icon = _.find(icons, { v1: iconV1 }).v2;
            // Finalmente identificamos el color
            for (let index = 0; index < values.length; index++) {
                if (_.includes(global.colors, values[index])) {
                    data.color = values[index];
                    break;
                }
            }
        } catch (e) {
        }
        // Si los resultados anteriores no fueron satisfactorio asignamos valores por defecto
        if (!data.icon) data.icon = 'md-radio-button-off';
        //if (!data.color) data.color = 'default';
        return data;
    }

    // A partir de la ubicación de un archivo, obtiene su versión en base64
    async convertLocalFileToBase64(path: any, isImage?: boolean) {
        try{
            let result = null;
            if (this.platform.is('android')) {
                await this.base64
                    .encodeFile(path)
                    .then((base64File: string) => {
                        result = base64File;
                    }, (err) => {
                        console.log('ERR', err);
                    })
                    .catch((error: any) => {
                        console.log('ERROR', error);
                    });
    
            } else if (this.platform.is('ios')) {
                await new Promise((resolve, reject) => {
                    let fileName = path.substring(path.lastIndexOf('/') + 1);
                    let filePath = path.substring(0, path.lastIndexOf("/") + 1);
                    this.file.readAsDataURL(filePath, fileName).then(
                        file64 => {
                            resolve(file64);
                        }).catch(err => {
                            reject(err);
                        });
                })
                    .then((base64File: string) => {
                        result = base64File;
                    }, (err) => {
                        console.log('ERR 2', err);
                    })
                    .catch((error: any) => {
                        console.log('ERROR 2', error);
                    });
            }
    
            console.log(result);
            console.log('IS IMAGE'+ isImage);
            if (isImage) {
                const canvas = document.createElement('canvas');
                canvas.id = "canvasB64";
    
                const img = new Image();
                img.src = result;
                console.log(result);
                let dimensions =  { width: 525, height: 700 };
                if(img.height < img.width){
                    dimensions.width = 700;
                    dimensions.height = 525;
                }
                await new Promise((resolve) => {
                    img.onload = () => {
    
                        canvas.width = dimensions.width;
                        canvas.height = dimensions.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        result = canvas.toDataURL();
    
                        canvas.remove();
                        resolve(true);
                    }
                });
            }
            console.log(result);
            return result;


        }catch(error){
            console.log('ERROR')
            console.log(error);
        }
    }

    // Verifica si un string es JSON
    isJson(str: string) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    // Recibe una fecha en texto y la retorna en formato dd-MM-yyyy
    getFormatedDateFromString(date: any) {
        let result = null;
        try {
            // Se le agrega '00:00:00' para que no reste un día
            let temp = new Date(date + ' 00:00:00');
            result = (temp.getDate() < 10 ? ('0' + temp.getDate()) : temp.getDate()) +
                '-' + ((temp.getMonth() + 1) < 10 ? ('0' + (temp.getMonth() + 1)) : (temp.getMonth() + 1)) +
                '-' + temp.getFullYear();
        }
        catch (e) {
        }
        return result;
    }

    // Recibe una fecha en texto y la retorna en formato dd-MM-yyyy
    getFormatedDateFromObject(date: any) {
        let result = null;
        try {
            result = (date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()) +
                '-' + ((date.getMonth() + 1) < 10 ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1)) +
                '-' + date.getFullYear();
        }
        catch (e) {
        }
        return result;
    }

    // Retorna la url sanitizada en base64 de un video local
    async getSanitizedBase64VideoUrl(path: any) {
        let video_url: any = null;
        let video_name: any = null;

        // Obtenemos el nombre del video a partir del local path
        await this.file.resolveLocalFilesystemUrl(path)
            .then((info: any) => {
                video_name = info.name;
            })
            .catch((error: any) => {
                console.log('Error al obtener la información del video', error);
            });

        // Si tenemos el nombre leemos el video y retornamos su base64
        if (video_name) {
            await this.file.readAsDataURL(path.replace(video_name, ''), video_name)
                .then((result: any) => {
                    video_url = this.sanitizeUrl(result);
                })
                .catch((error: any) => {
                    console.log('Error al obtener el path en base64', error);
                });
        }
        return video_url;
    }

    // Arregla el base64 de los videos para que la vista los pueda renderear
    sanitizeUrl(result: any) {
        return this.domSanitizer.bypassSecurityTrustUrl(result);
    }

    /**
     * Trae data asociada al usuario almacenados en memoria
     * @returns {Promise<{}>}
     */
    async getInternalSession() {
        let result = {};
        await this.session.getSession().then(session => {
            result = session;
        });
        return result;
    }

    /**
     * Cambio de formato de fechas para envio a API
     * @param date
     * @returns {string}
     */
    dateToYMD(date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        return '' + y + '-' + m + '-' + (d <= 9 ? '0' + d : d);
    }

    // Retorna si un rut es válido o no
    isRut(fullRut: string): boolean {
        if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(fullRut)) return false;
        let tmp = fullRut.split('-'), digv = tmp[1], rut = tmp[0];
        if (rut.length < 3) return false;
        if (digv === 'K') digv = 'k';
        return (this.calculateDv(rut) === digv);
    }

    // Calcula y retorna el dígito verificador de un rut
    private calculateDv(rut: any): string {
        let result = null, sum = 0, mul = 2;
        for (let i = (rut.length - 1); i >= 0; i--) {
            sum += parseInt(rut[i]) * mul;
            mul++;
            if (mul > 7) mul = 2;
        }
        result = (11 - sum % 11);
        if (result === 11) result = 0;
        if (result === 10) result = 'k';
        return result.toString();
    }

    // Verifica si todos los permisos fueron otorgados
    async checkPermissions() {
        let all_permissions_granted: boolean = true;

        // Se manejan distintos estados por SO
        if (this.platform.is('android')) {
            let permissions_aux: any = _.map(permissions, 'key');

            // Obtenemos los estados del arreglo de permisos obligatorios para android
            await this.diagnostic.getPermissionsAuthorizationStatus(permissions_aux)
                .then((statuses: any) => {
                    for (let permission in statuses) {
                        if (statuses[permission] !== 'GRANTED') {
                            all_permissions_granted = false;
                            break;
                        }
                    }
                })
                .catch((error) => {
                });

        } else if (this.platform.is('ios')) {
            // Se solicitan los estados de los permisos individualmente

            // Estado del permiso de ubicación
            await this.diagnostic
                .getLocationAuthorizationStatus()
                .then((response: any) => {
                    try {
                        if (response &&
                            (response.toLowerCase() === 'not_determined'
                                || response.toLowerCase() === 'not_requested'
                                || response.toLowerCase() === 'denied')) all_permissions_granted = false;
                    } catch (e) {
                    }
                })
                .catch((error: any) => {
                    console.log('LOCATION ERROR ', error);
                });

            // Estado del permiso de cámara
            if (all_permissions_granted) {
                await this.diagnostic
                    .getCameraAuthorizationStatus()
                    .then((response: any) => {
                        try {
                            if (response &&
                                (response.toLowerCase() === 'not_determined'
                                    || response.toLowerCase() === 'not_requested'
                                    || response.toLowerCase() === 'denied')) all_permissions_granted = false;
                        } catch (e) {
                        }
                    })
                    .catch((error: any) => {
                        console.log('CAMERA ERROR ', error);
                    });
            }
        }

        return all_permissions_granted;
    }

    // Resuelve una promesa después de x tiempo en milisegundos (duration)
    awaitMs(duration: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration);
        });
    }

    // Retorna el estado de los permisos obligatorios por plataforma 
    async getPermissionsStatuses() {
        let permissions_statuses: any = [];

        if (this.platform.is('android')) {
            let permissions_aux: any = _.map(permissions, 'key');

            await this.diagnostic.getPermissionsAuthorizationStatus(permissions_aux)
                .then((statuses: any) => {
                    for (let permission in statuses) {
                        permissions_statuses.push({
                            key: permission,
                            status: statuses[permission]
                        });
                    }
                })
                .catch((error) => {
                });
        } else if (this.platform.is('ios')) {
            // Estado del permiso de ubicación
            await this.diagnostic
                .getLocationAuthorizationStatus()
                .then((response: any) => {
                    permissions_statuses.push({
                        key: 'ACCESS_FINE_LOCATION',
                        status: response.toLowerCase()
                    });
                })
                .catch((error: any) => {
                    console.log('LOCATION ERROR ', error);
                });

            // Estado del permiso de cámara
            await this.diagnostic
                .getCameraAuthorizationStatus()
                .then((response: any) => {
                    permissions_statuses.push({
                        key: 'CAMERA',
                        status: response.toLowerCase()
                    });
                })
                .catch((error: any) => {
                    console.log('CAMERA ERROR ', error);
                });
        }

        return permissions_statuses;
    }

    // Retorna el cargo del usuario actual
    async getUserCharge() {
        let charge = null;
        await this.session
            .getSession()
            .then((response: any) => {
                try {
                    // Si es admin asignamos el cargo directamente
                    if (response.usuario.tipo === 'administrador') charge = 'admin';
                    // Si no lo es, según la jerarquía asignamos el cargo
                    else charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'branch-office' : (response.usuario.jerarquia < 100 ? 'zonal' : 'country'));
                } catch (e) {
                }
            })
            .catch((error: any) => {
            });
        return charge;
    }

    // Verifica si el dispositivo cuenta con conexión a Internet y retorna true o false según corresponda
    isNetworkConnected(isBrowser: boolean) {
        if (isBrowser) return true;
        if (this.network.type === 'none' || this.network.type === 'unknown') {
            return false;
        }
        return navigator.onLine;
    }

    // Consulta a la API por la configuración del cliente y ve si usa active directory para guardar la configuración localmente
    async checkActiveDirectory() {
        let is_active_directory: boolean = await this.session.isActiveDirectory();
        this.request
            .get('/info', false)
            .then((response: any) => {
                if (response && response.data) {
                    let temp = (response.data.login_alternativo === true ? true : false);
                    if (temp !== is_active_directory) this.session.setActiveDirectory(temp);
                }
            })
            .catch((error: any) => {
            });
    }

    async setFavorite(params: any) {
        return await this.request.post('/gestiones/favorito', params, true);
    }

    // Busca y retorna un setting a partir de su nombre
    async getSettingByName(name: string) {
        let setting: any = null;

        await this.session
            .getSession()
            .then((response: any) => {
                if (
                    response
                    && response.usuario
                    && response.usuario.settings
                    && response.usuario.settings.length
                ) {
                    setting = _.find(response.usuario.settings, { nombre: name });
                }
            })
            .catch((error: any) => { });
        return setting;
    }

    getLocationFromNavigator(options: any) {
        return new Promise((resolve, reject) => {
            navigator.geolocation
                .getCurrentPosition((response: any) => {
                    resolve(response);
                }, (error: any) => {
                    reject(error);
                }, options);
        });
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd
    getFormatedDate(date: any) {
        let year = date.getFullYear();
        let month = (date.getMonth() + 1);
        let day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }


    /**
     * Agrega respuestas ficticias para casos en que las preguntas tengan aplica/no aplica y se seleccione no aplica
     * @param itemZona
     * @returns {Promise<{}>}
     */
    async updateVisitResps(arreglo_respuestas, visit) {
        return new Promise(resolve => {
            this.getInternalSession().then(async (session) => {
                this.thisSession = session;
                this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
                    if (val) {
                        this.visita_tienda = JSON.parse(val);
                    }
                    console.log("arreglo_respuestas", arreglo_respuestas)
                    console.log("visita_tienda", this.visita_tienda)
                    _.forEach(arreglo_respuestas, function (resp) {
                        if (!_.isNull(resp.foto) && !_.isUndefined(resp.foto)) {
                            console.log("tiene foto", resp)
                            var tempPhotos = resp.foto;
                            resp.foto = [];
                            if (_.isArray(tempPhotos)) {
                                _.forEach(tempPhotos, function (pic) {
                                    resp.foto.push(pic);
                                });
                            } else {
                                resp.foto.push(tempPhotos);
                            }
                            console.log("new photo ", resp.foto)
                        }
                    });
                    let checklistVisit = [];
                    if (visit == null) checklistVisit = this.visita_tienda['checklist_visita'];
                    else checklistVisit = _.find(this.visita_tienda['checklist_visita'], { visita_id: visit.visita_id });

                    console.log("checklistVisit", checklistVisit)

                    if (!_.isUndefined(checklistVisit) && !_.isNull(checklistVisit) && checklistVisit.length > 0) {
                        for (const check of checklistVisit) {
                            console.log("check ", check)
                            if (_.isArray(check.ambitos) && check.ambitos.length > 0) {
                                for (const ambito of check.ambitos) {
                                    console.log("ambito ", ambito)
                                    const preguntas = Object.keys(ambito.preguntas).map(i => ambito.preguntas[i]);
                                    console.log("preguntas ", preguntas)
                                    if (preguntas.length > 0) {
                                        _.forEach(preguntas, function (pregunta) {
                                            console.log("pregunta", pregunta)
                                            if (pregunta.aplica == 1 && (!_.isNull(pregunta.hasApply) && !_.isUndefined(pregunta.hasApply) && pregunta.hasApply == false)) {
                                                //TODO: agrega respuesta ficticia
                                                console.log("alternativas ", pregunta.alternativas)
                                                console.log("alternativas[0] ", pregunta.alternativas[Object.keys(pregunta.alternativas)[0]])

                                                if (pregunta.tipo_id == 1) {
                                                    let resp = {
                                                        alternativa_peso: 0,
                                                        ambito_id: ambito.id,
                                                        comentario: 0,
                                                        comentarios: null,
                                                        id: "",
                                                        modified: true,
                                                        nombre_alternativa: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].nombre,
                                                        nombre_pregunta: pregunta.nombre,
                                                        pregunta_alternativa_id: 0,
                                                        pregunta_id: pregunta.id,
                                                        respuesta_alternativa_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                                        texto_adicional: "",
                                                        texto_respuesta: "",
                                                        tipo_id: 1,
                                                        visita_id: check.visita_id,
                                                        peso: 0,
                                                        noAplica: true
                                                    };
                                                    console.log("no aplica resp 1 ", resp, arreglo_respuestas)
                                                    arreglo_respuestas.push(resp);
                                                } else if (pregunta.tipo_id == 2) {
                                                    let resp = {
                                                        ambito_id: ambito.id,
                                                        checkbox_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                                        checked: true,
                                                        comentario: 0,
                                                        comentarios: null,
                                                        modified: true,
                                                        nombre_alternativa: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].nombre,
                                                        nombre_pregunta: pregunta.nombre,
                                                        pregunta_alternativa_id: 0,
                                                        pregunta_id: pregunta.id,
                                                        respuesta_alternativa_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                                        tipo_id: 2,
                                                        visita_id: check.visita_id,
                                                        peso: 0,
                                                        noAplica: true
                                                    };
                                                    console.log("no aplica resp 2 ", resp, arreglo_respuestas)
                                                    arreglo_respuestas.push(resp);
                                                } else if (pregunta.tipo_id == 3) {
                                                    let resp = {
                                                        alternativa_peso: 0,
                                                        ambito_id: ambito.id,
                                                        modified: true,
                                                        nombre_alternativa: "",
                                                        nombre_pregunta: pregunta.nombre,
                                                        pregunta_alternativa_id: 0,
                                                        pregunta_id: pregunta.id,
                                                        respuesta_alternativa_id: 0,
                                                        texto_respuesta: "No Aplica",
                                                        tipo_id: 3,
                                                        visita_id: check.visita_id,
                                                        noAplica: true
                                                    };
                                                    console.log("no aplica resp 3 ", resp)
                                                    arreglo_respuestas.push(resp)
                                                } else if (pregunta.tipo_id == 4) {
                                                    let resp = {
                                                        alternativa_peso: 0,
                                                        ambito_id: ambito.id,
                                                        foto: [{
                                                            foto: "data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==",
                                                        }],
                                                        id: "54749030-62061000-76471000-44501000-229478956435100000000000",
                                                        modified: true,
                                                        nombre_alternativa: "",
                                                        nombre_pregunta: pregunta.nombre,
                                                        pregunta_alternativa_id: 0,
                                                        pregunta_id: pregunta.id,
                                                        respuesta_alternativa_id: 0,
                                                        texto_respuesta: "",
                                                        tipo_id: 4,
                                                        visita_id: check.visita_id,
                                                        noAplica: true
                                                    };
                                                    console.log("no aplica resp 4 ", resp)
                                                    arreglo_respuestas.push(resp)
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }

                        _.forEach(arreglo_respuestas, function (resp) {
                            if ((resp.tipo_id == 1 || resp.tipo_id == 2) && (_.isUndefined(resp.alternativa_peso) || _.isNull(resp.alternativa_peso))) resp.alternativa_peso = null;
                        });
                        console.log("return ", arreglo_respuestas)

                    }
                    resolve(arreglo_respuestas);
                });
            });
        });
    }

    async await(duration: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, duration)
        });
    }

    // Retorna el estado del gps (on/off)
    async checkGpsEnabled() {
        let isGpsEnabled: boolean = false;
        await this.diagnostic
            .isLocationEnabled()
            .then((enabled: any) => {
                isGpsEnabled = enabled;
            })
            .catch((error: any) => { });
        return isGpsEnabled;
    }


    logError(error: any, code: any, version: any, notSave?: boolean) {
        if (!error) return;
        // Cuerpo del error
        let body = {
            "version_app": version,
            "so": (this.platform.is('ios') ? 'iOS' : this.platform.is('android') ? 'Android' : 'Browser'),
            "error": (code ? (code + ': ') : '') + error.toString()
        };
        // Request a la API
        this.request.post('/errorlog/error', body, true)
            .then(async (response: any) => { })
            .catch((apiError: any) => {
                if (!notSave) this.saveLocally(error, code, version);
            });
    }

    async saveLocally(data: any, code: string, version: string) {
        const errors: any[] = await this.getErrorStore();
        errors.push({ data: data, code: code, version: version });
        this.storage.set('ERROR_STORE', JSON.stringify(errors)).then(() => { }).catch(() => { });
    }

    async getErrorStore(): Promise<any[]> {
        return await this.storage.get('ERROR_STORE').then((res) => (JSON.parse(res) || [])).catch(err => []);
    }

    async sendBulkRequestErrors() {
        const errors: any[] = await this.getErrorStore();
        const promises = [];

        _.forEach(errors, (err: any) => {
            try {
                err.data = JSON.stringify(err.data);
            } catch (e) {
                try { err.data = err.data.toString(); } catch (e) { }
            }
            promises.push(new Promise((resolve) => {
                this.request.post('/errorlog/error', {
                    "version_app": err.version,
                    "so": (this.platform.is('ios') ? 'iOS' : this.platform.is('android') ? 'Android' : 'Browser'),
                    "error": `${err.code} ${err.data}`
                }, true)
                    .then((response: any) => { resolve({ success: true, data: err.data }) })
                    .catch((apiError: any) => { resolve({ success: false, data: err.data }) });
            }));
        });

        Promise.all(promises)
            .then(async (results: any[]) => {
                _.forEach(results, (res: any) => {
                    if (res.success) {
                        _.remove(errors, (err) => {
                            return (JSON.stringify(err.data) === JSON.stringify(res.data));
                        });
                    }
                });
                this.storage.set('ERROR_STORE', JSON.stringify(errors));
            });
    }

    async getPosition() {
        const options: GeolocationOptions = { timeout: 15000, enableHighAccuracy: true, maximumAge: 100 };
        let result = null;
        await this.geolocation
            .getCurrentPosition(options)
            .then((response: any) => {
                result = {
                    latitude: response.coords.latitude,
                    longitude: response.coords.longitude,
                    accuracy: response.coords.accuracy,
                    currentDate: new Date(),
                    currentTimestamp: response.timestamp
                };
            })
            .catch((error: any) => { });
        return result;
    }

    // Retorna la distancia (en metros) entre 2 puntos
    getDistance(location1, location2) {
        var R = 6378137; // Promedio del radio de la tierra en metros
        var dLat = this.rad(location2.latitude - location1.latitude);
        var dLong = this.rad(location2.longitude - location1.longitude);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(location1.latitude)) * Math.cos(this.rad(location2.latitude)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    }

    // Convierte "x" a radianes
    rad(x) {
        return x * Math.PI / 180;
    }


    moveToFirst(value: any, element: any[], comparate: string) {
        var first = value;
        const e = element.sort((x, y) => {
            return x[comparate] == first ? -1 : y[comparate] == first ? 1 : 0;
        });

        return e;
    }

    removeDuplicates(arr: any[]) {
        const filteredArr: any[] = arr.reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        return filteredArr;
    }


    getMatches(arr1: number[], arr2: any[]) {
        let filtered = [];
        let result = [];
        arr1.map((id: number) => {
            filtered = arr2.filter((item) => { return item.id == id });
            if (filtered && filtered.length > 0) {
                result.push(filtered[0]);
            }
        });
        return result;
    }

    async getColors() {
        const settings: any = (await this.session.getSession())['usuario'].settings;
        let colorSetting = settings.filter((setting) => { return setting.nombre == 'color_estados_checklist' });
        if (colorSetting.length > 0)
            colorSetting = colorSetting.shift();
        else return false;
        const params = this.isJson(colorSetting.params) ? JSON.parse(colorSetting.params) : false;

        return params;
    }

}

export const dummyImage = 'data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==';

export const permissions = [
    { key: 'ACCESS_FINE_LOCATION', label: 'Servicio de ubicación' },
    { key: 'CAMERA', label: 'Servicio de cámara' },
    { key: 'WRITE_EXTERNAL_STORAGE', label: 'Serivicio de almacenamiento' }
];

export const icons = [{
    v1: 'ion-home',
    v2: 'md-home'
}, {
    v1: 'ion-plus-circled',
    v2: 'md-add-circle'
}, {
    v1: 'ion-android-time',
    v2: 'md-time'
}, {
    v1: 'ion-checkmark-circled',
    v2: 'md-checkmark-circle'
}, {
    v1: 'ion-search',
    v2: 'md-search'
}, {
    v1: 'ion-close-circled',
    v2: 'md-close-circle'
}, {
    v1: 'ion-information-circled',
    v2: 'md-information-circle'
}, {
    v1: 'ion-checkmark',
    v2: 'md-checkmark'
}, {
    v1: 'ion-android-alert',
    v2: 'md-alert'
}, {
    v1: 'ion-stats-bars',
    v2: 'md-stats'
}, {
    v1: 'ion-arrow-graph-up-right',
    v2: 'md-trending-up'
}, {
    v1: 'ion-ribbon-a',
    v2: 'md-ribbon'
}, {
    v1: 'ion-speakerphone',
    v2: 'md-megaphone'
}, {
    v1: 'ion-android-checkbox',
    v2: 'md-checkmark-circle-outline'
}, {
    v1: 'ion-folder',
    v2: 'ios-folder'
}, {
    v1: 'ion-filing',
    v2: 'ios-albums'
}, {
    v1: 'ion-android-warning',
    v2: 'md-warning'
}, {
    v1: 'ion-eye',
    v2: 'eye'
}, {
    v1: 'ion-android-checkmark-circle',
    v2: 'md-checkmark-circle'
}, {
    v1: 'ion-location',
    v2: 'md-pin'
}, {
    v1: 'icon-visualapp',
    v2: 'eye'
}, {
    v1: 'icon-checklist',
    v2: 'md-checkmark-circle'
}, {
    v1: 'icon-incidencias',
    v2: 'md-warning'
}, {
    v1: 'icon-recepcion',
    v2: 'ios-albums'
}, {
    v1: 'ion-help-circled',
    v2: 'md-help-circle'
}, {
    v1: 'ion-android-textsms',
    v2: 'md-text'
}, {
    v1: 'ion-clock',
    v2: 'md-time'
}, {
    v1: 'ion-pie',
    v2: 'pie'
}, {
    v1: 'ion-trophy',
    v2: 'trophy'
}, {
    v1: 'ion-speedometer',
    v2: 'md-speedometer'
}, {
    v1: 'ion-chatboxes',
    v2: 'md-chatboxes'
}, {
    v1: 'ion-notification',
    v2: 'md-notifications'
}, {
    v1: 'ion-settings',
    v2: 'md-settings'
}, {
    v1: 'ion-clipboard',
    v2: 'md-clipboard'
}, {
    v1: 'ion-bus',
    v2: 'bus'
}, {
    v1: 'ion-close',
    v2: 'md-close'
}

];