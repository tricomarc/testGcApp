import { ApplicationRef, Component } from '@angular/core';
import {
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    ModalController,
    NavController,
    NavParams
} from 'ionic-angular';
import { config } from "../../estadisticas.config";
import * as _ from 'lodash';
import { RequestProvider } from "../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { SessionProvider } from "../../../../../shared/providers/session/session";
import { ChecklistDetailsPage } from "../checklist/checklist";
import { DetailsComunicadosSubsidiaryPage } from "./components/detalle/detalle";
import { global } from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'page-comunicados-details',
    templateUrl: 'comunicados.html',
})
export class ComunicadosDetailsPage {


    /* Estadísticas V2, se va migrando por módulo */

    private filters: any = null;
    private requesting: boolean = false;
    private rawNews: any = [];
    private news: any = [];
    private statistics: any = null;

    private settings: any = {
        zonalReadVisible: false,
        showZonal: false,
        showSubManagers: false
    };

    /* Estadísticas V2, se va migrando por módulo */

    hasta = new Date();
    desde = new Date(this.hasta.getFullYear(), this.hasta.getMonth(), 1);

    //date = new Date();
    nombreModulo = "";
    filtros = {
        desde: this.desde + "",
        hasta: this.hasta + "",
        comunicados_id: [],
        tipo_id: this.navParams.data.tipo_id,
        zona_id: this.navParams.data.zona_id,
        nivel: 'dual'
    };
    datos = [];
    comunicados = [];
    tipos = [];
    cargoUsuario: number = 0;
    setting: boolean = false;
    mostrarSubgerente: boolean = false;
    mostrarZonal: boolean = false;

    cadenas: any = [];
    subgerencias: any = [];
    rawCadenas: any = [];
    rawSubgerencias: any = [];

    cadenaSucursales: any[] = [];
    subgerenciaSucursales: any[] = [];

    sucursales: any[] = [];
    gerentes: any[] = [];
    rawGerentes: any[] = [];
    rawZonas: any[] = [];
    isManagerRegion: boolean = false;
    canActive: boolean = true;

    showFilterSub: boolean = false;
    showFilterCadenas: boolean = false;
    paramsSucursales: string = "";
    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    activeFilter: any;
    // diccionarios
    private sucursalesDicc: string;
    private paramsFilters: any;
    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        public modalCtrl: ModalController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private applicationRef: ApplicationRef,
        private event: Events,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {

        UtilProvider.comunicadosZonalIntent = 0;
    }

