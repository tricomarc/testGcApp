import { Component, ViewChild, ApplicationRef, ViewContainerRef, ComponentFactoryResolver, Inject, forwardRef } from '@angular/core';
import { Platform, Nav, Alert, AlertController, LoadingController, Events } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';
import { Pro } from '@ionic/pro';
import { Device } from '@ionic-native/device';
import { LocalNotifications } from '@ionic-native/local-notifications';
import * as _ from 'lodash';
import { OpenNativeSettings } from '@ionic-native/open-native-settings';
import { Diagnostic } from '@ionic-native/diagnostic';

// Proveedores
import { SessionProvider } from '../../shared/providers/session/session';
import { UtilProvider } from "../../shared/providers/util/util";
import { PushNotificationProvider } from '../../shared/providers/push-notifications/push-notification';
import { UpdateProvider } from '../../shared/providers/update/update';
import { MesiboProvider } from '../../shared/providers/mesibo/mesibo';
import { RequestProvider } from "../../shared/providers/request/request";

// Configuración
import { globalConfig } from '../../config'
import { config } from './menu.config'
import { global } from '../../shared/config/global';

// Páginas
import { LoginPage } from '../../pages/login/login';
import { Storage } from "@ionic/storage";
import { DashboardPage } from "../../pages/dashboard/tienda/dashboard";
import { ChangePasswordPage } from "../../pages/change-password/change-password";
import { IncidentsAdminPage } from '../../pages/incidents/admin/incidents-admin';
import { IndexPage } from "../../pages/index";
import { EstadisticasPage } from "../../pages/dashboard/zonal/estadisticas";
import { ChatPage } from "../../pages/chat/chat";
import { KnowledgeBasePage } from "../../pages/knowledge-base/knowledge-base";
import { IndexOperaappPage } from '../../pages/index/custom/operaapp/index-operaapp';
import { VisualPage } from '../../pages/visual/branch-office/visual';

import { AmbitoPage } from '../../pages/checklist/sub-pages/ambito/ambito';
import { MaquetasPage } from '../../pages/maquetas/maquetas';

// Componentes
import { LoadMenuProvider } from "../../shared/providers/util/loadMenu";
import { UpdateComponent } from "../update/update";
import { PermissionRequestComponent } from '../permissions-request/permissions-request';
import { ExternalSiteComponent } from '../external-site/external-site';

import { CustomToast } from '../../components/custom-toast/custom-toast';

import { ChecklistTiendaPage } from "../../pages/checklist/tienda/checklist-tienda";
import { TasksBranchOfficePage } from "../../pages/tasks/branch-office/tasks-branch-office";

//Pro.init(global.pro.appId);
import { ComunicadosTiendaPage } from "../../pages/comunicados/tienda/comunicados-tienda";
import { RoomComponent } from '../../pages/chat/components/room/room';
import { NotificationsPage } from '../../pages/notifications/notifications';
import { MiGestionPage } from '../../pages/mi-gestion/mi-gestion';
import { MapVisitPage } from '../../pages/map-visit/map-visit';
import { ISetting } from '../../shared/interfaces/setting.interface';
import { ChecklistZonalPage } from '../../pages/checklist/zonal/checklist-zonal';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';
import { LeanPage } from '../../pages/lean/lean';
import { KpiMaicaoPage } from '../../pages/kpi/custom/maicao/kpi-maicao';
import { BluetoothService } from '../../shared/providers/bluetooth/bluetooth';
import { TermsComponent } from '../terms/terms';
import { ISession } from '../../shared/interfaces/session.interface';
import { Item } from '../../shared/models/item.class';
import { TaskManagerPage } from '../../pages/task-manager/task-manager';

// Interface para representar un ítem del menú
export interface ItemInterface {
    title: string;
    page: any;
    icon: string;
    customIcon?: any;
    url_prefix?: any;
}

declare var cordova;

@Component({
    selector: 'menu',
    templateUrl: 'menu.html'
})

export class MenuComponent {

    @ViewChild(Nav) nav: Nav;
    @ViewChild('customToastElement', { read: ViewContainerRef }) container: ViewContainerRef;

    thisSession = null;


    // Atributos
    private rootPage: any;
    private menuItems: ItemInterface[] = [];
    private userData: any = null;
    private versionNumber: any = '';

    private bundleId = global.bundle_id;

    private hierarchy: any = null;
    private is_active_directory: boolean = true;
    private locked_buttons: boolean = false;
    private optionalUpdateAvailable: boolean = false;

    private clientName: string = global.title;
    private isGoogleAnalyticsReady: boolean = false;

    public static isBackground: boolean = false;

    private acceptedDistance: number = 500;

    private checkoutAlert: any = null;

    private checklistSetting: any = null;

    private forceCheckout: boolean = true;

    private showPass: boolean = true;

    // diccionario
    private premios: string;

