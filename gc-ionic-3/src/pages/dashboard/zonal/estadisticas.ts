import { ApplicationRef, Component } from '@angular/core';
import { LoadingController, MenuController, NavController, Events, NavParams, IonicPage, Platform } from 'ionic-angular';
import { config } from './estadisticas.config'
import * as _ from 'lodash';
import { UtilProvider } from "../../../shared/providers/util/util";
import { RequestProvider } from "../../../shared/providers/request/request";
import { SessionProvider } from "../../../shared/providers/session/session";
import { ChecklistDetailsPage } from "./sub-pages/checklist/checklist";
import { ComunicadosDetailsPage } from "./sub-pages/comunicados/comunicados";
import { VisualDetailsPage } from "./sub-pages/visual/visual";
import { IncidenciasDetailsPage } from "./sub-pages/incidencias/incidencias";
import { ValesDetailsPage } from "./sub-pages/vales/vales";
import { KpiDetailsPage } from "./sub-pages/kpi/kpi";
import { global } from "../../../shared/config/global";
import { ItemInterface } from "../../../components/menu/menu";
import { LoadMenuProvider } from "../../../shared/providers/util/loadMenu";

import { UpdateComponent } from '../../../components/update/update';

import { DetailsVisualSubsidiaryPage } from './sub-pages/visual/components/detalle/detalle';
import { DetailsComunicadosSubsidiaryPage } from './sub-pages/comunicados/components/detalle/detalle';
import { DetailsChecklistSubsidiaryPage } from './sub-pages/checklist/components/detalle/detalle';

import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../shared/providers/dictionary/dictionary';
import { ISetting } from '../../../shared/interfaces/setting.interface';
import * as moment from 'moment';
@IonicPage()
@Component({
    selector: 'page-estadisticas',
    templateUrl: 'estadisticas.html'
})
export class EstadisticasPage {

    /* Estadísticas V2, se va migrando por módulo */

    private filters: any = null;

    private branchOffices: any = [];
    private brachOfficesUser: any = [];
    private rawBranchOffices: any = [];
    private session: any = null;
    private showBranchOfficeFilter: boolean = false;

    private modules: any = [];

    /* Estadísticas V2, se va migrando por módulo */


    date = new Date();
    dashboards = [];
    tipoComunicado = {};
    rawSubgerencias: any[] = [];
    subgerencias: any[] = [];
    subgerenciaSucursales: any[] = [];

    rawCadenas: any[] = [];
    rawGerentes: any[] = [];
    rawZonas: any[] = [];
    cadenas: any[] = [];
    cadenaSucursales: any[] = [];

    showFilterSub: boolean = false;
    showFilterCadenas: boolean = false;
    paramsSucursales: string = "";
    expanded: boolean = false;
    activeFilter: any = {
        active: false,
        isManagerRegion: null,
        isManagerZonal: null
    }
    filter = {
        sucursal: null,
        fechaInicio: new Date(this.date.getFullYear(), this.date.getMonth(), 1),
        fechaFin: this.date,
        fechaInicioInput: new Date(this.date.getFullYear(), this.date.getMonth(), 1),
        fechaFinInput: this.date,
        subgerencias: [],
        cadenas: [],
        gerOperaciones: [],
        zonas: []
    };
    zonalVerificacion = null;
    jerarquia = null;
    ready: boolean = false;
    usuario = "";
    currentStates: any = null;


    sucursales: any[] = [];
    gerentes: any[] = [];
    zonas: any[] = [];


    private menuItems: ItemInterface[] = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private progressColor: string = '';

    // diccionarios
    isLoadingFilter: boolean = false;
    private sucursalesDicc: string;
    private premios: string;

