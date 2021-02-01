import { Component, Inject, forwardRef } from '@angular/core';
import { IonicPage, NavController, LoadingController, MenuController, Platform, Events, ModalController, Modal } from 'ionic-angular';
import { Device } from '@ionic-native/device';

// Proveedores
import { RequestProvider } from '../../shared/providers/request/request';
import { SessionProvider } from '../../shared/providers/session/session';
import { UtilProvider } from '../../shared/providers/util/util';
import { PushNotificationProvider } from '../../shared/providers/push-notifications/push-notification';
import { MesiboProvider } from '../../shared/providers/mesibo/mesibo';

// Páginas
import { DashboardPage } from "../dashboard/tienda/dashboard";
import { RecoverPasswordPage } from "../recover-password/recover-password";
import { IncidentsAdminPage } from '../incidents/admin/incidents-admin';

import { IndexOperaappPage } from '../index/custom/operaapp/index-operaapp';

// Configuración del componente
import { config } from './login.config';
import { globalConfig } from '../../config';
import { global } from '../../shared/config/global';

import * as _ from 'lodash';
// import * as firebase from 'Firebase';

import { Storage } from "@ionic/storage";
import { IndexPage } from "../index";

import { LoadMenuProvider } from "../../shared/providers/util/loadMenu";
import { EstadisticasPage } from "../dashboard/zonal/estadisticas";
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';
import { TermsComponent } from '../../components/terms/terms';
import { ISession } from '../../shared/interfaces/session.interface';
import { Item } from '../../shared/models/item.class';
// import { CameraComponent } from '../../shared/providers/camera/component/camera';


@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
    providers: [RequestProvider]
})
export class LoginPage {

    // Atributos
    private form: any = {
        ci: '',
        password: ''
    };
    // Representa la información del dispositivo necesaria para autenticar a un usuario
    private deviceData: any = {};

    private userRef = null;

    private is_active_directory: boolean = true;

    private view: string;
    //private firebasePlugin: any;

    // Constructor
    constructor(private navCtrl: NavController,
        private util: UtilProvider,
        private loading: LoadingController,
        private device: Device,
        private request: RequestProvider,
        private session: SessionProvider,
        public storage: Storage,
        private menu: MenuController,
        @Inject(forwardRef(() => PushNotificationProvider)) public pushNotification: PushNotificationProvider,
        private mesiboProvider: MesiboProvider,
        public loadMenu: LoadMenuProvider,
        private event: Events,
        private modalCtrl: ModalController,
        private platform: Platform,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        this.menu.enable(false, "menu");

        this.deviceData = config.deviceData;

        //Si es modo test, se asignan las credenciales por defecto en el login
        if (globalConfig.isTest) {
            this.form.ci = globalConfig.login.usuario;
            this.form.password = globalConfig.login.clave;
        }
    }

    async ionViewDidLoad() {
        this.is_active_directory = await this.session.isActiveDirectory();
    }


    // Cada vez que entramos a la vista del login, incializamos las notificaciones push
    async ionViewWillEnter() {
        this.platform.ready().then(() => {
            this.pushNotification.init(false)
                .then(() => {
                    if (!globalConfig.isBrowser) this.getDeviceInfo();
                })
                .catch(e => { }
                );
        });
    }

    // async test(){
    //     const image = await this.getImageCamera()
    //     console.log(image)
    // }

    // async getImageCamera(): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         try {
    //             this.view = 'CAMERA';
    //             const modal = this.modalCtrl.create(CameraComponent, null, { cssClass: 'modal-full'});
    //             modal.present();
    //             modal.onDidDismiss((data) => {
    //                 this.view = 'CONTENT';
    //                 const image = data && data.image || null;
    //                 return resolve(image);
    //             });

    //         } catch (error) {
    //             return resolve(null);
    //         }
    //     })
	// }