    constructor(private platform: Platform,
        private session: SessionProvider,
        public storage: Storage,
        private applicationRef: ApplicationRef,
        private appVersion: AppVersion,
        private util: UtilProvider,
        private alert: AlertController,
        private request: RequestProvider,
        private loading: LoadingController,
        public loadMenu: LoadMenuProvider,
        private events: Events,
        private device: Device,
        private diagnostic: Diagnostic,
        private openNativeSettings: OpenNativeSettings,
        /* private googleAnalytics: GoogleAnalytics, */
        private componentFactoryResolver: ComponentFactoryResolver,
        @Inject(forwardRef(() => PushNotificationProvider)) private pushNotification: PushNotificationProvider,
        private mesiboProvider: MesiboProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private localNotifications: LocalNotifications,
        private update: UpdateProvider,
        private bluetoothService: BluetoothService) {

        this.versionNumber = globalConfig.version;

        // Cuando la plataforma esté lista asignamos la primera vista que verá el usuario
        this.platform.ready().then(async () => {


            this.setRootPage(false, false, true);

            this.loadMenu.setMenuItems().then(items => {
                UtilProvider.menuIntent++;
                this.menuItems = items;
            });


            this.setMenuData();

            this.is_active_directory = await this.session.isActiveDirectory();

            /**
             * Al iniciarse la app checkeamos si hay actualizaciones pendientes
             */
            // this.checkNewVersion();

            this.events.subscribe("loginSuccess", async (items) => {

                this.startBluetoothTasks();

                this.menuItems = items;

                // // BORRAR UNA VEZ QUE EL MÓDULO SEA AGREGADO EN EL ADMIN
                // this.menuItems.push({
                //     icon: 'close',
                //     page: TaskManagerPage,
                //     title: 'Task Manager',
                //     customIcon: null,
                //     url_prefix: ''
                // });


                this.thisSession = await this.getInternalSession();

                try {
                    const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

                    if (auxSetting && auxSetting.params) {
                        this.checklistSetting = { value: JSON.parse(auxSetting.params).version, }
                    } else { this.checklistSetting = null }
                } catch (e) { }

                let pass_setting = await this.util.getSettingByName('core_clave_estatica');

                if (pass_setting) this.showPass = false;
                else this.showPass = true;

                this.setMenuData();
            });

            // Si falla una actualización este evento seteara los valores del menú
            this.events.subscribe('FailedUpdate', () => {
                this.setMenuData();
                this.setRootPage(false, true, false);
            });

            // Si falla una actualización este evento seteara los valores del menú
            this.events.subscribe('show-custom-toast', (params) => {
                this.showCustomToast(params);
            });

            this.thisSession = await this.getInternalSession();



            // let diccionario = await this.dictionary.getDictionary();

            // this.premios = diccionario['Premios']
            // console.log( 'ACAA', this.premios );

            /*// Cada vez que la app, vuelve de background, verificamos si tenemos una actualización disponible
            this.platform.resume.subscribe(async () => {
                let all_permissions_granted: any = await this.util.checkPermissions();

                if (!globalConfig.isBrowser) {
                    this.checkForUpdate(false);
                }
            });*/

            // Si un request tiene status code 403 o 401, este método cerrara la sesión
            this.events.subscribe('expired_session', () => {
                if (this.nav.getActive().name !== 'LoginPage') {
                    this.util.showAlert('Alerta', 'Sesión caducada.');

                    this.session.removeSession();
                    this.storage.clear();
                    this.nav.setRoot(LoginPage);
                }
            });

            // Evento que escucha cuando se aceptan las nuevas solicitudes de permisos
            this.events.subscribe('permissions_granted', () => {
                this.setRootPage(true, false, false);
            });

            this.events.subscribe('close-menu-checkout-alert', () => {
                this.dismissCheckoutAlert();
            });

            // Evento que escucha cuando se aceptan las nuevas solicitudes de permisos
            this.events.subscribe('show-update-button', () => {
                this.optionalUpdateAvailable = true;
            });

            this.events.subscribe('navigate-from-notification-to-chat', (params) => {
                if (this.nav.getActive().instance instanceof ChatPage) {
                    this.events.publish('open-room-from-notification', params);
                    return;
                } else if (this.nav.getActive().instance instanceof RoomComponent) {
                    if (RoomComponent.currentRoomId === params.roomId) {
                        return;
                    }
                    params.popToRoot = true;
                    this.events.publish('open-room-from-notification', params);
                    return;
                }
                this.nav.setRoot(ChatPage, { roomId: params.roomId });
            });

            this.events.subscribe('navigate-from-notification', (data: any) => {
                if (data.module === 'checklist' && data.id) {
                    this.nav.push('FinalizadasDetallePage', {
                        checklist_id: data.id,
                        sucursal_id: null,
                        visita_id: null,
                        action_id: null,
                        from: 'Finalizadas',
                        markAsRead: true
                    });
                }
            });

            this.events.subscribe('TERMS_FINISHED', () => {
                this.setRootPage(false, false, false);
            });

            this.nav.viewDidEnter.subscribe((data) => { });

            this.platform.pause.subscribe(() => {

                const session: ISession = SessionProvider.state.value;

                if (session && session.token) {
                    this.request.patchAWS('/sitio/sessions/downtime', { isActive: false });
                }


                MenuComponent.isBackground = true;
                this.events.publish('app-paused');
            });

            this.platform.resume.subscribe(() => {

                const session: ISession = SessionProvider.state.value;

                if (session && session.token) {
                    this.request.patchAWS('/sitio/sessions/downtime', { isActive: true });
                }

                if (SessionProvider.state.value.sessionId) {
                    this.startBluetoothTasks();
                }

                MenuComponent.isBackground = false;
                this.events.publish('app-resumed');

                const views = this.nav.getViews();

                if (views.length && !MapVisitPage.isAlertActive && !(views[0].instance instanceof MapVisitPage)) {
                    if (this.forceCheckout) this.checkStoreStatus();
                }
            });

            if (this.forceCheckout) this.checkStoreStatus();


            // Evento click para la notificacion agendada
            this.localNotifications.on('click').subscribe((params: any) => {
                // borrar
                console.log('subscribeToScheduledNotifications', params);
                let module = _.find(this.menuItems, { customIcon: 'icon-checklist' });

                if (module) {
                    UtilProvider.actualModule = module.title;
                }
                this.nav.push(AmbitoPage, { checklist_id: params.id });
            });



            // veo los eventos de notificaciones locales en cola
            this.localNotifications.fireQueuedEvents().then(res => {
                console.log('events encolados', res);
            })
                .catch((er) => console.log('er', er));


            this.registerBluetoothListener();

            /**
             * Cuando inicia la app, esperamos a que se defina la sesión actual
             * si tenemos sesión, iniciamos las tareas del bluetooth
             */
            while (!SessionProvider.isSessionInitialized.value) {
                await this.util.awaitMs(500);
            }

            if (SessionProvider.state.value.sessionId) {
                this.startBluetoothTasks();
            }
        });
    }

