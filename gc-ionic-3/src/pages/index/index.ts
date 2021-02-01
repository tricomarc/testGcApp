import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams, Platform, Events, Content, PopoverController } from 'ionic-angular';
import { SessionProvider } from "../../shared/providers/session/session";
import { UtilProvider } from "../../shared/providers/util/util";
import * as _ from 'lodash';
import { EstadisticasPage } from "../dashboard/zonal/estadisticas";
import { ComunicadosTiendaPage } from "../comunicados/tienda/comunicados-tienda";
import { ChangePasswordPage } from "../change-password/change-password";
import { DashboardPage } from "../dashboard/tienda/dashboard";
// import {VisualPage} from "../visual/visual";
import { config } from "../../components/menu/menu.config";
import { ChecklistTiendaPage } from "../checklist/tienda/checklist-tienda";
import { globalConfig } from "../../config";
import { global } from "../../shared/config/global";

import { UpdateComponent } from '../../components/update/update';
import { MenuComponent } from '../../components/menu/menu';
import { PopoverNotificationsComponent } from '../../components/popover-notifications/popover-notifications';
import { RequestProvider } from '../../shared/providers/request/request';
import { indexConfig } from './index.config';
import { ISetting } from '../../shared/interfaces/setting.interface';
import { CameraProvider } from '../../shared/providers/camera/camera';
import { DictionaryProvider } from '../../shared/providers/dictionary/dictionary';

@IonicPage()
@Component({
    selector: 'page-index',
    templateUrl: 'index.html',
})
export class IndexPage {

    @ViewChild(Content) content: Content;

    private modulosActivos: any = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private locked_buttons: boolean = false;

    private checklistSetting: any = null;

    notificationList = [];
    counterNotif = 0;
    interval: Array<any> = [];
    leidas: boolean;

    // diccionario
    private premios: string;

    constructor(
        public navCtrl: NavController,
        private loading: LoadingController,
        private session: SessionProvider,
        private menu: MenuController,
        private platform: Platform,
        private events: Events,
        private zone: NgZone,
        private request: RequestProvider,
        private popoverCtrl: PopoverController,
        private navParams: NavParams,
        private util: UtilProvider,
        private dictionary: DictionaryProvider) {

        this.menu.enable(true, "menu");
    }

    ionViewWillEnter() {
        this.startInterval();
    }

