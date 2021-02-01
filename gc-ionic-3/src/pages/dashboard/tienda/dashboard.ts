import { ApplicationRef, Component } from '@angular/core';
import { IonicPage, LoadingController, MenuController, PopoverController, NavController, Events, NavParams } from 'ionic-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import { config } from './dashboard.config'
import * as _ from 'lodash';
import { UtilProvider } from "../../../shared/providers/util/util";
import { RequestProvider } from "../../../shared/providers/request/request";
import { SessionProvider } from "../../../shared/providers/session/session";
import { ComunicadosTiendaPage } from "../../comunicados/tienda/comunicados-tienda";
import { ChecklistTiendaPage } from "../../checklist/tienda/checklist-tienda";
import { AmbitoPage } from "../../checklist/sub-pages/ambito/ambito";
import { VisualReportPage } from "../../visual/branch-office/visual-report/visual-report";
import { DetailsModalPage } from "../../comunicados/details-modal/details-modal";
import { DetallePage } from "../../checklist/sub-pages/detalle/detalle";
import { TasksBranchOfficePage } from "../../tasks/branch-office/tasks-branch-office";
import { DetailIncidentPage } from "../../incidents/branch-office/sub-pages/detail-incident/detail-incident";
import { global } from "../../../shared/config/global";
import { LoadMenuProvider } from "../../../shared/providers/util/loadMenu";
import { ItemInterface } from "../../../components/menu/menu";
import { MaterialDetailPage } from "../../materials/material-detail/material-detail";

import { AmbitsComponent } from '../../checklists/components/ambits/ambits';

import { FilesPage } from '../../files/files';
import { IncidentsBranchOfficePage } from '../../incidents/branch-office/incidents-branch-office';

import { UpdateComponent } from '../../../components/update/update';

import { globalConfig } from '../../../config';
import { FinalizadasDetallePage } from "../../checklist/sub-pages/finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";
import { PopoverNotificationsComponent } from '../../../components/popover-notifications/popover-notifications';
import { ISetting } from '../../../shared/interfaces/setting.interface';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';
import { TaskManagerPage } from '../../task-manager/task-manager';

@IonicPage()
@Component({
    selector: 'page-dashboard',
    templateUrl: 'dashboard.html'
})
export class DashboardPage {

    modules = [];
    dashboards = {};
    zonalVerificacion = null;
    notificationList = [];
    counterNotif = 0;
    leidas: boolean;
    interval: Array<any> = [];
    private menuItems: ItemInterface[] = [];

    dashboadVales = []

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private moduleName: string = null;


    private dashboard_modules: any = [];
    private cliente: string = null;
    private idModulosCliente = { premios: null, comunicados: null };
    private showTaskButton: boolean = false;

    private clientCode: string = global.pro.appId;

    private checklistSetting: any = null;
    private dashboardTasks: any = {
        tareas: [],
        estadisticas: []
    };
    constructor(
        public navCtrl: NavController,
        private loading: LoadingController,
        private request: RequestProvider,
        private session: SessionProvider,
        private applicationRef: ApplicationRef,
        private browser: InAppBrowser,
        private events: Events,
        private menu: MenuController,
        private navParams: NavParams,
        private popoverCtrl: PopoverController,
        public loadMenu: LoadMenuProvider,
        private util: UtilProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

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

   async ionViewWillEnter() {
        this.menu.enable(true, "menu");
        this.loadMenu.setMenuItems().then(items => {
            this.menuItems = items;
            UtilProvider.menuIntent++;
        });
        this.startInterval();

        if (UtilProvider.menuIntent == 0) {
            this.loadMenu.setMenuItems().then(items => {
                this.menuItems = items;
                UtilProvider.menuIntent++;
                this.getAllDashboard();

            });
        } else {
            this.getAllDashboard();
        }
    }

    async ionViewDidLoad() {
        try {
            const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

            if (auxSetting && auxSetting.params) {
                this.checklistSetting = { value: JSON.parse(auxSetting.params).version }
            } else { this.checklistSetting = null }
        } catch (e) { }

        const result = await this.loadMenu.getModulesAndHierarchy();
        const module = _.find(result.modules, { url_prefix: 'inicio' });
        if (module) {
            UtilProvider.actualModule = module.nombre;
            this.moduleName = module.nombre;
        } else this.moduleName = 'Dashboard';

        this.events.subscribe('sessionRefresh', () => {
            this.getAllDashboard()
        });

        if (!this.navParams.data.from_update) {
            this.checkForUpdate();
        }
    }

    ionViewWillUnload() {
        this.events.unsubscribe('sessionRefresh')
    }

    ionViewWillLeave() {
        this.stopInterval();
    }

    /**
     * Obtiene todas las notificaciones del usuario
     */
    getAllNotifications() {
        this.leidas = false;
        this.request
            .get(config.endpoints.get.notificaciones, true)
            .then((notificaciones) => {
                if (notificaciones['data']) {
                    this.notificationList = notificaciones['data']['notificaciones'];
                    this.counterNotif = notificaciones['data']['totalNotificaciones'];

                    if (!!this.notificacionesNoLeidas(this.notificationList, this.counterNotif)) {
                        this.leidas = true;
                    }
                }
            })
            .catch(e => {
                /* console.log(e) */
            });
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

    getComunicadosPremios(params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request.post(config.endpoints.post.estadisticas, { tipo_id: [params.premios, params.comunicados] }, true)
                .then((response) => { resolve(response) })
                .catch((error) => reject(error))
        })
    }

