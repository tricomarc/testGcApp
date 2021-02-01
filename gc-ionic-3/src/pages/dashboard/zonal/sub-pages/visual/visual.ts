import { ApplicationRef, Component } from '@angular/core';
import { MenuController, NavController, NavParams } from 'ionic-angular';

import { RequestProvider } from "../../../../../shared/providers/request/request";
import { SessionProvider } from "../../../../../shared/providers/session/session";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { config } from "../../estadisticas.config";

import * as _ from 'lodash';

import { DetailsVisualSubsidiaryPage } from "./components/detalle/detalle";
import { global } from "../../../../../shared/config/global";

import { VisualReportPage } from '../../../../visual/branch-office/visual-report/visual-report';
import { RankingVisualPage } from '../../../../visual/zonal/ranking/ranking-visual';
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'page-visual-details',
    templateUrl: 'visual.html',
})
export class VisualDetailsPage {

    /* Estadísticas V2, se va migrando por módulo */

    private filters: any = {
        to: null,
        from: null,
        zone_id: null,
        level: null,
        visuals_id: [],
        subgerencias: [],
        cadenas: []
    };

    private search_visuals: any = [];

    private statistics: any = null;
    private requesting: any = false;
    private visuals: any = [];
    private show_ranking: any = global.show_ranking;

    /* Estadísticas V2, se va migrando por módulo */

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    paramsSucursales: string = "";
    private module_name: any = '';
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
    activeFilter: any;
    // diccionario
    private sucursalesDicc: string;
    private paramsFilters: any;
    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private request: RequestProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private applicationRef: ApplicationRef,
        private session: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {
    }