    constructor(
        public navCtrl: NavController,
        private loading: LoadingController,
        private applicationRef: ApplicationRef,
        private menu: MenuController,
        private events: Events,
        private navParams: NavParams,
        private request: RequestProvider,
        private sessionProvider: SessionProvider,
        private util: UtilProvider,
        private platform: Platform,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

    
    async ionViewDidLoad() {
        const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'filtro_estadistica_cargos');
        if(auxSetting && auxSetting.params && auxSetting.visible){
            let _params: any = auxSetting.params;
            if(_params){
                const params: any= JSON.parse(_params) || [];
                if(params && params.filter_cargo){
                    let session: any = await this.sessionProvider.getSession();
                    const chargeId = session.usuario.cargo_id || 0;
                    const filter = params.filter_cargo.filter((cargo) => { return cargo.id == chargeId }).shift();

                    if(filter){
                        this.activeFilter = {
                            active: true,
                            isManagerRegion: filter && filter.key == 'GER_REGIONAL' ? true : false,
                            isManagerZonal:  filter && filter.key == 'GER_OPERACION' ? true : false
                        }
                    }

                }
            }
        }

        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'Estadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'Estadisticas', 'Estadisticas' );

        this.progressColor = global.client_colors.primary;
        if (!this.navParams.data.from_update) {
            this.checkForUpdate();
        }
        this.initializeStatistics();
        this.getFilters();
    }




    setFilters(){
        const session = this.sessionProvider.getSession();
        console.log(session);
    }
    
    async ionViewWillEnter() {
        this.menu.enable(true, "menu");
        this.module = "Estadísticas";
       
    }