    async checkStoreStatus() {
        await this.request
            .get('/relojcontrol/getcheck', true)
            .then(async (response: any) => {
                // Si se cumplen estas condiciones quiere decir que hay un checkin activo
                if (
                    response
                    && response.data
                    && response.data[0]
                    && response.data[0].check_out
                    && response.data[0].sucursal
                    && response.data[0].sucursal.id
                ) {
                    const position = await this.util.getPosition();
                    if (position && position.accuracy < 100) {
                        let distance = this.util.getDistance(position, { latitude: response.data[0].sucursal.latitud, longitude: response.data[0].sucursal.longitud });

                        /* distance = (this.acceptedDistance + 50); */

                        const level = {
                            close: (this.acceptedDistance + 50),
                            halfFar: (this.acceptedDistance + 150),
                            far: (this.acceptedDistance + 300)
                        };

                        if (distance < level.close) return;

                        if (this.checkoutAlert) {
                            try { this.checkoutAlert.dismiss() } catch (e) { }
                        }

                        const views = this.nav.getViews();

                        if (views.length && !MapVisitPage.isAlertActive && !(views[0].instance instanceof MapVisitPage)) {
                            this.checkoutAlert = this.alert.create({
                                title: 'Atención',
                                subTitle: null,
                                buttons: []
                            });

                            if (distance >= level.close && distance < level.halfFar) {
                                this.checkoutAlert.setSubTitle(`Hemos detectado que está fuera del rango de la sucursal en la que tiene un checkin. ¿Desea hacer checkout de la sucursal ${response.data[0].sucursal.nombre}?`);
                                this.checkoutAlert.addButton({
                                    text: 'Cancelar',
                                    handler: () => { }
                                });
                                this.checkoutAlert.addButton({
                                    text: 'Checkout',
                                    handler: () => {
                                        this.doCheckOut(response.data[0].control_checkin_id, position, 1);
                                    }
                                });
                                this.checkoutAlert.present();

                            } else if (distance >= level.halfFar && distance < level.far) {
                                this.checkoutAlert.setSubTitle(`Hemos detectado que te sigues alejando de la sucursal ${response.data[0].sucursal.nombre}. Si te sigues alejando realizaremos el checkout de manera automática. ¿Deseas hacer checkout ahora?`);
                                this.checkoutAlert.addButton({
                                    text: 'Cancelar',
                                    handler: () => { }
                                });
                                this.checkoutAlert.addButton({
                                    text: 'Checkout',
                                    handler: () => {
                                        this.doCheckOut(response.data[0].control_checkin_id, position, 2);
                                    }
                                });
                                this.checkoutAlert.present();
                            } else if (distance >= level.far) {
                                this.doCheckOut(response.data[0].control_checkin_id, position, 3);
                                this.checkoutAlert.setSubTitle(`Hemos hecho el checkout de manera automática por lejanía de la sucursal ${response.data[0].sucursal.nombre}.`);
                                this.checkoutAlert.addButton({
                                    text: 'Aceptar'
                                });
                                this.checkoutAlert.present();
                            }

                        }
                    }
                }
            });
    }

    dismissCheckoutAlert() {
        if (this.checkoutAlert) {
            try {
                this.checkoutAlert.dismiss();
            } catch (error) { }
        }
    }

