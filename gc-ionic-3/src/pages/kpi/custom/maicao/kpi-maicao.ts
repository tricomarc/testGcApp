import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { GoogleChartComponent, Ng2GoogleChartsModule } from 'ng2-google-charts';


import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';


// Configuración del componente
import { config } from './kpi-maicao.config'

// Configuración global
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';


@IonicPage()
@Component({
	selector: 'page-kpi-maicao',
    templateUrl: 'kpi-maicao.html',
    providers: [GoogleChartComponent]

})

export class KpiMaicaoPage {
	private module: string = 'KPI'; //Nombre para mostrar del módulo seleccionado
	private session: any = null;
    private cumplimientos: any;
    private charge: any = null;
    private requestParams: any = {
        dataId: null, // Representa el id de la zona o sucursal a consultar
        charge: null,
        zonaId: null
    };
    private fecha = new Date();
    private details: any;
    private indicatorSelected: any;
    private indicatorRankingSelected: any;
    private indicatorToShow: any;
    private rankingMenu: any = [];
    private rankingZona: any;
    private rankingSucursales: any;
    private cumplimiento: any;
    private posicion: any;
    private indicatorChartSelected: any;
    private chartData: any;
    private chartIndicator: any;
    private sucursales: any;
    private sucursalesFiltered: any;
    private sucursalesSearch: any = []
    private zonas: any;
    private sucursalSelected: any;
    private columnChart: any;
    private zonaSelected: any;
    private todasSucursal: boolean;

	// Constructor
	constructor(private navCtrl: NavController,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private loading: LoadingController,
        private googleChart: GoogleChartComponent,
        ) {
	}

	// Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'KpiMaicao' );
                // Obtenemos el cargo del usuario actual
        if (!this.charge) {
            this.charge = await this.getChargeAndSession();
            if (!this.charge) {
                this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI, Falta información del usuario.');
                
                //this.requesting = false;
                return;
            }
        }

        this.requestParams.charge = this.charge;

        // POR CONFIRMAR Si el usuario es cargo sucursal obtenemos el data id del parametro sucursales_completo
        if (this.charge === 'sucursal') {
            if (!this.session.sucursales || !this.session.sucursales.length) {
                this.util.showAlert('Alerta', 'No tiene una sucursal asociada');
                //this.requesting = false;
                return;
            }

            this.requestParams.dataId= this.session.sucursales_completo[0].id;

            this.requestParams.zonaId= this.session.sucursales_completo[0].zona_id;
            
            //this.requestParams.dataId_id = 11;
        } else if (this.charge === 'zonal') {
            // Si el zonal no tiene zona paramos la ejecución de este método
            if (!this.session.zona_id) {
                this.util.showAlert('Alerta', 'No tiene una zona asociada');
                //this.requesting = false;
                return;
            }
           
            this.sucursalesFiltered = this.sucursales;
            
            this.sucursalesFiltered.unshift( { id: 0, nombre_real: 'TODAS'} );
            
            this.sucursalesSearch = this.sucursalesFiltered;

            console.log( 'sesion, sucursales, zonas', this.session, this.sucursales, this.zonas );

            // sucursal a consultar
            this.requestParams.dataId= this.sucursalesSearch[1].id;

            // preselecionamos TODAS
            this.sucursalSelected = this.sucursalesSearch[0];
            this.todasSucursal = true;

            this.zonaSelected = this.zonas[0];
    
            // zona id
            this.requestParams.zonaId = this.session.zona_id;

        // Para pais, gerente subgerente
        } else if (this.charge === 'pais') {
            this.requestParams.zonaId= this.zonas[0].id;

            this.sucursalesFiltered = _.filter( this.sucursales, [ 'zona_id', this.requestParams.zonaId ] );

            this.sucursalesSearch = this.sucursalesFiltered;
            
            this.sucursalesSearch.unshift( { id: 0, nombre_real: 'TODAS'} );

            
            this.requestParams.dataId= this.sucursalesSearch[1].id

            this.sucursalSelected = this.sucursalesSearch[0];
            this.todasSucursal = true;

            this.zonaSelected = this.zonas[0];

        }
        