    ionViewWillUnload(){
        this.events.unsubscribe( 'sessionRefresh')
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

    /**
     * Trae data de cada módulo asociado al usuario por separado
     */
    async loadSession(applyFilters?:any) {
        let getSession = await this.sessionProvider.getSession();
        this.tipoComunicado = getSession['usuario'].tipo_comunicado;
        var modulos = getSession['usuario'].modulos;
        var modActivo = _.filter(modulos, { dashboard: 1 });
        if (modActivo.length == 0) {
            modActivo = _.filter(modulos, { dashboard: "1" });
        }
        let fechaInicio = this.filter.fechaInicio.getFullYear() + "-" + (this.filter.fechaInicio.getMonth() + 1) + "-" + this.filter.fechaInicio.getDate();
        var fechaFin = this.filter.fechaFin.getFullYear() + "-" + (this.filter.fechaFin.getMonth() + 1) + "-" + this.filter.fechaFin.getDate();
        this.dashboards = modActivo;
        this.zonalVerificacion = getSession['usuario'].zona_id;
        this.usuario = getSession['usuario'].cargo_nombre;
        this.jerarquia = getSession['usuario'].jerarquia;

        let temp = [];
        var tipo = null;
        var params = null;

        this.dashboards.forEach((cat) => { 
            let dashboard_index = _.findIndex(this.dashboards, cat);
            if (dashboard_index !== -1) this.dashboards[dashboard_index].requesting = true;
        })

        if(applyFilters && 
            (applyFilters.cadenas || applyFilters.subgerencias || applyFilters.gerentes || applyFilters.zonas)){
            await this.getSucursales(applyFilters);
        }

        _.forEach(this.dashboards, (cat) => {

            let dashboard_index = _.findIndex(this.dashboards, cat);
            if (dashboard_index !== -1) this.dashboards[dashboard_index].requesting = true;

            temp.push(new Promise(async (resolve, reject) => {
                var data = null;
                if (cat.url_prefix === 'com') {
                    tipo = _.find(this.tipoComunicado, { 'tipo': 'com_tipo_comunicados' });
                    params = this.getQueryParams(true);
                    if (tipo) {
                        tipo = tipo.id;
                        params += ('&tipo_id=' + tipo);
                    }
                    data = this.getDashboardGet(config.endpoints.get.comunicados, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }

                }
                if (cat.url_prefix === 'premios') {
                    tipo = _.find(this.tipoComunicado, { 'tipo': 'com_tipo_premio' });
                    tipo = tipo.id;

                    params = this.getQueryParams(true);
                    params += ('&tipo_id=' + tipo);

                    data = this.getDashboardGet(config.endpoints.get.comunicados, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }

                if (cat.url_prefix === 'visual') {

                    params = this.getQueryParams(true);

                    data = await this.getDashboardGet(config.endpoints.get.visuales, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }

                if (cat.url_prefix === 'checklist') {

                    params = this.getQueryParams(true);

                    data = this.getDashboardGet(config.endpoints.get.checklist, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }
                if (cat.url_prefix === 'incidencia') {
                    if (_.isNull(this.filter.sucursal)) {
                        params = "?desde=" + fechaInicio + "&hasta=" + fechaFin + "&nivel=top";
                    } else {
                        params = "?sucursales_id=" + this.filter.sucursal.id + "&desde=" + fechaInicio + "&hasta=" + fechaFin + "&nivel=top";
                    }
                    if (!_.isNull(this.zonalVerificacion)) params = params + "&zona_id=" + this.zonalVerificacion;
                    data = this.getDashboardGet(config.endpoints.get.incidencias, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }
                if (cat.url_prefix === 'control') {
                    if (_.isNull(this.filter.sucursal)) {
                        params = "?fecha_inicio=" + fechaInicio + "&fecha_fin=" + fechaFin + "&nivel=top";
                    } else {
                        params = "?sucursales_id=" + this.filter.sucursal.id + "&fecha_inicio=" + fechaInicio + "&fecha_fin=" + fechaFin + "&nivel=top";
                    }
                    if (!_.isNull(this.zonalVerificacion)) params = params + "&zona_id=" + this.zonalVerificacion;
                    data = this.getDashboardGet(config.endpoints.get.control, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }
                /* if (cat.url_prefix === 'vale') {
                     if (_.isNull(this.filter.sucursal)) {
                         params = "?fecha_inicio=" + fechaInicio + "&fecha_fin=" + fechaFin + "&nivel=top";
                     } else {
                         params = "?sucursales_id=" + this.filter.sucursal.id + "&fecha_inicio=" + fechaInicio + "&fecha_fin=" + fechaFin + "&nivel=top";
                     }
                     if(!_.isNull(this.zonalVerificacion)) params = params + "&zona_id=" + this.zonalVerificacion;
                     data = this.getDashboardGet(config.endpoints.get.vale, params, true);
                     if (!_.isNull(data)) {
                         resolve(data);
                     } else {
                         reject();
                     }
                 }*/
                if (cat.url_prefix === 'kpi') {
                    params = "";
                    if (!_.isNull(this.zonalVerificacion)) params = params + "?tipo=zona&dataId=" + this.zonalVerificacion;
                    data = this.getDashboardGet(config.endpoints.get.kpi, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }

                /*if (cat.url_prefix === 'tarea') {
                    params = "";
                    if (_.isNull(this.filter.sucursal)) {
                        params = {fecha_inicio: fechaInicio, fecha_fin: fechaFin};
                    } else {
                        params = {
                            sucursales_id: this.filter.sucursal.id,
                            fecha_inicio: fechaInicio,
                            fecha_fin: fechaFin
                        };
                    }
                    if (!_.isNull(this.zonalVerificacion)) params = params + "?zona_id=" + this.zonalVerificacion;
                    data = this.getDashboardPost(config.endpoints.get.tareas, params, true);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                    return;
                }*/
                //TODO: no hay servicio (404 Not Found)
                /*if (cat.url_prefix === 'material' || cat.url_prefix === 'materiales') {
                    if (_.isNull(this.filter.sucursal)) {
                        params = {fecha_inicio: fechaInicio, fecha_fin: fechaFin};
                    } else {
                        params = {
                            sucursales_id: this.filter.sucursal.id,
                            fecha_inicio: fechaInicio,
                            fecha_fin: fechaFin
                        };
                    }
                    data = this.getDashboardPost(config.endpoints.post.materiales, params, false);
                    if (!_.isNull(data)) {
                        resolve(data);
                    } else {
                        reject();
                    }
                }*/
            }).then(
                (data) => {
                    var dashboardIndex = _.findIndex(this.dashboards, cat);
                    if (dashboardIndex != -1) {

                        this.dashboards[dashboardIndex].requesting = false;

                        if (!_.isNull(data) && !_.isUndefined(data)) {
                            this.dashboards[dashboardIndex].info = data;
                        } else {
                            this.dashboards[dashboardIndex].info = {};
                        }
                    }
                    this.applicationRef.tick();
                },
                (err) => {
                })
            )
        })
    }

    /**
     * Trae data desde servicio para cada módulo por separado para funciones Get
     * @param endpoint
     * @param params
     * @param isNew
     * @returns {Promise<{}>}
     */
    async getDashboardGet(endpoint, params, isNew) {
        let data = {};
        await this.request
            .get(endpoint + params, isNew)
            .then((response: any) => {
                try {
                    data = response.data;
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                console.log( 'error 1' );
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Trae data desde servicio para cada módulo por separado para funciones Post
     * @param endpoint
     * @param params
     * @param isNew
     * @returns {Promise<{}>}
     */
    async getDashboardPost(endpoint, params, isNew) {
        let data = {};
        await this.request
            .post(endpoint, params, isNew)
            .then((response: any) => {
                try {
                    data = response.data;
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                console.log( 'error 2' );
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Redirección a detalles de modulo seleccionado
     * @param route
     * @param value1
     * @param value2
     */
    redirect(route, value1, value2, value3, value4) {

        /* _.forEach(this.menuItems, (item) => {
             if(item.page.name == route){
                 UtilProvider.actualModule = item.title;
             }
         });*/

         
         
         if (route == "ChecklistDetailsPage") {
             UtilProvider.actualModule = value3;
             if (this.filters && this.filters.zonas && this.filters.zonas.id) {
                 let to = new Date();
                 let from = new Date(to.getFullYear(), to.getMonth(), 1);

                 this.navCtrl.push(ChecklistDetailsPage, {
                     nombreModulo: this.filters.zonas.nombre,
                     zona_id: this.filters.zonas.id,
                     filters: {
                         to: moment(to).format('YYYY-MM-DD'),
                         from: moment(from).format('YYYY-MM-DD'),
                         checklists: [],
                         nivel: "dual",
                         zoneId: null,
                         gerentes: null,
                         subgerencias: null
                     },
                     activeFilter: this.activeFilter
                 });
                 return;
             }

            if (this.filters && this.filters.branchOffice && this.filters.branchOffice.id) {
                this.navCtrl.push(DetailsChecklistSubsidiaryPage, {
                    desde: this.filters.from,
                    hasta: this.filters.to,
                    sucursal_id: this.filters.branchOffice.id,
                    graphics: null,
                    filters: this.filters, 
                    activeFilter: this.activeFilter
                });
                return;
            }
            this.navCtrl.push(ChecklistDetailsPage, {
                nombreModulo: value1,
                zona_id: value2,
                filters: this.filters,
                activeFilter: this.activeFilter
            });
        }
        if (route == "ComunicadosDetailsPage") {
            UtilProvider.actualModule = value3;
            if (this.filters && this.filters.zonas && this.filters.zonas.id) {
                let to = new Date();
                let from = new Date(to.getFullYear(), to.getMonth(), 1);

                this.navCtrl.push(ChecklistDetailsPage, {
                    nombreModulo: this.filters.zonas.nombre,
                    zona_id: this.filters.zonas.id,
                    tipo_id: 12,
                    filters: {
                        to: moment(to).format('YYYY-MM-DD'),
                        from: moment(from).format('YYYY-MM-DD'),
                        checklists: [],
                        nivel: "dual",
                        zoneId: null,
                        gerentes: null,
                        subgerencias: null
                    },
                    activeFilter: this.activeFilter
                });
                return;
            }

            if (this.filters && this.filters.branchOffice && this.filters.branchOffice.id) {
                this.navCtrl.push(DetailsComunicadosSubsidiaryPage, {
                    filters: {
                        from: this.filters.from,
                        to: this.filters.to,
                        nivel: 'dual',
                        typeId: 12,
                        zoneId: this.filters.branchOffice.zona_id,
                        news: []
                    },
                    sucursal_id: this.filters.branchOffice.id,
                    graphics: null,
                    activeFilter: this.activeFilter
                });
                return;
            }
            this.navCtrl.push(ComunicadosDetailsPage, {
                tipo_id: 12,
                nombreModulo: value1,
                zona_id: value2,
                filters: this.filters,
                activeFilter: this.activeFilter
            });
        }
        if (route == "PremiosDetailsPage") {
            UtilProvider.actualModule = value1;
            if (this.filters && this.filters.branchOffice && this.filters.branchOffice.id) {
                this.navCtrl.push(DetailsComunicadosSubsidiaryPage, {
                    filters: {
                        from: this.filters.from,
                        to: this.filters.to,
                        nivel: 'dual',
                        typeId: 13,
                        zoneId: this.filters.branchOffice.zona_id,
                        news: []
                    },
                    sucursal_id: this.filters.branchOffice.id,
                    graphics: null,
                    activeFilter: this.activeFilter
                });
                return;
            }
            this.navCtrl.push(ComunicadosDetailsPage, {
                tipo_id: 13,
                nombreModulo: value1,
                zona_id: value2,
                filters: this.filters,
                activeFilter: this.activeFilter
            });
        }
        if (route == "VisualDetailsPage") {
            UtilProvider.actualModule = value3;
            if (this.filters && this.filters.zonas && this.filters.zonas.id) {
                let to = new Date();
                let from = new Date(to.getFullYear(), to.getMonth(), 1);

                this.navCtrl.push(ChecklistDetailsPage, {
                    nombreModulo: this.filters.zonas.nombre,
                    zona_id: this.filters.zonas.id,
                    visuals_id: [],
                    to: moment(to).format('YYYY-MM-DD'),
                    from: moment(from).format('YYYY-MM-DD'),
                    filters: {
                        to: moment(to).format('YYYY-MM-DD'),
                        from: moment(from).format('YYYY-MM-DD'),
                        checklists: [],
                        nivel: "dual",
                        zoneId: null,
                        gerentes: this.filters.gerentes,
                        subgerencias: this.filters.subgerencias
                    },
                    activeFilter: this.activeFilter
                });
                return;
            }
            if (this.filters && this.filters.branchOffice && this.filters.branchOffice.id) {
                this.navCtrl.push(DetailsVisualSubsidiaryPage, {
                    filtered_visuals: [],
                    select_visuals: [],
                    from: this.filters.from,
                    to: this.filters.to,
                    branch_office: {
                        id: this.filters.branchOffice.id,
                        zona_id: this.filters.branchOffice.zona_id,
                        nombre: this.filters.branchOffice.nombre_real
                    }
                });
                return;
            }
            this.navCtrl.push(VisualDetailsPage, {
                nombreModulo: value1,
                zona_id: value2,
                filters: this.filters,
                activeFilter: this.activeFilter
            });
        }
        if (route == "IncidenciasDetailsPage") {
            UtilProvider.actualModule = value1;
            this.navCtrl.push(IncidenciasDetailsPage, {
                nombreModulo: value1,
                zona_id: value2
            });
        }
        if (route == "KpiDetailsPage") {
            UtilProvider.actualModule = value1;
            this.navCtrl.push(KpiDetailsPage, {
                tipo: 'zona',
                id: value2,
                zona: value3,
                pais: value4
            });
        }
        if (route == "KpiPage") {
            UtilProvider.actualModule = value1;
            this.navCtrl.setRoot('KpiPage', {});
        }
        if (route == "KPI") {
            UtilProvider.actualModule = value1;
            let module = _.find(globalConfig.modules, (mod: any) => {
                return (_.includes(mod.names, 'kpi') && _.includes(mod.companies, global.title.toLowerCase()));
            });
            if (module) {
                this.navCtrl.setRoot(module.page, {});
                return;
            }
            this.util.showToast('Módulo no disponible.', 3000);
        }
        /*if(route == "IncidenciasDetailsPage"){
            this.navCtrl.push(IncidenciasDetailsPage, {
                nombreModulo: value1,
                zona_id: value2
            });
        }*/

        /*TODO: Queda pendiente ya que no hay claridad sobre su uso (al parecer se utiliza en cruz verde)*/
        /*if (route == "ValesDetailsPage") {

             this.navCtrl.push(ValesDetailsPage, {
                 nombreModulo: value1,
                 zona_id: value2
             });
        }*/
    }

    /**
     * Valida si una variable es de tipo 'String'
     * @param val
     * @returns {boolean}
     */
    isString(val) {
        return typeof val === 'string';
    }

    /**
     * Refresca vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refresh(refresher: any) {
        await this.loadSession();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }

    /* Estadísticas V2, se va migrando por módulo */

    // Inicializa los filtros y solicita la estadística
    async initializeStatistics() {
        let session: any = await this.sessionProvider.getSession();

        console.log('session', session)

        // this.modules = session.usuario.modulos;

        // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);

        // Si el usuario es zonal (jerarquía 98 o mayor), habilitamos el filtro de sucursales
        this.showBranchOfficeFilter = (session && (session.usuario.jerarquia > 97 || session.usuario.tipo === 'administrador'));

        // Si el usuario es zonal y tiene sucursales en la sesión, las asignamos al filtro
        if (
            this.showBranchOfficeFilter
            && session.usuario
            && session.usuario.sucursales_completo
            && session.usuario.sucursales_completo.length
        ) {
            let branchOffices: any = [{ id: null, nombre_real: 'Todas' }];

            _.forEach(session.usuario.sucursales_completo, (bo: any) => {
                branchOffices.push(bo);
            });

            this.rawBranchOffices = branchOffices;
            this.branchOffices = branchOffices;
        }

        // Definimos los filtros
        this.filters = {
            from: this.util.getFormatedDate(from),
            to: this.util.getFormatedDate(to),
            zoneId: ((session && session.usuario) ? session.usuario.zona_id : null),
            nivel: 'top',
            branchOffice: (this.rawBranchOffices.length ? this.rawBranchOffices[0] : null)
        };

        // Cargamos la estadística de cada módulo
        this.loadSession();
    }

    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams(addBranchOffice: any) {
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.nivel}`;
        if (this.filters.zoneId) {
            params += ('&zona_id=' + this.filters.zoneId);
        }

        if (addBranchOffice && this.filters.branchOffice && this.filters.branchOffice.id) {
            params += ('&sucursales_id[]=' + this.filters.branchOffice.id);
        }
        return params;
    }

    // Cada vez que se cambia el filtro de fechas, solicita la estadística
    changeDateFilters(event: any) {
        this.loadSession();
    }

    // Función que filtra las sucursales del filtro
    onSearchBranchOffices(search: any) {
        if (search.text) {
            this.branchOffices = _.filter(this.rawBranchOffices, (branchOffice) => {
                return _.includes(this.util.cleanText(branchOffice.nombre_real), this.util.cleanText(search.text));
            });
            return;
        }
        this.branchOffices = this.rawBranchOffices;
    }


    getStatistics() {
        this.loadSession();
    }


    async getFilters() {
        this.isLoadingFilter = true;
        await this.request
            .getMicroService(config.endpoints.get.filtros)
            .then((response: any) => {
                this.isLoadingFilter = false;
                try {
                    
                    const data: any = response.data || null;
                    if(!data) return;
                    console.log(response)

                    // Si Filtro Nuevo
                    if(data.sucursales && data.sucursales.length > 0) {
                        this.subgerencias = data['subgerencias'] || [];
                        this.cadenas      = data['cadenas'] || [];
                        this.gerentes     = data['ger_operacion'] || [];
                        this.zonas        = data['zonas'] || [];


                        this.subgerencias.push({ id: null, nombre: 'Ninguna' });
                        this.subgerencias = this.util.moveToFirst(null, this.subgerencias, 'id');

                        if(this.zonas.length > 0 &&this.activeFilter.isManagerZonal){
                            this.zonas.push({ id: null, nombre: 'Todos' });
                            this.util.moveToFirst(null, this.zonas, 'id');
                        }

                        if(this.subgerencias.length > 1){
                            this.showFilterSub = true;
                            this.subgerenciaSucursales = data['sucursales'];
                        }
    
                        this.rawCadenas = data['cadenas'] || [];
                        this.rawGerentes = data['ger_operacion'] || [];
                        this.rawZonas = data['zonas'] || [];
                        this.rawSubgerencias = data['subgerencias'] || [];

                    }else { 

                        this.cadenas = data.cadena['cadenas'] || [];
                        this.subgerencias = data.subgerencia['subgerencias'] || [];
                        this.cadenas.push({ id: null, nombre: 'Ninguna' });
                        this.cadenas = this.cadenas = this.util.moveToFirst(null, this.cadenas, 'id');
    
                        this.subgerencias.push({ id: null, nombre: 'Ninguna' });
                        this.subgerencias = this.util.moveToFirst(null, this.subgerencias, 'id');
    
                        if(this.cadenas.length > 1){
                            this.showFilterCadenas = true;
                            this.cadenaSucursales = data.cadena['sucursales']
                        }
    
                        if(this.subgerencias.length > 1){
                            this.showFilterSub = true;
                            this.subgerenciaSucursales = data.subgerencia['sucursales'];
                        }
    
                        this.rawCadenas = data.cadena['cadenas'] || [];
                        this.rawSubgerencias = data.subgerencia['subgerencias'] || [];

                    }

            
                }
                catch (e) {
                    console.log(e);
                    this.isLoadingFilter = false;
                }
            })
            .catch((error: any) => {
                console.log( 'error 3' );
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
    }

    async getSucursales(filters: any){
        let sucursales_id: any = [];
        try {
            this.paramsSucursales = "";
            let params = '';
            if(filters.cadenas){
                params = '?cadenaId=['+filters.cadenas+']';
            }

            if(filters.subgerencias){
                params = '?subgerenciaId=['+filters.subgerencias+']';
            }

            if(filters.gerentes){
                params = '?gerentes=['+filters.gerentes+']';
            }
            if(filters.zonas){
                params = '?zonas=['+filters.zonas+']';
            }

            this.isLoadingFilter = true;
            const result: any = await this.request.getMicroService(config.endpoints.get.filtros + params)
            this.isLoadingFilter = false;
            let sucursales: any[] = [];

            if(result.status && result.data){
                sucursales_id = [];

                if(result.data && (result.data.filterBy || result.data.filterBy === null)){
                    const q = result.data;
                    sucursales = q.sucursales;

                    if(!q.filterBy && q.zonas && this.activeFilter.isManagerZonal){
                        // this.filters.zonas = [];
                        // this.zonas = q.zonas;
                        // this.zonas.push({ id: null, nombre: 'Todos' });
                        // this.zonas = _.sortBy(this.zonas, (item: any) => { return !item.id ? 0 : 1; });
                        // this.rawZonas = this.zonas;
                    }

                    if(q.filterBy === 'SUBGERENCIA'){
                        this.filters.gerentes = [];
                        this.filters.zonas = [];
                        this.gerentes = q.ger_operacion;
                        this.gerentes.push({ id: null, nombre: 'Todos' });
                        this.gerentes = _.sortBy(this.gerentes, (item: any) => { return !item.id ? 0 : 1; });
                        this.rawGerentes = this.gerentes;
                    }
                    
                    if(q.filterBy === 'GER_OPERACION'){
                        this.filters.zonas = [];
                        this.zonas = q.zonas;
                        this.zonas.push({ id: null, nombre: 'Todos' });
                        this.zonas = _.sortBy(this.zonas, (item: any) => { return !item.id ? 0 : 1; });
                        this.rawZonas = this.zonas;
                    }


                }else{
                    if(filters.cadenas){
                        sucursales = result.data.cadena['sucursales'];
                    }
                    if(filters.subgerencias){
                        sucursales = result.data.subgerencia['sucursales'];
                    }
                }

                if(sucursales && sucursales.length > 0){
                    sucursales_id = sucursales.map((sucursal: any) => { return sucursal.id })
                }

            }
            
            this.sucursales = sucursales_id;
            sucursales.push({ id: null, nombre_real: 'Todas' });
            sucursales = _.sortBy(sucursales, (item: any) => {
                return !item.id ? 0 : 1;
            });

            this.branchOffices = sucursales;
            this.rawBranchOffices = sucursales;
            this.filters.branchOffice = this.branchOffices.filter((sucursal) => { return !sucursal.id } )[0];


            let param = "";
            for(let id of sucursales_id){
                param += "&sucursales_id[]="+id;
            }


            this.paramsSucursales = param;

            return sucursales_id;
            
        } catch (error) {
            this.sucursales = [];
            return sucursales_id;   
        }
    }

    getStatisticsFilter(type: string ){ 
        let cadena = null;
        let subgerencia = null;
        let gerentes = null;
        let zonas = null;


        this.filters.branchOffice = [];

        if(type == 'cadena'){
            this.filters.subgerencias = [];
            if(!this.filters.cadenas.id){
                this.sucursales = [];
                this.filters.cadenas = null;
                this.cadenas = null;

            }else{
                cadena = this.filters.cadenas.id
            }
        }

        if(type == 'subgerencias'){
            this.filters.cadenas = [];
            this.filters.gerentes = [];
            if(!this.activeFilter.isManagerZonal){ 
                this.filters.zonas = [];
                this.zonas = [];
            }
            if(!this.filters.subgerencias.id){
                this.sucursales = [];
                this.filters.subgerencias = null;
                this.subgerencias = null;

            }else{
               subgerencia = this.filters.subgerencias.id
            //    subgerencia = subgerencia.map((sub) => { return sub.id });
            }

        }

        if(type === 'gerentes'){
            this.filters.zonas = [];
            if(this.filters.gerentes.id){ 
                gerentes = this.filters.gerentes.id
            }
        }

        if(type === 'zonas'){
            if(this.filters.zonas.id){ 
                zonas = this.filters.zonas.id;
            }else{
                if(this.activeFilter.isManagerZonal && this.filters.subgerencias){
                    subgerencia = this.filters.subgerencias.id
                }
            }
        }
        

        if(this.filters.branchOffice){
            this.filters.branchOffice = this.branchOffices.filter((sucursal) => { return !sucursal.id } )[0];
            this.branchOffices = this.brachOfficesUser ;
            this.rawBranchOffices = this.brachOfficesUser;
        }

        const filters = {
            cadenas: cadena, 
            subgerencias: subgerencia,
            gerentes,
            zonas
        }

        this.loadSession(filters);

        // this.getVisualStatistics(false, cadena, subgerencia);
    }

    onSearchSubgerencias(search: any) {
        if (search.text) {
            this.subgerencias = _.filter(this.rawSubgerencias, (subgerencias: any) => {
                return _.includes(this.util.cleanText(subgerencias.nombre), this.util.cleanText(search.text));
            });
            return;
        }

        this.subgerencias = this.rawSubgerencias;
    }

    onSearchCadenas(search: any) {
        if (search.text) {
            this.cadenas = _.filter(this.rawCadenas, (cadena: any) => {
                return _.includes(this.util.cleanText(cadena.nombre), this.util.cleanText(search.text));
            });
            return;
        }
        this.cadenas = this.rawCadenas;
    }


    onSearchGerentes(search: any) {
        if(!this.gerentes || this.gerentes.length == 0 ) return;
        if (search.text) {
            this.gerentes = _.filter(this.rawGerentes, (gerente: any) => {
                return _.includes(this.util.cleanText(gerente.nombre), this.util.cleanText(search.text));
            });
            return;
        }
        this.gerentes = this.rawGerentes;
    }

    onSearchZonas(search: any) {
        if(!this.zonas || this.zonas.length == 0 ) return;
        if (search.text) {
            this.zonas = _.filter(this.rawZonas, (zona: any) => {
                return _.includes(this.util.cleanText(zona.nombre), this.util.cleanText(search.text));
            });
            return;
        }
        this.zonas = this.rawZonas;
    }


    expand(){
        this.expanded = !this.expanded;
    }




    /* Estadísticas V2, se va migrando por módulo */
}