    async doCheckOut(control_checkin_id: any, position: any, level?: number) {
        const body: any = {
            control_checkin_id: control_checkin_id,
            latitud_final: position.latitude,
            longitud_final: position.longitude,
            intento: 1
        };

        if (level) body.nivel = level;

        const loading = this.loading.create({ content: 'Registrando checkout.' });
        loading.present();

        try {

            let count: number = 1;
            let timeout: number = 5000;
            let success: boolean = false;

            // Intentamos hasta 4 veces hacer checkout
            while (count < 5) {

                const content = `Registrando checkout. Intento ${count} de 4.`;
                loading.setContent(content);

                body.intento = count;

                // Recibimos el estado del checkout
                let checkoutSuccess = await this.tryCheckOut(body, timeout);

                // Si el checkout es exitoso, limpiamos el checkin actual y actualizamos la información
                if (checkoutSuccess) {
                    loading.dismiss();
                    this.util.showToast('Checkout registrado con éxito.', 3000);
                    success = true;
                    break;
                }

                // Si el intento actual no es exitoso, aumentamos el timeout y pasamos al siguiente intento
                timeout += 5000;
                count++;
            }

            // Si fallan todos los intentos, informamos al usuario
            if (!success) {
                this.util.showAlert('Atención', 'No ha sido posible registrar el checkout, por favor intente nuevamente accediendo al módulo.');
                loading.dismiss();
            }
        } catch (e) {
            loading.dismiss();
            this.util.logError(e, 'checkout', globalConfig.version);
            this.util.showAlert('Atención', 'No ha sido posible registrar el checkout, por favor intente nuevamente accediendo al módulo.');
        }
    }