    /* Estadísticas V2, se va migrando por módulo */

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'VisualDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualDetails', 'Estadisticas' );

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursales = dictionary['Sucursales']
		} );
    }

    ionViewDidEnter() {
        this.paramsFilters = this.navParams.get('filters');
        this.activeFilter = this.navParams.get('activeFilter');
        if(this.activeFilter){
            this.isManagerRegion = this.activeFilter.isManagerRegion;
        }
            
        this.initStatistics();
        if(!this.paramsFilters || !this.paramsFilters.gerentes || !this.paramsFilters.subgerencias){
            this.getFilters();
        }
    }



    // Inicializa los filtros y solicita la estadística
    async initStatistics() {

        // Guardamos los filtros de fechas que vienen por parámetros
        let from_param: any = this.navParams.data.filters.from;
        let to_param: any = this.navParams.data.filters.to;

        // Asignamos el nombre del módulo
        if (this.navParams.data.module_name) {
            this.module_name = this.navParams.data.module_name;
        }

        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);
        let session: any = await this.session.getSession();

        this.filters = {
            to: (to_param ? to_param : this.getFormatedDate(to)),
            from: (from_param ? from_param : this.getFormatedDate(from)),
            zone_id: (this.navParams.data.zone_id ? this.navParams.data.zone_id : ((session && session.usuario) ? session.usuario.zona_id : null)),
            level: 'dual',
            visuals_id: []
        };

        // Obtenemos los visuales
        await this.getVisuals();

        // Si vienen visuales filtrados, los agregamos antes de traer la estadística
        if (this.navParams.data.visuals_id && this.navParams.data.visuals_id.length) {
            let filtered_visuals = [];

            if(this.navParams.data.visuals_id && this.navParams.data.visuals_id.length) {
                _.forEach(this.navParams.data.visuals_id, (visual) => {
                    let visual_found = _.find(this.visuals, { id: visual.id });
                    if(visual_found) filtered_visuals.push(visual_found);
                });
            }

            this.filters.visuals_id = filtered_visuals;
        }


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

        await this.getVisualStatistics(false, filters);
    }


    async getFilters() {
        await this.request
            .getMicroService(config.endpoints.get.filtros)
            .then((response: any) => {
                try {

                    const data: any = response.data || null;
                    if(!data) return;

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
                        //Selecciona la primera subgerencia
                        if(this.subgerencias.length == 1){
                            this.filters.subgerencias = this.subgerencias;
                        }
                    }

                    this.rawCadenas = data.cadena['cadenas'] || [];
                    this.rawSubgerencias = data.subgerencia['subgerencias'] || [];
            
                }
                catch (e) {
                    console.log(e);
                }
            })
            .catch((error: any) => {
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
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
                // cadena = cadena.map((ca) => { return ca.id });
               
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
            //    subgerencia = subgerencia.map((sub) => { return sub.id });
            }

        }

        const filters = {
            cadenas: cadena, 
            subgerencias: subgerencia,
            gerentes
        }

        this.getVisualStatistics(false, filters);
    }


    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams(include_visuals_id: boolean) {
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.level}`;
        if(this.filters.zone_id) { params += ('&zona_id=' + this.filters.zone_id); }
        if (include_visuals_id && this.filters.visuals_id.length) {
            let visuals_id = '';

            _.forEach(this.filters.visuals_id, (visual) => {
                visuals_id += '&visuales_id[]=' + visual.id;
            });
            
            params += visuals_id;
        }

        if(this.sucursales.length > 0){
            params += this.paramsSucursales;
        }

        return params;
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd
    getFormatedDate(date: any) {
        let year = date.getFullYear();
        let month = (date.getMonth() + 1);
        let day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }

    // Muestra la vista con el ranking de visual
    showRanking() {
        this.navCtrl.push(RankingVisualPage);
    }

    // Muestra el detalle de una sucursal o su reporte en caso de que haya un visual seleccionado
    showBranchOfficeDetail(branch_office) {
        // Si viene el reporte_id y se filtró un visual en especifico vamos directo al detalle del visual
        if (branch_office.reporte_id && this.filters.visuals_id.length === 1) {
            this.navCtrl.push(VisualReportPage, { fromStats: true, report_id: branch_office.reporte_id, branchOfficeName: branch_office.nombre });
            return;
        }

        this.navCtrl.push(DetailsVisualSubsidiaryPage, {
            filtered_visuals: this.filters.visuals_id,
            select_visuals: this.visuals,
            from: this.filters.from,
            to: this.filters.to,
            branch_office: branch_office
        });
    }

    // Muestra en detalle la estadística de una zona
    showZoneDetail(id) {
        this.navCtrl.push(VisualDetailsPage, {
            module_name: this.module_name,
            zone_id: id,
            visuals_id: this.filters.visuals_id,
            from: this.filters.from,
            to: this.filters.to,
            filters: this.filters,
            activeFilter: this.activeFilter
        });
    }

    // Obtiene los visuales con los filtros seleccionados
    async getVisuals() {
        this.requesting = true;
        await this.request
            .get((config.endpoints.get.visuales + this.getQueryParams(false)), true)
            .then((response: any) => {
                this.requesting = false;
                try {
                    if (response && response.data) {
                        this.visuals = (response.data.visuales ? response.data.visuales : []);
                        this.search_visuals = this.visuals;
                        return;
                    }
                } catch (e) { }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting = false;
            });
    }

    /**
     * 
     * @param subgerenciaId 
     */
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

            
            const result: any = await this.request.getMicroService(config.endpoints.get.filtros + params)

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

    // Obtiene las estadísticas con los filtros seleccionados
    async getVisualStatistics(is_refresher: boolean, applyFilters?: any) {
        if (!is_refresher) this.requesting = true;
        if(applyFilters && 
            (applyFilters.cadenas || applyFilters.subgerencias || applyFilters.gerentes)){
            await this.getSucursales(applyFilters);
        }   
        await this.request
            .get((config.endpoints.get.visuales + this.getQueryParams(true)), true)
            .then((response: any) => {
                this.requesting = false;
                try {
                    if (response && response.data) {
                        this.statistics = response.data;
                        const visuales: any[] =  (response.data.visuales ? response.data.visuales : []);
                        this.visuals = this.util.removeDuplicates(visuales);
                        return;
                    }
                    this.util.showToast('No ha sido posible obtener la estádistica', 30000);
                }
                catch (e) {
                    this.util.showToast('No ha sido posible obtener la estádistica', 30000);
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting = false;
                if (error && error.message) this.util.showToast(error.message, 3000);
                else this.util.showToast('No ha sido posible obtener la estádistica', 30000);
            });
    }

    // Vuelve a solicitar la estadística con los filtros seleccionados
    refreshStatistics(refresher: any, is_refresher: boolean, from_date_change: boolean) {
        if (refresher) refresher.complete();
        if(from_date_change) this.filters.visuals_id = [];
        this.getVisualStatistics(is_refresher);
    }

    // Función que se ejecuta cuando se busca en el componente ionic-selectable
    onSearch(search: any) {
        if(search.text) {
            this.search_visuals = _.filter(this.visuals, (visual) => {
                return _.includes(this.util.cleanText(visual.nombre), this.util.cleanText(search.text));
            });
            return;
        }
        this.search_visuals = this.visuals;
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
    /* Estadísticas V2, se va migrando por módulo */

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