        this.getInitData();

        return;
    }

    // Llama a los servicios que traen la data y la presentan como información
    async getInitData() {
        const loading = this.loading.create( { content: 'Obteniendo indicadores...' } );
        loading.present();
        
        this.getCumplimientos();

	    this.getDetalles()
    
        await this.getRankingMenu();

        this.getRankingZonaIndicadores();

        this.getRankingIndicadores();

        this.getHistoricalData();
        
        loading.dismiss();
        
        return;
    }

  	async getCumplimientos( ){
    	let cumplimientos = null;
        let query_params = this.getQueryParams();
        
        console.log( 'cueri params getCumplimientos', query_params );

		await this.request.get( config.endpoints.newApi.get.fulfillments + query_params, true )
			.then( ( response: any ) => { 
				try {
					if (response) {
						cumplimientos = response.data;
						
						this.cumplimientos = _.toArray( cumplimientos );
						
						console.log( 'data cumpliminetos', this.cumplimientos );
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
		} );
	}
	
	async getDetalles(){
		let detalles = null;
        let query_params = this.getQueryParams();

        console.log( 'cueri params del getDetalles', query_params );

		await this.request.get( config.endpoints.newApi.get.details + query_params, true )
			.then( ( response: any ) => { 
				try {
					if (response) {
						detalles = _.toArray( response.data.valores );
                        
                        _.forEach( detalles, ( detalle ) => {
                            _.forEach( detalle.indicador, ( aux: any) => {
                                aux.valores = Array( aux.valores );
                            } );
                            detalle.indicador = _.toArray( detalle.indicador );
                        } );
    
                        this.details = detalles;

                        this.indicatorSelected = this.details[0].nombre;
                        
                        this.filterIndicator();
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
		} );
	}

    async getHistoricalData(){
        let data = null;
        
        let historicalChart_params = this.getHistoricalChartParams( );

        console.log( 'cueri params del getHistoricalData', historicalChart_params );

		await this.request.get( config.endpoints.newApi.get.historicalChart + historicalChart_params, true )
			.then( ( response: any ) => { 
				try {
					if ( response ) {
                        data = response.data;
                        
                        this.chartData = data.valores;

                        console.log( 'chart data', this.chartData );

                        this.filterChartIndicator();
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
        } );
        
        return;
    }
    
	// Retorna los parámetros para filtrar los KPIS
    getQueryParams() {
        let query_params = '';
        //let currentDate = '2020-06-11';
        
        let currentDay = this.fecha.getFullYear() + '-' + (this.fecha.getMonth() + 1) + '-' + this.fecha.getDate();
        
        if( this.todasSucursal ){
            console.log( 'entro al query de todas' );
            query_params = '?tipo=zona' + '&dataId=' + this.requestParams.zonaId + '&fecha=' + currentDay;
        }else{
            query_params = '?tipo=sucursal' + '&dataId=' + this.requestParams.dataId + '&fecha=' + currentDay;
        }
        
        return query_params;
	}
    
    getRankingParams( rankingZona: boolean ){
        let ranking_params = '';
        //let currentDate = '2020-06-11';
        
        let currentDay = this.fecha.getFullYear() + '-' + (this.fecha.getMonth() + 1) + '-' + this.fecha.getDate();
        
        if( rankingZona ){
            ranking_params = '?tipo=sucursal' + '&dataId=' + this.requestParams.dataId + '&fecha=' + currentDay + '&indicador=' + this.indicatorRankingSelected + '&zonaId=';
        }else{
            ranking_params = '?tipo=sucursal' + '&dataId=' + '&fecha=' + currentDay + '&flag=indicador&indicador='+ this.indicatorRankingSelected + '&zonaId=' + this.requestParams.zonaId;
        }
    
        return ranking_params;
    }

    getHistoricalChartParams(){
        let chart_params = '';
        
        if( this.requestParams.charge == 'sucursal' ){
            chart_params = '?tipo=' + this.requestParams.charge + '&dataId=' + this.requestParams.dataId;

            return chart_params;
        }else if( this.requestParams.charge == 'zonal' ){
            if( this.todasSucursal ){
                chart_params = '?tipo=zona' + '&dataId=' + this.requestParams.zonaId
                
                return chart_params;
            }
            chart_params = '?tipo=sucursal' + '&dataId=' + this.requestParams.dataId
            
            return chart_params;
        }else if( this.requestParams.charge == 'pais' ){
            if( this.todasSucursal ){
                chart_params = '?tipo=zona' + '&dataId=' + this.requestParams.zonaId
                
                return chart_params;
            }
            chart_params = '?tipo=sucursal' + '&dataId=' + this.requestParams.dataId
            
            return chart_params;
        }
    }

	// Retorna el cargo del usuario actual y obtiene la sesión
    async getChargeAndSession() {
        let charge = null;
        await this.sessionProvider
            .getSession()
            .then((response: any) => {
                this.session = response.usuario;
                     
                this.sucursales = this.session.sucursales_completo;
                this.zonas = this.session.zonas;
                
                charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'sucursal' : (response.usuario.jerarquia < 100 ? 'zonal' : 'pais'));
                
                console.log( 'sesion y cargo asignado', this.session, charge );

            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible verificar su cargo, intente nuevamente');
            });
        return charge;
    }

    // obtenemos el menu de ranking
    async getRankingMenu(){
        let indicator = {
            id: null,
            nombre: null
        };

		await this.request.get( config.endpoints.newApi.get.menuRanking, true )
			.then( ( response: any ) => { 
				try {
					if (response) {
						let datos = response.data;

                        let menu = datos.data;

                        _.forEach( menu, (item: any) => {
                            _.forEach( item.indicadores, ( aux: any ) => {
                                indicator = { id: aux.id, nombre: aux.nombre.nombre }
                                this.rankingMenu.push( indicator );
                            } );
                        } );
                        
                        // valores iniciales para sucursal
                        this.indicatorRankingSelected = this.rankingMenu[0].id;

                        this.indicatorChartSelected = this.rankingMenu[0].nombre;

                        console.log( 'indicator chart selcted', this.indicatorChartSelected );
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
        } );

        return;
    }

    // Filtro de indicadores para tabla de detalles
    filterIndicator(){
        console.log( 'indicador seleccionado', this.indicatorSelected );
        
        // obtengo el indicador a filtrar
        let indicator = _.filter( this.details, ( detail: any ) => {
            if( detail.nombre == this.indicatorSelected ){
               return detail.indicador;
            }
        });
        
        this.indicatorToShow = indicator[0].indicador;

        console.log( 'valores a mostrar', this.indicatorToShow );
    }
    
    // filtro para ranking
    filterRankingIndicator(){
        console.log( 'filtro de ranking seleccionado', this.indicatorRankingSelected );

        this.getRankingZonaIndicadores();

        this.getRankingIndicadores();
    }

    // Filtro para el gráfico
    filterChartIndicator(){
        console.log( 'grafico de indicador', this.indicatorChartSelected );
        let chartObject: any;
        let meses: any;
        
        meses = this.chartData.indicadores;

        chartObject = _.filter( this.chartData.datos, ( item: any ) => {
            if( item.nombre == this.indicatorChartSelected ){
                console.log( 'entro' )
                return item;
            }
        } );

        chartObject[0].indicadores = meses;

        this.getHistoricalChart( chartObject );
    }

    // Filtro de sucursales
    filterSucursal(){
        console.log( 'filter sucursal selected', this.sucursalSelected );
        
        this.todasSucursal = false;
        
        if( this.sucursalSelected.id == 0){
            this.todasSucursal = true;
            
            this.getInitData();

            return;
        }

        this.requestParams.dataId = this.sucursalSelected.id;
        
        this.getInitData();

        return;
    }

    // Función que se ejecuta cuando se busca en el componente ionic-selectable de áreas
	onSucursalesSearch( search: any ) {
        if( search.text ){
            console.log( 'search', search.text );
            this.sucursalesSearch = _.filter( this.sucursalesFiltered, ( sucursales: any ) => {
                console.log( 'del search', sucursales );
                return _.includes( this.util.cleanText ( sucursales.nombre_real ), this.util.cleanText( search.text ) )
            } );

            return;
        }
		
        this.sucursalesSearch = this.sucursalesFiltered;
    }
    

    filterZona(){
        console.log( 'zona seleccionada', this.zonaSelected );

        this.sucursalesFiltered = _.filter( this.sucursales, [ 'zona_id', this.zonaSelected.id ] );
        
        console.log( 'sucursales filtered', this.sucursalesFiltered );

        this.requestParams.zonaId = this.zonaSelected.id;
        
        this.filterSucursal();

        return;
    }

    onZonasSearch(search: any ){
        if( search.text ){
            console.log( 'search', search.text );
            this.zonas = _.filter( this.session.zonas, ( zona: any ) => {
                console.log( 'del search', zona );
                return _.includes( this.util.cleanText ( zona.nombre ), this.util.cleanText( search.text ) )
            } );

            return;
        }
		
       this.zonas = this.session.zonas;
    }
    
    // ranking zona para sucursales
    async getRankingZonaIndicadores(  ){
        let zona = true;
        let ranking_params = this.getRankingParams( zona );

        console.log( 'cueri del getRankingZonaIndicadores', ranking_params );

		await this.request.get( config.endpoints.newApi.get.rankingZonaIndicadores + ranking_params , true )
			.then( ( response: any ) => { 
				try {
					if (response) {
                        let rankingData = response.data;
                        console.log( 'data zona indicadores', rankingData );
                        
                        this.cumplimiento = rankingData.tuCumplimiento;
                        this.posicion = rankingData.tuPosicion;
                        
                        rankingData = _.get( rankingData, 'indicadoresZonas.' + this.indicatorRankingSelected + '.data');
                        
                        rankingData = _.toArray( rankingData );

                        this.rankingZona = rankingData;

                        // ordenamos segun posicion
                        this.rankingZona = _.orderBy( this.rankingZona, 'posicion', 'asc' );

                        console.log( 'ranking zona indicadores', this.rankingZona );
                        
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
		} );
    }

    async getRankingIndicadores(){
        let zona = false;
        let ranking_params = this.getRankingParams( zona );
        
        console.log( 'cueri del getRankingIndicadores', ranking_params );

		await this.request.get( config.endpoints.newApi.get.rankingSucursalIndicadores + ranking_params, true )
			.then( ( response: any ) => { 
				try {
					if ( response ) {
						let dataIndicadores = response.data;
                        
                        dataIndicadores = _.get( dataIndicadores, this.indicatorRankingSelected );
                        
                        dataIndicadores.data = _.orderBy( _.toArray( dataIndicadores.data ), 'posicion', 'asc' );

                        this.rankingSucursales = Array( dataIndicadores );

						console.log( 'ranking indicadores sucursales', this.rankingSucursales );
					} else {
						this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
					}
				} catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
			} ).catch( ( error: any )  => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
		} );
    }

    // Grafico historico
    getHistoricalChart( chartObject: any ){
       console.log( 'datos a graficar', chartObject );

       let table = [];
    
       table[0] = [ 'Meses', 'Cump.'];

       for( let i = 1; i < chartObject[0].indicadores.length; i ++){
        table[i] = [{ v: chartObject[0].indicadores[i] }, { v: chartObject[0].valores[i], f: chartObject[0].valores[i] + '%'  } ];
       }
    
       this.chartIndicator = chartObject[0].nombre;
        try{
            this.columnChart =  {
                chartType: 'ColumnChart',
                dataTable:  table,
                options: {
                    title: '',
                    legend: 'none',
                    height: 280,
                    chartArea: {
                        right: '0',
                        left: '50'
                    },
                    backgroundColor: 'transparent',
                    hAxis: {
                        title: ''
                    },
                    vAxis: {
                        title: 'Cumplimiento %',
                        format: '#'
                    },
                    series: [
                        { color: chartObject[0].color },
                    ]
                }
            } ;
        } catch (e) { }
    
        console.log( 'chart', this.columnChart );
    
        return this.columnChart;
    }
}