    /* Nueva versión estadística checklist */

    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ComunicadosDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ComunicadosDetails', 'Estadisticas' );
    }

    ionViewDidEnter() {
        this.paramsFilters = this.navParams.get('filters');
        this.activeFilter = this.navParams.get('activeFilter');
        if(this.activeFilter){
            this.isManagerRegion = this.activeFilter.isManagerRegion;
        }
            
        this.initializeStatistics();
        if(!this.paramsFilters || !this.paramsFilters.gerentes || !this.paramsFilters.subgerencias){
            this.getFilters();
        }
    }

    async initializeStatistics() {
        // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);
        let filters: any = this.navParams.data.filters;

        // Definimos los filtros
        this.filters = {
            from: ((filters && filters.from) ? filters.from : this.util.getFormatedDate(from)),
            to: ((filters && filters.to) ? filters.to : this.util.getFormatedDate(to)),
            zoneId: ((filters && filters.zoneId) ? filters.zoneId : null),
            nivel: 'dual',
            news: ((filters && _.isArray(filters.news)) ? filters.news : []),
            typeId: this.navParams.data.tipo_id
        };

        await this.getSettings();

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursales = dictionary['Sucursales']
        } );
        
        if (this.navParams.data.comunicados_id && this.navParams.data.comunicados_id.length) {
            // Lamentablemente, los comunicados vienen en el mismo servicio que la estadística
            // Por lo que debemos hacer la consulta primero sin filtrar y luego agregamos los filtros en la nueva consulta
            await this.getStatistics(false);
            _.forEach(this.navParams.data.comunicados_id, (newAux: any) => {
                let foundNew: any = _.find(this.news, (temp: any) => {
                    // No usamos comparación identica ya que en algunos ambientes el id puede ser String
                    return newAux == temp.id;
                });
                if(foundNew) {
                    this.filters.news.push(foundNew);
                }
            });
            this.getStatistics(false);
        } else {

            const filter = this.navParams.get('filters');
            let cadenaId = null;
            let subgerenciaId = null;
            let gerentesId = null;
            if(filter && filter.cadenas && filter.cadenas.id){
                this.filters.cadenas = filter.cadenas;
                cadenaId = filter.cadenas.id
                
            }
    
            if(filter && filter.subgerencias && filter.subgerencias.id){
                this.filters.subgerencias = filter.subgerencias;
                subgerenciaId = filter.subgerencias.id
            }

            if(filter && filter.gerentes && filter.gerentes.id){
                this.filters.gerentes = filter.gerentes;
                gerentesId = filter.gerentes.id
            }
    
            const filters = {
                cadenas: cadenaId, 
                subgerencias: subgerenciaId,
                gerentes: gerentesId
            }
            this.getStatistics(false, filters);
        }

    }

    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams() {
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.nivel}&tipo_id=${this.filters.typeId}`;
        if (this.filtros.zona_id) {
            params += ('&zona_id=' + this.filters.zoneId);
        }
        if (this.filters.news && this.filters.news.length) {
            _.forEach(this.filters.news, (nw: any) => {
                params += ('&comunicados_id[]=' + nw.id);
            });
        }

        if(this.sucursales.length > 0){
            params += this.paramsSucursales;
        }
        
        return params;
    }

    // Función que filtra los comunicados
    onSearchNews(search: any) {
        if (search.text) {
            this.news = _.filter(this.rawNews, (nw) => {
                return _.includes(this.util.cleanText(nw.name), this.util.cleanText(search.text));
            });
            return;
        }
        this.news = this.rawNews;
    }

    // Cada vez que se cambia el filtro de fechas, solicita la estadística
    changeDateFilters(event: any) {
        this.filters.news = [];
        this.getStatistics(false);
    }

    // Vuelve a solicitar la estadística con los filtros seleccionados
    async refreshStatistics(refresher: any) {
        await this.getStatistics(true);
        refresher.complete();
    }

    // Obtiene la estadística
    async getStatistics(isRefresher: boolean, applyFilters?: any) {
        if(!isRefresher) this.requesting = true;
        if(applyFilters && 
            (applyFilters.cadenas || applyFilters.subgerencias || applyFilters.gerentes)){
            await this.getSucursales(applyFilters);
        }   
        // Obtenemos
        await this.request
            .get(config.endpoints.get.comunicados + this.getQueryParams(), true)
            .then((response: any) => {
                if (response && response.data) {
                    if (response.data.comunicados) {
                        let news = [];
                        _.mapKeys(response.data.comunicados, (value, key) => {
                            news.push({ id: key, name: value });
                        });
                        this.rawNews = news;
                        this.news = news;
                    }
                 
                    if((this.filters.cadenas || this.filters.subgerencias) && !this.paramsSucursales){
                        console.log('Entro Aca')
                        response.data.bot = [];
                        response.data.top = [];
                        response.data.com_cargos = [];
                        response.data.comunicados = [];
                    }else{
                        if( ((this.filters && this.filters.zoneId ) || this.filtros.zona_id ) &&// Exista zona
                            (this.sucursales && this.sucursales.length > 0)) // Existan sucursales para comparar
                        {
                            if(this.filters.cadenas || this.filters.subgerencias){
                               response.data.bot = this.util.getMatches(this.sucursales, response.data.bot);
                            }
                        }
                    }

                    this.statistics = response.data;
                    this.tipos = response.tipos;

                    if (this.cargoUsuario >= 100) {
                        this.mostrarSubgerente = true;
                    } else if ((this.cargoUsuario >= 97) || (this.cargoUsuario <= 99)) {
                        this.mostrarZonal = true;
                    }
                    this.applicationRef.tick();
                }
            })
            .catch((error: any) => {
                this.util.showToast('No ha sido posible obtener la estadística.', 3009);
            });
        this.requesting = false;
        return true;
    }

    /* Nueva versión estadística checklist */

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        if (this.navParams.data.nombreModulo) {
            this.nombreModulo = this.navParams.data.nombreModulo;
        }
        /*this.updateDates();
        this.getAllComunicates();
        this.getSettings();*/
    }

    /**
     * Carga informacion de setting activados por usuario guardados en memoria
     * @returns {Promise<void>}
     */
    async getSettings() {
        let zonalReadSetting: any = await this.util.getSettingByName('com_lectura_zonales');
        if (zonalReadSetting && zonalReadSetting.visible == true) {
            this.settings.zonalReadVisible = true;
        }

        await this.session
            .getSession()
            .then((session: any) => {
                this.cargoUsuario = session.usuario.jerarquia * 1;

                if(this.cargoUsuario > 100) {
                    this.settings.showZonal = true;
                    this.settings.showSubManagers = true;
                } else if(this.cargoUsuario > 99) {
                    this.settings.showZonal = true;
                }
            });
        return true;
    }

    /**
     * Trae lista de comunicados y areas desde API
     * @returns {Promise<{}>}
     */
    async getAllComunicates() {
        const loading = this.loading.create({ content: 'Obteniendo estadísticas' });
        loading.present();
        let data = {};
        var params = this.getQueryParams();
        await this.request
            .get(config.endpoints.get.comunicados + params, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    this.datos = response.data;
                    let comunicados = response.data.comunicados;
                    this.tipos = response.tipos;

                    this.orderComunicates(comunicados);

                    if (this.cargoUsuario >= 100) {
                        this.mostrarSubgerente = true;
                    } else if ((this.cargoUsuario >= 97) || (this.cargoUsuario <= 99)) {
                        this.mostrarZonal = true;
                    }
                    this.applicationRef.tick();
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Cambio de formato de comunicados a array estandar
     * @param comunicadosArray
     */
    orderComunicates(comunicadosArray) {
        var newComunicates = [];
        Object.keys(comunicadosArray).forEach(function(key) {
            var tempCheck = {
                id: key,
                nombre: comunicadosArray[key]
            };
            newComunicates.push(tempCheck)
        });
        this.comunicados = newComunicates;
    }

    /**
     * Redireccion a detalles si es vista zonal y a zona si es vista de admin
     * @param zona_id
     */
    goToDetails(data) {
        if (!_.isUndefined(this.navParams.data.zona_id) && !_.isNull(this.navParams.data.zona_id)) {
            if (this.filtros.comunicados_id.length > 0) {
                this.navCtrl.push(DetailsComunicadosSubsidiaryPage, {
                    desde: this.filtros.desde + "",
                    hasta: this.filtros.hasta + "",
                    sucursal_id: data.id,
                    comunicados_id: this.filtros.comunicados_id,
                    graphics: data.datos,
                    filters: this.filters,
                    preguntas: data.preguntas ? data.preguntas : null
                });
            } else {
                this.navCtrl.push(DetailsComunicadosSubsidiaryPage, {
                    desde: this.filtros.desde + "",
                    hasta: this.filtros.hasta + "",
                    sucursal_id: data.id,
                    graphics: data.datos,
                    filters: this.filters,
                    preguntas: data.preguntas ? data.preguntas : null
                });
            }
        } else {
            if (this.filtros.comunicados_id.length > 0) {
                this.filters.zoneId = data.id;
                this.navCtrl.push(ComunicadosDetailsPage, {
                    tipo_id: 12,
                    nombreModulo: data.nombre,
                    zona_id: data.id,
                    comunicados_id: this.filtros.comunicados_id,
                    filters: this.filters,
                    activeFilter: this.activeFilter
                });
            } else {
                this.filters.zoneId = data.id;
                this.navCtrl.push(ComunicadosDetailsPage, {
                    tipo_id: this.filters.typeId ? this.filters.typeId : 12,
                    nombreModulo: data.nombre,
                    zona_id: data.id,
                    filters: this.filters,
                    activeFilter: this.activeFilter
                });
            }
        }
    }


    async getFilters() {
        await this.request
            .getMicroService(config.endpoints.get.filtros)
            .then((response: any) => {
                try {

                    const data: any = response.data || null;
                    if(!data) return;

                    if (data.sucursales && data.sucursales.length > 0) {
                        this.subgerencias = data['subgerencias'] || [];
                        this.cadenas = data['cadenas'] || [];
                        this.gerentes = data['ger_operacion'] || [];

                        this.subgerencias.push({ id: null, nombre: 'Ninguna' });
                        this.subgerencias = this.util.moveToFirst(null, this.subgerencias, 'id');

                        if (this.subgerencias.length > 1) {
                            this.showFilterSub = true;
                            this.subgerenciaSucursales = data['sucursales'];
                        }

                        this.rawGerentes = data['ger_operacion'] || [];
                        this.rawCadenas = data['cadenas'] || [];
                        this.rawSubgerencias = data['subgerencias'] || [];

                    } else {

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
                }
            })
            .catch((error: any) => {
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
    }




    async getSucursales(filters: any){
        let sucursales_id: any = [];
        try {
            this.paramsSucursales = "";
            let params = '';
            if(filters.subgerencias && filters.gerentes){
                params = '?subgerenciaId=['+filters.subgerencias+']&gerentes=['+filters.gerentes+']';
            }else
            if(filters.cadenas){
                params = '?cadenaId=['+filters.cadenas+']';
            }else

            if(filters.subgerencias){
                params = '?subgerenciaId=['+filters.subgerencias+']';
            }else

            if(filters.gerentes){
                params = '?gerentes=['+filters.gerentes+']';
            }

            const result: any = await this.request.getMicroService(config.endpoints.get.filtros + params);


            if(result.status && result.data){
                sucursales_id = [];
                let sucursales: any[] = [];
                if(result.data && result.data.filterBy){
                    const q = result.data;
                    sucursales = q.sucursales;
                    
                    if(q.filterBy === 'SUBGERENCIA' || q.filterBy === 'SUBG_GEROPE'){
                        //Filtro subgerencias
                        this.subgerencias = q.subgerencias;
                        this.rawSubgerencias = this.subgerencias;
                        this.subgerencias.push({ id: null, nombre: 'Ninguna' });
                        this.subgerencias = this.util.moveToFirst(null, this.subgerencias, 'id');
                        this.showFilterSub = true;
                        // Filtro Gerentes
                        this.filters.gerentes = [];
                        this.gerentes = q.ger_operacion;
                        this.gerentes.push({ id: null, nombre: 'Todos' });
                        this.gerentes = _.sortBy(this.gerentes, (item: any) => { return !item.id ? 0 : 1; });
                        this.rawGerentes = this.gerentes;

                        if(this.canActive){
                            if(this.paramsFilters && this.paramsFilters.gerentes && this.paramsFilters.gerentes.id )
                                 this.filters.gerentes = this.paramsFilters.gerentes;
                        }
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

            let param = "";
            for(let id of sucursales_id){
                param += "&sucursales_id[]="+id;
            }

            this.paramsSucursales = param;
            this.sucursales = sucursales_id;
            return sucursales_id;
            
        } catch (error) {
            this.sucursales = [];
            return sucursales_id;   
        }
    }

    getStatisticsFilter(type){ 
        let cadena = null;
        let subgerencia = null;
        let gerentes = null;
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
            this.canActive = false;
            if(!this.filters.subgerencias.id){
                this.sucursales = [];
                this.filters.subgerencias = null;
                this.subgerencias = null;

            }else{
               subgerencia = this.filters.subgerencias.id
            }
        }

        if(type === 'gerentes'){
            if(this.filters.gerentes.id){ 
                gerentes = this.filters.gerentes.id
            }
        }

        const filters = {
            cadenas: cadena, 
            subgerencias: subgerencia,
            gerentes
        }

        this.getStatistics(false, filters);

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


}