    // Envía un intento de checkout a la API
    async tryCheckOut(body: any, timeout: number) {
        let success: boolean = false;
        await this.request
            .postWithTimeout('/relojcontrol/checkout', body, true, timeout)
            .then((response: any) => {
                // Si el mensaje es de éxito, limpiamos el checkin y sucursal selccionada
                if (
                    response.message === 'Se guardo la hora de salida con éxito.'
                    || response.message === 'La visita ya tiene hora de salida registrada.'
                ) {
                    success = true;
                } else {
                    try { this.util.logError(JSON.stringify(response), null, globalConfig.version); } catch (e) { }
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
            });
        return success;
    }

    navigateToMaquetas() {
        this.nav.setRoot(MaquetasPage);
    }

    // Consulta al servicio e Ionic Pro, si es que hay una actualización
    async checkForUpdate(setRoot: boolean) {
        // Consultamos si existe una actualización disponible
        const updateCheck = await this.update.isUpdate(globalConfig.isTest, globalConfig.testBuild, globalConfig.isBrowser);
        const all_permissions_granted: any = await this.util.checkPermissions();

        // Si debemos verificar la actualización en la API
        if (global.checkUpdate) {
            // Si la actualización existe y la versión disponible es mayor a la que tenemos, procedemos
            if (updateCheck.available && this.update.compareVersions(updateCheck.version, globalConfig.version)) {
                // Y si es obligatoria, tenemos los permisos otorgados y no estamos actualizando, iniciamos la app en la vista de update
                if (updateCheck.required) {
                    if (all_permissions_granted && !UpdateComponent.updating) {
                        if (setRoot) this.rootPage = UpdateComponent;
                        else this.nav.setRoot(UpdateComponent);
                        return;
                    }
                } else {
                    // Si no, mostramos el botón en el menú, que permite actualizar manualmente
                    this.optionalUpdateAvailable = true;
                }
            }
        } else { // Si no es necesario verificar en la API
            // Si la actualización existe, consideramos que es obligatoria y procedemos
            if (updateCheck.available) {
                // Si tenemos todos los permisos otorgados y no estamos actualizando, actualizamos la APP
                if (all_permissions_granted && !UpdateComponent.updating) {
                    if (setRoot) this.rootPage = UpdateComponent;
                    else this.nav.setRoot(UpdateComponent);
                    return;
                }
            }
        }
    }

    /**
     * Verifica si hay una sesión guardada, entonces envía al login o a las vistas de la app
     */
    async setRootPage(from_permissions: boolean, from_update: boolean, from_load: boolean) {

        try {
            let updatesActivated: boolean = await this.update.areUpdatesEnabled(globalConfig.testBuild);

            if (updatesActivated) {
                // Antes de setear la página inicial, verificamos que la aplicación tenga los permisos obligatorios
                let all_permissions_granted: any = await this.util.checkPermissions();

                if (!all_permissions_granted) {
                    this.rootPage = PermissionRequestComponent;
                    // Si se rechazó algún permiso, lo volvemos a solicitar
                    if (from_permissions) this.events.publish('permissions_required');
                    return;
                }
            }
        } catch (e) { }

        // Si no estamos en el navegador y no venimos desde UpdateComponent
        /*if (!globalConfig.isBrowser && !from_update) {
            this.checkForUpdate(true);
        }*/

        // Obtenemos la sesión del usuario
        this.session
            .getSession()
            .then(async (response: any) => {
                // Si no tenemos sesión, iniciamos en el login
                if (!response) {
                    this.rootPage = LoginPage;
                    return;
                }

                await this.session.initializeState();

                const session: ISession = SessionProvider.state.value;

                const pendingItemTemrs: boolean = this.isPendingTermsItem(session.terms);

                if (pendingItemTemrs) {
                    this.rootPage = TermsComponent;
                    return;
                }

                console.log('6')

                try {
                    const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

                    if (auxSetting && auxSetting.params) {
                        this.checklistSetting = { value: JSON.parse(auxSetting.params).version, }
                    } else { this.checklistSetting = null }
                } catch (e) { }

                // Si hay sesión, verficamos si el usuario tiene chat y si está correctamente configurado
                this.mesiboProvider.checkChatModuleStatus(response, globalConfig.version);

                if (from_load) this.pushNotification.init(false).then(() => { });

                // Si el usuario es de tipo admin, iniciamos en incidencias (admin)
                if (response.usuario.tipo === 'administrador') {
                    this.rootPage = IncidentsAdminPage;
                    this.updateSessionData(response);
                    return;
                } else if (!_.isUndefined(response.usuario.jerarquia) && !_.isNull(response.usuario.jerarquia)) { // Si existe la jerarquía
                    // Si la jerarquía del usuario es 98 o mayor, inciamos en el index (INICIO PARA CARGOS ZONALES Y DE PAÍS)
                    if (response.usuario.jerarquia >= 98) {
                        if (!this.rootPage) this.rootPage = IndexPage;
                        else this.nav.setRoot(IndexPage, { from_update: from_update });
                    } else { // Si la jerarquía es menor a 98 (TIENDAS)
                        // Si el cliente es OPERA APP (corona)
                        if (global.title === 'OPERA APP') {
                            // Iniciamos en su Inicio personalizado
                            if (!this.rootPage) this.rootPage = IndexOperaappPage;
                            else this.nav.setRoot(IndexOperaappPage, { from_update: from_update });
                        } else {
                            // Si es cualquier otro cliente, iniciamos en el dashboard
                            if (!this.rootPage) this.rootPage = DashboardPage;
                            else this.nav.setRoot(DashboardPage, { from_update: from_update });
                        }
                    }
                } else { // Si no tiene jerarquía iniciamos en el dashboard (TIENDAS)
                    if (!this.rootPage) this.rootPage = DashboardPage;
                    else this.nav.setRoot(DashboardPage, { from_update: from_update });
                }
                // Actualizamos la información de la sesión
                this.updateSessionData(response);
            })
            .catch(() => {
                console.log('0')
                if (!this.rootPage) this.rootPage = LoginPage;
                else this.nav.setRoot(LoginPage);
            });
    }

    // Envía la información del dispositivo y versión de la app, para que sea actualizada
    updateSessionData(session: any) {
        // Si tenemos la sesión y el usuario asociado
        if (session && session.usuario) {
            // Creamos un objeto con la info de la app
            let body = {
                appVersion: globalConfig.version,
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
                session_id: session.sessionid
            };

            // Enviamos el request
            this.request
                .post('/usuarios/updateSession', body, true)
                .then((response: any) => { })
                .catch((error: any) => {
                    try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                });
        }
    }


    /**
     * Navega hasta la página que entra por parámetro (Se llama desde el menú)
     * @param page: Vista seleccionada
     */
    async navigateTo(item: any) {

        // console.log(item)


        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (item.title == "Tareas I/E") {
            UtilProvider.actualModule = item.title;
            this.nav.setRoot(VisualPage, { isTask: true });
            return;
        }

        if (item.title === 'LEAN_CORONA') {
            this.nav.setRoot(LeanPage);
            return;
        }

        if (item.title === 'LEAN') {
            let mod = _.find(this.menuItems, { page: ChecklistTiendaPage });

            if (!_.isUndefined(mod) && !_.isNull(mod)) UtilProvider.actualModule = mod.title;
            this.nav.setRoot(ChecklistTiendaPage, {
                ambitos: true
            });
            return;
            //this.nav.setRoot(item.page);
        }

        //TODO: solo para pruebas, borrar
        if (item == 'tareas') {
            UtilProvider.actualModule = item.title;
            this.nav.setRoot(TasksBranchOfficePage);
            return;
        }

        let session = await this.session.getSession();
        var tipoComunicados = session['usuario'].tipo_comunicado;

        if (item.page) {
            UtilProvider.actualModule = item.title;

            if (item.title === 'Inicio' && global.title === 'OPERA APP' && (!this.hierarchy || this.hierarchy < 98)) {
                this.nav.setRoot(IndexOperaappPage);
                return;
            } else if (item.title === 'Promociones Clientes') {
                let tipo = _.find(tipoComunicados, {
                    'tipo': 'com_tipo_comunicados'
                });
                this.nav.setRoot(ComunicadosTiendaPage, {
                    tipo_id: tipo.id
                });
            } else if (item.title === 'Premios') {
                let tipo = _.find(tipoComunicados, {
                    'tipo': 'com_tipo_premio'
                });

                this.nav.setRoot(ComunicadosTiendaPage, {
                    tipo_id: tipo.id
                });
            } else if (item.url_prefix === 'checklist') {

                if (!this.checklistSetting) {
                    if (SessionProvider.state.value.hierarchy > 97) {
                        this.nav.setRoot(ChecklistZonalPage);
                        return;
                    }
                    this.nav.setRoot(ChecklistTiendaPage);
                    return;
                }

                const value: any = this.checklistSetting.value;

                if (value === 2) {
                    if (SessionProvider.state.value.hierarchy > 97) {
                        this.nav.setRoot('ChecklistsZonalPage');
                        return;
                    }
                    this.nav.setRoot('ChecklistsBranchOfficePage');
                    return;
                }

                if (SessionProvider.state.value.hierarchy > 97) {
                    this.nav.setRoot(ChecklistZonalPage);
                    return;
                }
                this.nav.setRoot(ChecklistTiendaPage);
                return;
            } else this.nav.setRoot(item.page);

            return;
        }
        this.util.showAlert('Alerta', 'Vista no disponible');
    }

    // Bloqueamos los botones por 1.5 segundos
    blockButtons() {
        this.locked_buttons = true;
        setTimeout(() => {
            this.locked_buttons = false;
        }, 1500);
    }

    /**
     * Cierra Sesión
     */
    async logOut() {
        let session = null;
        await this.session
            .getSession()
            .then((result: any) => {
                session = result;
            });
        this.checkVisits().then(ret => {
            if (!ret.hasPending) {
                let alert = this.alert.create({
                    title: 'Cerrar sesión',
                    message: '¿Esta seguro que desea cerrar su sesión?',
                    buttons: [
                        {
                            text: 'Cancelar',
                            role: 'cancel',
                            handler: () => {
                            }
                        },
                        {
                            text: 'Cerrar',
                            handler: () => {
                                if (session && session.sessionid && session.usuario) {
                                    let loading = this.loading.create({ content: 'Cerrando sesión' });
                                    loading.present();
                                    this.request.logout(session.sessionid, session.usuario.tipo)
                                        .then(() => {
                                            loading.dismiss();
                                            UtilProvider.menuIntent = 0;
                                            this.session.removeSession();
                                            this.storage.clear();
                                            this.nav.setRoot(LoginPage);
                                        })
                                        .catch(() => {
                                            loading.dismiss();
                                            UtilProvider.menuIntent = 0;
                                            this.session.removeSession();
                                            this.storage.clear();
                                            this.nav.setRoot(LoginPage);
                                        });
                                    return;
                                }
                                UtilProvider.menuIntent = 0;
                                this.session.removeSession();
                                this.storage.clear();
                                this.nav.setRoot(LoginPage);
                            }
                        }
                    ]
                });
                alert.present();
            } else {
                let alert = this.alert.create({
                    title: 'Cerrar sesión',
                    message: 'Tienes checklists contestados sin enviar, te recomendamos la opción "GUARDAR Y SALIR".',
                    buttons: [
                        {
                            text: 'Cancelar',
                            role: 'cancel',
                            handler: () => {
                            }
                        },
                        {
                            text: 'Guardar y salir',
                            handler: () => {
                                this.sendOfflineData(ret.visits, ret.answers)
                                this.firebaseAnalyticsProvider.trackButtonEvent("GuardarYSalir");
                            }
                        },
                        {
                            text: 'Salir sin guardar',
                            handler: () => {
                                if (session && session.sessionid && session.usuario) {
                                    let loading = this.loading.create({ content: 'Cerrando sesión' });
                                    loading.present();
                                    this.request.logout(session.sessionid, session.usuario.tipo)
                                        .then(() => {
                                            loading.dismiss();
                                            UtilProvider.menuIntent = 0;
                                            this.session.removeSession();
                                            this.storage.clear();
                                            this.nav.setRoot(LoginPage);
                                        })
                                        .catch(() => {
                                            loading.dismiss();
                                            UtilProvider.menuIntent = 0;
                                            this.session.removeSession();
                                            this.storage.clear();
                                            this.nav.setRoot(LoginPage);
                                        });
                                    return;
                                }
                                UtilProvider.menuIntent = 0;
                                this.session.removeSession();
                                this.storage.clear();
                                this.nav.setRoot(LoginPage);
                                this.firebaseAnalyticsProvider.trackButtonEvent("SalirSinGuardar");
                            }
                        }
                    ]
                });
                alert.present();
            }
        });
    }

    /**
     * Se comprueba si existen visitas pendientes en memoria asociadas al usuario actual
     * @returns {Promise<{visits: any[]; answers: any[]; hasPending: boolean}>}
     */
    async checkVisits() {
        var hasPending = false;
        var visits = [];
        var answers = [];
        if (!_.isNull(this.thisSession) && !_.isUndefined(this.thisSession) && !_.isNull(this.thisSession['usuario']) && !_.isUndefined(this.thisSession['usuario'])) {
            await this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
                if (val) {
                    var visita_tienda = JSON.parse(val);
                    visits = visita_tienda['visitas'];
                    answers = visita_tienda['respuestas'];
                    var checks = visita_tienda['checklist_visita'];
                    var sucs = visita_tienda['sucursales'];

                    _.forEach(visits, function (visita) {
                        if (visita.modified) {
                            var checklist = _.find(checks, (check) => { return check.id == visita.checklist_id });
                            var sucursal = _.find(sucs, { 'id': visita.sucursal_id });

                            if (!_.isUndefined(checklist) && !_.isNull(checklist) && !_.isUndefined(sucursal) && !_.isNull(sucursal)) {
                                hasPending = true;
                            }
                        }
                    });
                } else {
                }

                if (!hasPending) {
                    let temp = _.filter(answers, { 'modified': true });
                    if (temp && temp.length) hasPending = true;
                }
            });
        }
        var ret = {
            visits: visits,
            answers: answers,
            hasPending: hasPending
        };
        return ret;
    }

    /**
     * Envia información de visitas guardadas a servicio
     * @param visitas
     * @param respuestas
     * @returns {Promise<{}>}
     */
    async sendOfflineData(visitas, respuestas) {

        const loading = this.loading.create({ content: 'Subiendo Infomación' });
        loading.present();

        var visitasTotales = visitas;

        var arreglo_visitas = _.filter(visitasTotales, { 'modified': true });
        var arreglo_respuestas = _.filter(respuestas, { 'modified': true });

        _.forEach(arreglo_respuestas, function (resp) {
            if (!_.isNull(resp.foto) && !_.isUndefined(resp.foto)) {
                var tempPhotos = resp.foto;
                resp.foto = [];
                if (_.isArray(tempPhotos)) {
                    _.forEach(tempPhotos, function (pic) {
                        resp.foto.push(pic);
                    });
                } else {
                    resp.foto.push(tempPhotos);
                }
            }
        });
        var params = {
            data: {
                visitas_respuestas: arreglo_visitas,
                respuestas: arreglo_respuestas
            }
        };
        let data = {};
        await this.request
            .post(config.endpoints.post.refresh, params, false)
            .then((response: any) => {
                try {
                    if (response.status == true) {
                        UtilProvider.menuIntent = 0;
                        this.session.removeSession();
                        this.storage.clear();
                        this.nav.setRoot(LoginPage);
                    }
                    loading.dismiss();
                }
                catch (e) {
                    this.util.showAlert("Alerta", "Ocurrió un problema, por favor intente de nuevo más tarde");
                    loading.dismiss();
                }

            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                loading.dismiss();
                this.util.showAlert("Alerta", "Ocurrió un problema, por favor intente de nuevo más tarde");
            });
        return data;
    }

    /**
     * Al abrir el menú, se valida que el contenido esté correctamente asignado
     * (permisos y datos)
     */
    menuOpened() {
    }

    /**
     * Cierra menú
     */
    menuClosed() {

    }

    /**
     * Retorna los módulos y cargo del usuario y asigna el cargo correspondiente
     * @returns {Promise<{modules: any[]; charge: null}>}
     */
    async getModulesAndHierarchy() {
        let result = { modules: [], charge: null };
        await this.session
            .getSession()
            .then((response: any) => {
                try {
                    let charge = null;
                    // Si es admin asignamos el cargo directamente
                    if (response.usuario.tipo === 'administrador') charge = 'admin';
                    // Si no lo es, según la jerarquía asignamos el cargo
                    else charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'branch-office' : (response.usuario.jerarquia < 100 ? 'zonal' : 'country'));
                    result = { modules: response.usuario.modulos, charge: charge };
                } catch (e) {
                }
            })
            .catch((error: any) => {
            });

        return result;
    }

    /**
     * Busca la sesión y versión de la app y asigna la información al menú
     */
    setMenuData() {
        this.session.getSession()
            .then((response: any) => {
                this.hierarchy = response.usuario.jerarquia;
                this.userData = {
                    name: response.usuario.nombre,
                    last_name: response.usuario.apellidos,
                    charge: response.usuario.cargo_nombre,
                    type: response.usuario.tipo,
                    charge_code: response.usuario.cargo_codigo,
                    email: response.usuario.email,
                    sucursales: response.usuario.sucursales_completo,
                    imagen: response.usuario.imagen,
                    zonas: (response.usuario.zonas ? response.usuario.zonas : []),
                    charge_label: ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'sucursal' : (response.usuario.jerarquia < 100 ? 'zona' : 'pais')),
                    admin: response.usuario.admin ? response.usuario.admin : false
                };
                this.applicationRef.tick();

                const acceptedDistance = _.find(response.usuario.settings, (setting: any) => {
                    return setting.nombre === 'control_perimetro_chkin';
                });

                // Buscamos el setting de visita
                const checkstore = _.find(response.usuario.settings, (setting: any) => {
                    return setting.nombre === 'visita_tipo_checkstore';
                });

                if (acceptedDistance && (acceptedDistance.value >= 0)) {
                    this.acceptedDistance = acceptedDistance.value;
                }

                if (checkstore && checkstore.params) {
                    let params = JSON.parse(checkstore.params);
                    this.forceCheckout = (params.force_checkout === false ? false : true);
                }
            });
        /*if (!globalConfig.isBrowser) {
            this.appVersion.getVersionNumber().then(res => {
                this.versionNumber = res;
            });
        }*/
    }

    // Navega hasta la vista para cambiar la contraseña
    changePassword() {
        this.nav.setRoot(ChangePasswordPage);
    }

    // Actualiza datos que cambien asociados al usuario
    gotoRefresh() {
        const loading = this.loading.create({ content: "Actualizando sesión..." });
        loading.present();

        this.request.get('/usuarios/respuestaLogin', true).then((response: any) => {
            if (response.sessionid) {

                this.session.saveSession(response).then((res: any) => {
                    this.util.showToast('Sesión actualizada con éxito.', 3000);
                    loading.dismiss();

                    this.loadMenu.setMenuItems().then(items => {
                        UtilProvider.menuIntent++;
                        this.menuItems = items;
                    });

                    this.setMenuData();
                    this.setRootPage(false, false, false);

                    this.events.publish('sessionRefresh')
                }).catch((err: any) => {
                    loading.dismiss();
                    this.util.showToast('No se pudo actualizar la sesión. Intente nuevamente.', 3000);
                });
                return;
            }
            this.util.showToast('No se pudo sicronizar la sesión. Intente nuevamente', 3000);
        }).catch((err: any) => {
            loading.dismiss();
            this.util.showToast('No se pudo sincronizar la sesión. Intente nuevamente. ', 3000);
        });
    }

    async getInternalSession() {
        let result = {};
        try {
            await this.session.getSession().then(session => {
                result = session;
            });
            return result;
        } catch (e) {
            return result;
        }
    }

    // Presenta una alerta la cual si se confirma, navega hasta la vista de actualización.
    navigateToUpdateApp() {
        const alert = this.alert.create({
            title: 'Actualización disponible',
            message: 'Antes de actualizar, le recomendamos que termine todos sus procesos. ¿Desea actualizar ahora?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    handler: () => { }
                },
                {
                    text: 'Actualizar',
                    handler: () => {
                        this.nav.setRoot(UpdateComponent);
                    }
                }
            ]
        });
        alert.present();
    }

    navigateToChat() {
        this.nav.setRoot(ChatPage);
    }

    showCustomToast(params) {
        CustomToast.title = params.title;
        CustomToast.text = params.text;
        CustomToast.image = params.image;
        CustomToast.params = params.params;

        if (CustomToast.component) {
            CustomToast.component.destroy();
        }

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(CustomToast);
        const component = this.container.createComponent(componentFactory);

        CustomToast.component = component;

        setTimeout(() => {
            if (component) component.destroy();
        }, 4000);
    }

    /**
       * Cada vez que cambia el estado del bluetooth
       * reiniciamos las tareas de encuentro por cercanía si el estado es ON
       * si no las detenemos
       */
    registerBluetoothListener() {
        this.diagnostic.registerBluetoothStateChangeHandler(async (state: any) => {
            if (state === this.diagnostic.bluetoothState.POWERED_ON) {
                if (SessionProvider.isSessionInitialized.value) {
                    if (SessionProvider.state.value.sessionId) {
                        this.startBluetoothTasks();
                        return;
                    }
                    this.stopBluetoothTasks();
                }
            } else if (state === this.diagnostic.bluetoothState.POWERED_OFF) {
                this.stopBluetoothTasks();
            }
        });
    }

    async startBluetoothTasks() {
        await this.bluetoothService.stopCentral();
        await this.bluetoothService.stopPeripheral();
        await this.util.awaitMs(2000);
        await this.bluetoothService.startCentral();
        await this.bluetoothService.startPeripheral();
    }

    async stopBluetoothTasks() {
        await this.bluetoothService.stopCentral();
        await this.bluetoothService.stopPeripheral();
    }

    presentBluetoothAlert() {
        this.diagnostic.getBluetoothState()
            .then(async (state) => {
                let message: string = null;

                const alert = this.alert.create({
                    title: 'Atención'
                });

                if (state === this.diagnostic.bluetoothState.UNAUTHORIZED) {
                    message = 'Al parecer haz denegado el uso del Bluetooth. Otorga el permiso para una experiencia completa.'
                    alert.setMessage(message);
                    alert.addButton({
                        text: 'Ver permisos',
                        handler: () => {
                            this.openNativeSettings.open('application_details');
                        }
                    });
                } else if (state === this.diagnostic.bluetoothState.POWERED_OFF) {
                    message = 'Al parecer tu Bluetooth está apagado. Enciéndelo para experiencia completa.';
                    alert.setMessage(message);
                    alert.addButton({
                        text: 'Aceptar',
                        handler: () => { }
                    });
                }
                if (message) {
                    alert.present();
                }
            });
    }
    isPendingTermsItem(items: Item[]): boolean {
        return _.find(items, (item: Item) => !item.accepted && item.required) ? true : false;
    }
}
