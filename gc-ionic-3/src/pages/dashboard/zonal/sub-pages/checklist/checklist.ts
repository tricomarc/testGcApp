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
import { RequestProvider } from "../../../../../shared/providers/request/request";
import * as _ from 'lodash';

import { config } from '../../estadisticas.config'
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { DetailsChecklistSubsidiaryPage } from "./components/detalle/detalle";
import { global } from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'page-checklist-details',
    templateUrl: 'checklist.html',
})
export class ChecklistDetailsPage {

    /* Nueva versión estadística checklist */

    private filters: any = null;
    private rawChecklists: any = [];
    private checklists: any = [];
    private statistics: any = null;
    private requesting: boolean = false;

    private title: string = global.title; // Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; // Nombre para mostrar del módulo seleccionado

    /* Nueva versión estadística checklist */

    nombreModulo = "";
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
    isLoadingFilter: boolean = false;

    showFilterSub: boolean = false;
    showFilterCadenas: boolean = false;
    paramsSucursales: string = "";
    isManagerRegion: boolean = false;
    canActive: boolean = true;
    // diccionario
    private sucursalesDicc: string;
    private paramsFilters: any;
    activeFilter: any;
    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        public modalCtrl: ModalController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private event: Events,
        private menu: MenuController,
        private applicationRef: ApplicationRef,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {

        UtilProvider.checklistZonalIntent = 0;
    }

    /* Nueva versión estadística checklist */

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ChecklistDetails', 'Estadisticas' );
        
        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursalesDicc = dictionary['Sucursales']
        } );
        
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
            zoneId: ((this.navParams.data.zona_id) ? this.navParams.data.zona_id : null),
            nivel: 'dual',
            checklists: []
        };

        if (this.navParams.data.checks_id && this.navParams.data.checks_id.length) {
            // Lamentablemente, los checklists vienen en el mismo servicio que la estadística
            // Por lo que debemos hacer la consulta primero sin filtrar y luego agregamos los filtros en la nueva consulta
            await this.getStatistics(false);
            _.forEach(this.navParams.data.checks_id, (checklist: any) => {
                let foundChecklist: any = _.find(this.checklists, (temp: any) => {
                    // No usamos comparación identica ya que en algunos ambientes el id puede ser String
                    return checklist == temp.id;
                });
                if(foundChecklist) {
                    this.filters.checklists.push(foundChecklist);
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
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.nivel}`;
        if (this.filters.zoneId) {
            params += ('&zona_id=' + this.filters.zoneId);
        }
        if (this.filters.checklists && this.filters.checklists.length) {
            _.forEach(this.filters.checklists, (checklist: any) => {
                params += ('&checks_id[]=' + checklist.id);
            });
        }

        if(this.sucursales.length > 0){
            params += this.paramsSucursales;
        }
        
        return params;
    }

    // Vuelve a solicitar la estadística con los filtros seleccionados
    async refreshStatistics(refresher: any) {
        await this.getStatistics(true);
        refresher.complete();
    }

    // Obtiene la estadística
    async getStatistics(isRefresher: boolean, applyFilters?: any) {
        if (!isRefresher) this.requesting = true;
        if(applyFilters && 
            (applyFilters.cadenas || applyFilters.subgerencias || applyFilters.gerentes)){
            await this.getSucursales(applyFilters);
        }   
        // Obtenemos
        await this.request
            .get(config.endpoints.get.checklist + this.getQueryParams(), true)
            .then((response: any) => {
                if (response && response.data) {
                    if (response.data.checks) {
                        let checklists = [];
                        _.mapKeys(response.data.checks, (value, key) => {
                            checklists.push({ id: key, name: value });
                        });
                        this.rawChecklists = checklists;
                        this.checklists = checklists;
                    }
                    if((this.filters.cadenas || this.filters.subgerencias) && !this.paramsSucursales){
                        response.data.bot = [];
                        response.data.top = [];
                    }else{
                        if( (this.filters && this.filters.zoneId ) &&// Exista zona
                            (this.sucursales && this.sucursales.length > 0)) // Existan sucursales para comparar
                        {
                            if(this.filters.cadenas || this.filters.subgerencias){
                               response.data.bot = this.util.getMatches(this.sucursales, response.data.bot);
                            }
                        }
                    }
                    this.statistics = response.data;
                }
            })
            .catch((error: any) => {
                this.util.showToast('No ha sido posible obtener la estadística.', 3009);
            });
        this.requesting = false;
        return true;
    }

    // Función que filtra los checklists
    onSearchChecklist(search: any) {
        if (search.text) {
            this.checklists = _.filter(this.rawChecklists, (checklist) => {
                return _.includes(this.util.cleanText(checklist.name), this.util.cleanText(search.text));
            });
            return;
        }
        this.checklists = this.rawChecklists;
    }

    // Cada vez que se cambia el filtro de fechas, solicita la estadística
    changeDateFilters(event: any) {
        this.filters.checklists = [];
        this.getStatistics(false);
    }

    /* Nueva versión estadística checklist */

    async ionViewWillEnter() {
        if (this.navParams.data.nombreModulo) {
            this.nombreModulo = this.navParams.data.nombreModulo;
        }
    }


    /**
     * Redireccion a detalles si es vista zonal y a zona si es vista de admin
     * @param zona_id
     */
    goToDetails(data) {
        this.filters.subgerencias = null;
        if (this.navParams.data.zona_id) {
            this.navCtrl.push(DetailsChecklistSubsidiaryPage, {
                desde: this.filters.from,
                hasta: this.filters.to,
                sucursal_id: data.id,
                graphics: data.datos,
                filters: this.filters
            });
        } else {
            if (this.filters.checklists.length > 0) {
                this.navCtrl.push(ChecklistDetailsPage, {
                    nombreModulo: data.nombre,
                    zona_id: data.id,
                    checks_id: _.map(this.filters.checklists, 'id'),
                    filters: this.filters,
                    activeFilter: this.activeFilter
                });
            } else {
                this.navCtrl.push(ChecklistDetailsPage, {
                    nombreModulo: data.nombre,
                    zona_id: data.id,
                    filters: this.filters, 
                    activeFilter: this.activeFilter
                });
            }
        }
    }



    async getFilters() {
        this.isLoadingFilter = true;
        await this.request
            .getMicroService(config.endpoints.get.filtros)
            .then((response: any) => {
                try {
                    this.isLoadingFilter = false;
                    const data: any = response.data || null;
                    if(!data) return;
                    // Si Filtro Nuevo
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

            // if(filters.subgerencias){
            //     this.showFilterSub = true;
            // }


            this.isLoadingFilter = true;
            const result: any = await this.request.getMicroService(config.endpoints.get.filtros + params)
            this.isLoadingFilter = false;

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
            console.log(error);
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