    getValesDashboard(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request.get(config.endpoints.get.obtenerVales, true)
                .then((response) => { resolve([response]) })
                .catch((error) => { console.log(error); reject(error) });
        })
    }


    checkTask(visuals: Array<any>) {
        if (visuals && Array.isArray(visuals)) {
            const tareas = visuals.filter((item) => { return item.tarea == 1 });
            if (tareas && tareas.length > 0) this.showTaskButton = true;
            else this.showTaskButton = false;
        }

    }

    /**
     * Trae lista de dashboard por usuario y luego ordena por módulos
     * @returns {Promise<{}>}
     */
    async getAllDashboard() {
        const loading = this.loading.create({ content: 'Obteniendo estadísticas' });
        loading.present();

        let getSession = await this.session.getSession();
        this.zonalVerificacion = getSession['usuario'].zona_id;

        let data = {};
        let dashboard_modules = [];

        this.cliente = _.includes(['cl.foco.gcapp'], global.bundle_id) ? 'com_cruzverde' : null;

        let modPremios = null;
        let modComun = null;
        let modVale = null;
        const premioSetting = getSession['usuario']['settings'].filter((p) => { return p.nombre == 'com_tipo_premio' });
        const comunicadoSetting = getSession['usuario']['settings'].filter((p) => { return p.nombre == 'com_tipo_comunicados' });
        this.idModulosCliente = { premios: premioSetting[0]['value'], comunicados: comunicadoSetting[0]['value'] }
        if (this.cliente == 'com_cruzverde') {

            const comunicadosCliente = await this.getComunicadosPremios(this.idModulosCliente)
                .catch((error) => { if (error && error.message) this.util.showToast(error.message, 3000); });

            const valesDashboard = await this.getValesDashboard()
                .catch((error) => { if (error && error.message) { this.util.showToast(error.message, 3000); }; });

            if (valesDashboard['data'] && valesDashboard['data'].length > 0) {
                let valedash = [];
                let i = 0;
                for (let item of valesDashboard['data']) {
                    if (i < 4) {
                        valedash.push(item)
                    }
                    i++;
                }
                this.dashboadVales = valedash;
            }
            modVale = valesDashboard[0]['data'];
            // const comunicadosCliente = await this.request
            //     .post(config.endpoints.post.estadisticas, {tipo_id: [this.idModulosCliente.premios, this.idModulosCliente.comunicados]}, true)
            //     .catch((error) => {if (error && error.message) this.util.showToast(error.message, 3000);});

            if (comunicadosCliente['data']) {
                modPremios = comunicadosCliente['data'][this.idModulosCliente.premios]
                modComun = comunicadosCliente['data'][this.idModulosCliente.comunicados]
            }
        }

        await this.request
            .get(config.endpoints.get.estadisticas, false)
            .then((response: any) => {
                loading.dismiss();
                try {
                    if (response.data && response.data.visual && response.data.visual.data) this.checkTask(response.data.visual.data.visuales);

                    if (global.bundle_id === 'cl.foco.gcapp') {
                        response['data']['premios'] = modPremios;
                    }

                    let modules = getSession['usuario'].modulos;
                    //this.orderDashboards(response.data)
                    // Arreglo para iterar los módulos
                    //this.orderDashboards(response.data)
                    // Arreglo para iterar los módulos
                    let dashboard_modules = [];

                    _.forEach(modules, async(module) => {

                        if (module && module.dashboard == '1') {
                            let nameVM = module.redirect; 
                            if(module.url_prefix == 'taskmanager')
                                await this.getDasboardTasks();
                            if (module.url_prefix == 'vale')
                                response['data']['vale'] = modVale;
                            nameVM = nameVM.substring(0, nameVM.indexOf("-"));
                            var responseData = response.data[nameVM];
                            if (!_.isUndefined(responseData)) {
                                responseData['redirect'] = module.redirect;
                                data[nameVM] = response.data[nameVM];
                                // Creamos un objeto con el índice (según el orden) y el módulo
                                let module_temp = {
                                    indice: module.orden
                                };
                                module_temp[nameVM] = response.data[nameVM];
                                //this.orderDashboards(module_temp[nameVM])
                                // Lo agregamos al arreglo de módulos
                                if (module_temp[Object.keys(module_temp)[1]].nombre == "") module_temp[Object.keys(module_temp)[1]].nombre = module.nombre;
                                if (module.url_prefix == 'vale') {
                                    module_temp['vale'] = modVale;
                                }
                                if (module.url_prefix == 'com') {
                                    module_temp['comunicados']['clienteComunicados'] = modComun;
                                }

                                if (module.url_prefix == 'premios' && module.menu == '1') {
                                    module_temp['premios'] = global.bundle_id === 'cl.foco.gcapp' ? modPremios : response.data.premios;
                                }

                                dashboard_modules.push(module_temp);
                            }
                        }
                    });
                    this.dashboards = data;
                    // Asignamos los módulos al atributo y lo ordenamos ascendentemente por el índice
                    this.dashboard_modules = _.orderBy(dashboard_modules, ['indice'], ['asc']);

                    console.log('dashboard modules', this.dashboard_modules);
                    this.updateDates();

                    this.applicationRef.tick();
                }
                catch (e) { }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });

        return data;
    }

    /**
    * Cambiar formato de fechas para compatibilidad de uso
    */
    updateDates() {
        _.forEach(this.dashboards, (dash) => {
            /*if (dash.nombre == "Checklist") {
                if (!_.isUndefined(dash.data) && !_.isNull(dash.data)) {
                    if (!_.isUndefined(dash.data.checklist_sin_leer) && !_.isNull(dash.data.checklist_sin_leer)) {
                        _.forEach(dash.data.checklist_sin_leer, (check) => {
                            check.fecha = new Date(check.fecha);
                            check.fecha_fin = new Date(check.fecha_fin);
                            check.vencimiento = new Date(check.vencimiento);
                        })
                    }
                }
            }*/
            /* if (dash.nombre == "Materiales") {
                if (!_.isUndefined(dash.data) && !_.isNull(dash.data)) {
                    _.forEach(dash.data, (check) => {
                        check.fecha_inicio = new Date(check.fecha_inicio);
                        check.fecha_termino = new Date(check.fecha_termino);
                    })
                }
            }*/

            if (dash.nombre == "Incidencias") {
                if (!_.isUndefined(dash.data) && !_.isNull(dash.data)) {
                    _.forEach(dash.data, (check) => {
                        var res = check.created.split("-");
                        var year = res[2].split(" ");
                        res[2] = year[0];
                        check.created = new Date(res[2], res[1] - 1, res[0]);
                        //check.created = new Date(check.created);
                    })
                }
            }
        })
    }

    reditectToPageCom(tipoComunicado) {
        this.navCtrl.setRoot('ComunicadosTiendaPage', { tipo_com: tipoComunicado })
    }

    async getDasboardTasks(){
        try {
            let to = new Date();
            let from = new Date(to.getFullYear(), to.getMonth(), 1);
            let session: any = await this.session.getSession();
            const id = session.usuario.id
            let _from = this.util.getFormatedDate(from);
            let _to   = this.util.getFormatedDate(to);
            const query = '?usuarioId=' + id + '&from=' + _from + '&to=' + _to;
            const result: any = await this.request.getMicroService('/task/dashboard'+query);

            if(result.status){ 
                this.dashboardTasks = result.data
            }

            return true;
        } catch (error) { return false; }
    }

    redirectToSegVale() {
        this.navCtrl.setRoot('SeguimientoValePage');
    }
    redirectToLocales(idPeriodo: number) {
        this.navCtrl.push('LocalesAsociadosPage', { id: idPeriodo });
    }

    /**
    * Redirecciona a la pagina enviada como parametro
    * y envia variables según sea el caso
    * @param route
    * @param value1
    * @param value2
    */
    redirect(route, value1, value2, module_name, filter_by_read, tipoCom?, isTask?) {

        if (module_name) UtilProvider.actualModule = module_name;

        if (route === 'KPI') {
            // UtilProvider.actualModule = 'KPI';
            let module = _.find(globalConfig.modules, (mod: any) => {
                return (_.includes(mod.names, 'kpi') && _.includes(mod.companies, global.title.toLowerCase()));
            });
            if (module) {
                this.navCtrl.setRoot(module.page, {});
                return;
            }
            this.util.showToast('Módulo no disponible.', 3000);
        }

        if (route === 'files') {
            this.navCtrl.setRoot(FilesPage);
            return;
        } else if (route === 'incidents') {
            this.navCtrl.setRoot(IncidentsBranchOfficePage);
            return;
        }

        if (route === 'DetailIncidentPage' && value1) {
            this.navCtrl.push(DetailIncidentPage, { incident_id: value1 });
            return;
        }

        if (_.isNull(value1) && _.isNull(value2)) {
            if (route == "ComunicadosTiendaPage") {
                this.navCtrl.setRoot(ComunicadosTiendaPage, { tipoComunicado: tipoCom ? tipoCom : null });
            }

            else if (route === 'ChecklistTiendaPage') {
                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                if (!this.checklistSetting) {
                    this.navCtrl.setRoot(ChecklistTiendaPage);
                    return;
                }

                const value: any = this.checklistSetting.value;

                if (value === 2) {
                    this.navCtrl.setRoot('ChecklistsBranchOfficePage');
                    return;
                }
                this.navCtrl.setRoot(ChecklistTiendaPage);
            } else if (route === 'AmbitosPage') {
                if (!this.checklistSetting) {
                    this.navCtrl.setRoot(ChecklistTiendaPage, {
                        ambitos: true
                    });
                    return;
                }

                const value: any = this.checklistSetting.value;

                if (value === 2) {
                    this.navCtrl.setRoot('ChecklistsBranchOfficePage', {
                        lean: true
                    });
                    return;
                }
                this.navCtrl.setRoot(ChecklistTiendaPage, {
                    ambitos: true
                });
            }

            else if (route === 'VisualPage') {
                this.navCtrl.setRoot(route, {
                    filter_by_read: filter_by_read,
                    isTask: isTask ? true : false
                });
            } else {
                this.navCtrl.setRoot(route);
            }
            return;
        }
        if (!_.isNull(value1) && _.isNull(value2)) {
            if (route == "ComunicadosTiendaPage") {
                value1["comunicado_id"] = value1["id"]
                value1["estado"] = value1["leido"]
                this.navCtrl.push('DetailsModalPage', {
                    comunicado: value1
                });
            } else if (route == "VisualReportPage") {
                this.navCtrl.setRoot(VisualReportPage, {
                    report_id: value1, fromMaterial: true
                });
            } else if (route == "TasksBranchOfficePage") {
                this.navCtrl.setRoot(DetallePage, { task_id: value1 });
            } else if (route == "MaterialsPage") {
                // UtilProvider.actualModule = module_name;
                if (value1) {
                    this.navCtrl.push(MaterialDetailPage, { material_id: value1 });
                } else {
                    this.navCtrl.setRoot(MaterialDetailPage, { material_id: null });
                }
            }
            return;
        }
        if (!_.isNull(value1) && !_.isNull(value2)) {
            if (route == "VisualPage") {
                this.navCtrl.setRoot(route, {
                    reporte_id: value1,
                    sucursal_id: value2,
                    filter_by_read: filter_by_read,
                    isTask: isTask ? true : false

                });
            }

            else if (route == "ChecklistPage") {

                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                if (!this.checklistSetting) {
                    if (value1.estado_id == 4) {
                        this.navCtrl.push(FinalizadasDetallePage, {
                            checklist_id: value1.check_id * 1,
                            sucursal_id: null,
                            visita_id: null,
                            action_id: null,
                            from: 'Finalizadas'
                        });
                    } else {
                        this.navCtrl.push(AmbitoPage, {
                            checklist_id: value1.check_id
                        });
                    }
                    return;
                }

                const value: any = this.checklistSetting.value;

                if (value === 2) {
                    this.navCtrl.push(AmbitsComponent, {
                        checklistId: value1.check_id
                    });
                    return;
                }
                if (value1.estado_id == 4) {
                    this.navCtrl.push(FinalizadasDetallePage, {
                        checklist_id: value1.check_id * 1,
                        sucursal_id: null,
                        visita_id: null,
                        action_id: null,
                        from: 'Finalizadas'
                    });
                } else {
                    this.navCtrl.push(AmbitoPage, {
                        checklist_id: value1.check_id
                    });
                }
            }
        }
    }

    redirectToTM(stats?: boolean) {
        this.navCtrl.setRoot(TaskManagerPage, { showStats: stats || false });
    }



    /**
     * Llama al servicio de descarga de archivos el cual primero lo marca como leido y
     * luego realiza un cordova.InAppBrowser.open con la ruta del archivo
     * @param void
     * @return void
     **/

    downloadFile(file: any) {
        if (!file || !file.path) return;
        let options: InAppBrowserOptions = { location: 'no', };
        let browser = this.browser.create(file.path, '_system', options);
    }

    /**
     * Actualiza checklists y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshDashboard(refresher: any) {
        await this.getAllDashboard();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }

    /**
     * Cambia el estado de las notificaciones
     * a "notificadas"
     */
    cambiarEstadoNotificaciones() {
        this.request
            .get(config.endpoints.get.cambiarEstado, true)
            .then((response) => { })
            .catch((e) => { })
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