    modalLoginAs() {
        return new Promise(async (resolve, reject) => {
            try {
                var modal = this.modalCtrl.create('ModalLoginAsPage');
                modal.present();
                await modal.onDidDismiss((data) => {
                    resolve(data);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    /**
     * Solicita al servicio validar las credenciales ingresadas
     * @returns {Promise<void>}
     */
    async login() {
        if (!this.form.ci || !this.form.password) {
            this.util.showAlert('Alerta', 'Por favor, complete ambos campos');
            return;
        }

        const loading = this.loading.create({ content: 'Autenticando' });
        loading.present();
        let loginResult = await this.sendCredentials();

        loading.dismiss();

        // Verificamos el resultado del login
        if (!loginResult) {
            return;
        } else {

            /**
             * En este punto tenemos una respuesta, entonces verificamos el status code que entrega la API
             */
            //TODO: Revisar y agregar validaciones de login ya que la API responde con 200 aun en casos de error
            if (this.request.isUnauthorized(loginResult.code, false)) {
                this.util.showAlert("Atención", loginResult.message);
                //this.util.showToast(loginResult.message, 3000);
                return;
            }

            /*FALTAN VALIDACIONES POR DEFINIR, POR EL MOMENTO ASUMIMOS EL 200 COMO LOGIN EXITOSO*/
            if (loginResult.status === true) {
                this.session
                    .saveSession(loginResult)
                    .then(() => {
                        // try { this.updateData(loginResult.usuario.id) } catch (e) { };
                        // Si hay chat disponible, solicitamos registrar al usuario en caso de que no esté registrado
                        /* if (loginResult && global.firebase.apiKey) {
                             if (!firebase.apps.length) {
                                 firebase.initializeApp(global.firebase);
                             }
                             this.userRef = firebase.database().ref('user/');
                             this.registerUserInChat(loginResult);
                         }*/

                        this.storage.set('uuid', this.deviceData.payload.uuid);

                        this.loadMenu.setMenuItems().then(items => {
                            UtilProvider.menuIntent++;
                            this.event.publish("loginSuccess", LoadMenuProvider.menuItems);

                            // TRACK DE LOGIN
                            this.firebaseAnalyticsProvider.trackLoginEvent();


                            // TRACK DE USER ID
                            this.firebaseAnalyticsProvider.trackUserId(loginResult.usuario.jerarquia);
                        });

                        // Verficamos si el usuario tiene chat y si está correctamente configurado
                        this.mesiboProvider.checkChatModuleStatus(loginResult, globalConfig.version);

                        const session: ISession = SessionProvider.state.value;
                        const pendingItemTemrs: boolean = this.isPendingTermsItem(session.terms);

                        if (pendingItemTemrs) {
                            this.navCtrl.setRoot(TermsComponent);
                            return;
                        }

                        if (loginResult.usuario.tipo === 'administrador') {
                            this.navCtrl.setRoot(IncidentsAdminPage);
                            return;
                        }


                        if (!_.isUndefined(loginResult.usuario.jerarquia) && !_.isNull(loginResult.usuario.jerarquia)) {
                            if (loginResult.usuario.jerarquia >= 98) {
                                this.navCtrl.setRoot(IndexPage);
                                /*
                                if(LoadMenuProvider.hasDashboard){
                                    var foundItem = _.find(LoadMenuProvider.menuItems, function (item) {
                                        return item.title === "Inicio" || item.title === "inicio" || item.title === "Estadísticas" || item.title === "Estadisticas" || item.title === "Estadística";
                                    });

                                    if(!_.isUndefined(foundItem) && !_.isNull(foundItem)) this.navCtrl.setRoot(EstadisticasPage);
                                    else this.navCtrl.setRoot(IndexPage);
                                }else this.navCtrl.setRoot(IndexPage);*/


                                //_.find(users, { 'age': 1, 'active': true });
                                //Si el cliente tiene estaditicas, se debe agregar el nombre del modulo.
                                //UtilProvider.actualModule = "Estadisticas";
                                //this.navCtrl.setRoot(EstadisticasPage);
                            } else {
                                if (global.title === 'OPERA APP') {
                                    this.navCtrl.setRoot(IndexOperaappPage);
                                } else {
                                    this.navCtrl.setRoot(DashboardPage);
                                }
                            }

                        } else {
                            this.navCtrl.setRoot(DashboardPage);
                        }
                    });
            } else {
                this.util.showAlert("Atención", loginResult.message);
                //this.util.showToast(loginResult.message, 3000);
            }
        }
    }

    /**
     * Envia credenciales de login a la API para su autenticación
     * @returns {Promise<any>}
     */
    async sendCredentials() {
        let result = null;
        let body = this.util.translateSimpleBody(config.translations.form, this.form);
        await this.request
            .login(config.endpoints.post.login, _.merge(this.deviceData, body))
            .then((response: any) => {
                if (response.code == 403 || response.code == 503) {
                    this.util.showAlert("Atención", response.message);
                } else {
                    result = response;
                }
            })
            .catch((error: any) => {
                this.util.showAlert("Atención", error.message);
            });
        return result;
    }

    /**
     * Redireccion hacia Recuperar contraseña
     */
    recoverPassword() {
        this.navCtrl.setRoot(RecoverPasswordPage);
    }

    /**
     * Se obtiene información del telefono necesaria para hacer llamadas hacia la API.
     */
    async getDeviceInfo() {
        let push_token = await this.pushNotification.getPushToken();
        this.deviceData = {
            appVersion: '',
            payload: {
                available: true,
                cordova: this.device.cordova,
                isVirtual: true,
                manufacturer: this.device.manufacturer,
                model: this.device.model,
                platform: this.device.platform,
                serial: this.device.serial,
                uuid: this.device.uuid,
                version: globalConfig.version
            },
            token: push_token
        };
    }

    // Registra a un usuario en el chat de Firebase
    /*  registerUserInChat(session: any) {
          // Buscamos al usuario por su ID
          this.userRef
              .orderByChild('id')
              .equalTo(session.usuario.id)
              .once('value', (response: any) => {
                  let user = _.find(response.val(), { id: session.usuario.id });
  
                  // Si no existe, lo agregamos a firebase
                  if (!user) {
                      this.userRef
                          .push({
                              name: session.usuario.nombre,
                              id: session.usuario.id
                          });
                  }
              });
      }*/

    updateData(user_id) {
        this.request
            .get('/visita/actualizar3?tipo=usuario', false)
            .then((response: any) => {
                try {
                    if (
                        response
                        && response.data
                        && response.data.sucursales_sin_responder
                    ) {
                        let arr: any = [];

                        _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                            if (visit.estado_id !== 4) {
                                visit.modified = true;
                                let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
                                if (visit_checklist) visit.checklist = visit_checklist;
                                arr.push(visit);
                            }
                        });

                        let visita_tienda: any = {
                            sucursales: response.data.sucursales_sin_responder.sucursales,
                            zonas: response.data.sucursales_sin_responder.zonas,
                            checklists: response.data.sucursales_sin_responder.checklists,
                            visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                            respuestas: response.data.sucursales_sin_responder.respuestas,
                            estados_visita: response.data.sucursales_sin_responder.estado_visita,
                            visitas: arr
                        };


                        visita_tienda.fechaActualizacion = new Date();
                        this.storage.set('visita_tienda_' + user_id, JSON.stringify(visita_tienda));
                    }
                } catch (e) { }
            })
            .catch((error: any) => { });
    }

    async loginCard(card) {

        if (card === 1) {
            this.form = {
                ci: '10596766-7',
                password: '105967'
            };
        } else if (card === 2) {
            this.form = {
                ci: '11893596-9',
                password: '118935'
            };
        } else if (card === 3) {
            this.form = {
                ci: '10538010-0',
                password: '105380'
            };
        } else if (card === 4) {
            this.form = {
                ci: '14405714-7',
                password: '144057'
            };
        }

        let loading = this.loading.create({ content: 'Iniciando sesión' });
        loading.present();

        let loginResult = await this.sendCredentials();

        loading.dismiss();

        // Verificamos el resultado del login
        if (!loginResult) {
            return;
        } else {

            /**
             * En este punto tenemos una respuesta, entonces verificamos el status code que entrega la API
             */
            //TODO: Revisar y agregar validaciones de login ya que la API responde con 200 aun en casos de error
            if (this.request.isUnauthorized(loginResult.code, false)) {
                this.util.showAlert("Atención", loginResult.message);
                //this.util.showToast(loginResult.message, 3000);
                return;
            }

            /*FALTAN VALIDACIONES POR DEFINIR, POR EL MOMENTO ASUMIMOS EL 200 COMO LOGIN EXITOSO*/
            if (loginResult.status === true) {
                this.session
                    .saveSession(loginResult)
                    .then(() => {
                        // Si hay chat disponible, solicitamos registrar al usuario en caso de que no esté registrado
                        /* if (loginResult && global.firebase.apiKey) {
                             if (!firebase.apps.length) {
                                 firebase.initializeApp(global.firebase);
                             }
                             this.userRef = firebase.database().ref('user/');
                             this.registerUserInChat(loginResult);
                         }*/

                        this.storage.set('uuid', this.deviceData.payload.uuid);
                        if (loginResult.usuario.tipo === 'administrador') { this.navCtrl.setRoot(IncidentsAdminPage); return; }
                        this.loadMenu.setMenuItems().then(items => {
                            UtilProvider.menuIntent++;
                            this.event.publish("loginSuccess", LoadMenuProvider.menuItems);

                            // TRACK DE LOGIN
                            this.firebaseAnalyticsProvider.trackLoginEvent();

                            // TRACK DE USER ID
                            this.firebaseAnalyticsProvider.trackUserId(loginResult.usuario.jerarquia);
                        });
                        if (!_.isUndefined(loginResult.usuario.jerarquia) && !_.isNull(loginResult.usuario.jerarquia)) {
                            if (loginResult.usuario.jerarquia >= 98) {
                                //this.navCtrl.setRoot(IndexPage);
                                this.navCtrl.setRoot(EstadisticasPage);
                            } else {
                                this.navCtrl.setRoot(DashboardPage);
                            }
                        } else {
                            this.navCtrl.setRoot(DashboardPage);
                        }
                    });
            } else {
                this.util.showAlert("Atención", loginResult.message);
                //this.util.showToast(loginResult.message, 3000);
            }
        }
    }

    isPendingTermsItem(items: Item[]): boolean {
        return _.find(items, (item: Item) => !item.accepted && item.required) ? true : false;
    }
}