    async ionViewDidLoad() {

        try {
            const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

            if (auxSetting && auxSetting.params) {
                this.checklistSetting = { value: JSON.parse(auxSetting.params).version }

            } else { this.checklistSetting = null }
        } catch (e) { }
        // const loading = this.loading.create({ content: 'Obteniendo módulos.' });
        // loading.present();
        this.setMenuItems();
        // loading.dismiss();
        if (!this.navParams.data.from_update) {
            this.checkForUpdate();
        }

        this.platform.ready().then(() => {
            this.events.subscribe('sessionRefresh', () => {
                this.setMenuItems();
            });
        });

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.premios = dictionary['Premios']
        } );
    }

    ionViewWillLeave() {
        this.stopInterval();
    }

    ionViewWillUnload() {
        this.events.unsubscribe('sessionRefresh');
    }

    // Consulta al servicio e Ionic Pro, si es que hay una actualización
    async checkForUpdate() {
        // Consultamos si existe una actualización disponible
        let updateCheck = await this.util.checkForUpdate(globalConfig.version, globalConfig.isTest, globalConfig.testBuild, globalConfig.isBrowser);

        console.log('updateCheck', JSON.stringify(updateCheck));
      
        if (updateCheck.available && !UpdateComponent.updating) {
            if (updateCheck.required) {
                this.navCtrl.setRoot(UpdateComponent);
            } else {
                this.events.publish('show-update-button');
            }
        }
    }

    // take(){
    //     this.camera.getPhoto({quality: 70}, false, '1.2').then((r) => {
    //         console.log(r);
    //     })
    // }


    /**
    * Redirige a modulo seleccionado
    * @param page
    */
    async redirectTo(module) {
        console.log( 'modulo', module )
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (module.page) {
            UtilProvider.actualModule = module.title;
            let session = await this.session.getSession();
            var tipoComunicados = session['usuario'].tipo_comunicado;

            if (module.title === 'Promociones Clientes') {
                let tipo = _.find(tipoComunicados, {
                    'tipo': 'com_tipo_comunicados'
                });
                this.navCtrl.setRoot(ComunicadosTiendaPage, {
                    tipo_id: tipo.id
                });
            } else if (module.title === 'Premios') {
                let tipo = _.find(tipoComunicados, {
                    'tipo': 'com_tipo_premio'
                });
                this.navCtrl.setRoot(ComunicadosTiendaPage, {
                    tipo_id: tipo.id
                });
            } else if (module.code === 'checklist') {
                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                if (!this.checklistSetting) {
                    this.navCtrl.setRoot(module.page);
                    return;
                }

                const value: any = this.checklistSetting.value;

                if (value === 2) {
                    this.navCtrl.setRoot('ChecklistsZonalPage');
                    return;
                }
                this.navCtrl.setRoot(module.page);
            } else this.navCtrl.setRoot(module.page);

            return;
        }
        this.util.showAlert('Atención', 'Vista no disponible');
    }

    // Retorna los módulos y cargo del usuario
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
                } catch (e) { }
            })
            .catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });

        return result;
    }

    // Asigna los ítems para mostrar en el menú
    async setMenuItems() {
        let result = await this.getModulesAndHierarchy();
        let activeModules = [];

        console.log('result', result)


        _.forEach(result.modules, (mod: any) => {
            try {
                // Buscamos la página a partir del nombre del módulo
                let item = _.find(globalConfig.modules, (aux) => {
                    if (mod.url_prefix.toLowerCase() === 'kpi') {
                        return (_.includes(aux.names, mod.url_prefix) && _.includes(aux.charges, result.charge) && _.includes(aux.companies, global.title.toLowerCase()));
                    }
                    return (_.includes(aux.names, mod.url_prefix) && _.includes(aux.charges, result.charge));
                });

                //if (item && item.page && mod.url_prefix != 'Inicio') activeModules.push({ title: mod.url_prefix, icon: mod.icon, page: item.page });
                if (mod.url_prefix != 'inicio') {
                    if (!_.isNull(item) && !_.isUndefined(item) && !_.isNull(item.page) && !_.isUndefined(item.page) && mod.home === '1') activeModules.push({
                        title: mod.nombre,
                        image: ((global.title === 'OPERA APP' && item.customImage) ? item.customImage : mod.imagen),
                        page: item.page,
                        code: mod.url_prefix
                    });

                }
            } catch (e) { }
        });
        this.zone.run(() => {
            this.modulosActivos = activeModules;
            console.log('this.modulosActivos', this.modulosActivos);
            this.content.resize();
        });
    }

    // Bloqueamos los botones por 1.5 segundos
    blockButtons() {
        this.locked_buttons = true;
        setTimeout(() => {
            this.locked_buttons = false;
        }, 1500);
    }

    disabledModuleMessage(name: string) {
        this.util.showAlert(name, 'Solicítalo a contacto@andain.cl');
    }


    /**
    * Inicia el cron para revisar notificaciones
    */
    startInterval() {
        this.getAllNotifications();
        var set = setInterval(async () => {
            await this.getAllNotifications();
        }, 20000);
        this.interval.push(set);
    }

    /**
     * Detiene el cron
     */
    stopInterval() {
        for (let item of this.interval) {
            clearInterval(item);
        }
    }

    notificacionesNoLeidas(notificaciones, totalNotif) {
        var result = 0;
        for (let i of notificaciones) {
            if (i._matchingData.NotificacionUsuario.leida == true) {
                result += 1;
            }
        }
        return result == totalNotif ? true : false;
    }


    /**
     * Obtiene todas las notificaciones del usuario
     */
    getAllNotifications() {
        this.leidas = false;
        this.request
            .get(indexConfig.endpoints.get.notificaciones, true)
            .then((notificaciones) => {
                // console.log(notificaciones);
                if (notificaciones['data']) {
                    this.notificationList = notificaciones['data']['notificaciones'];
                    this.counterNotif = notificaciones['data']['totalNotificaciones'];

                    if (!!this.notificacionesNoLeidas(this.notificationList, this.counterNotif)) {
                        this.leidas = true;
                    }
                }
            })
            .catch(e => {
                try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { }
                console.log(e)
            });
    }


    /**
   * Cambia el estado de las notificaciones
   * a "notificadas"
   */
    cambiarEstadoNotificaciones() {
        this.request
            .get(indexConfig.endpoints.get.cambiarEstado, true)
            .then((response) => { })
            .catch((e) => { try { this.util.logError(JSON.stringify(e), null, globalConfig.version); } catch (e) { } })
    }

    /**
     * Despliega ventana popover con notificaciones
     * @param PopEvent Event popover
     */
    presentPopover(PopEvent) {
        this.cambiarEstadoNotificaciones();
        let popover = this.popoverCtrl.create(PopoverNotificationsComponent,
            { params: this.notificationList, leidas: this.leidas });
        popover.present({
            ev: PopEvent
        });
    }

}
