import { Component } from '@angular/core';
import { IonicPage, NavController, ModalController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';

import { BranchOfficeUsers } from './branch-office-users/branch-office-users';

// Configuración del componente
import { config } from './ranking-visual.config';

// Configuración global
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@IonicPage()
@Component({
	selector: 'page-ranking-visual',
	templateUrl: 'ranking-visual.html',
})

export class RankingVisualPage {

	// Atributos
	private ranking: any = null;

	private areas: any = [];
	private visuals: any = [];

	private search_visuals: any = [];
	private search_areas: any = [];

	private filters: any = {
		areas_id: [],
		visuales_id: [],
		from: null,
		to: null
	};

	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = 'Ranking ' + UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	private color_progress: string = '#CCCCCC';

	private session: any;
	// diccionario
	private sucursal: string;
	private sucursales: string;

	// Constructor
	constructor( private navCtrl: NavController,
		private modalController: ModalController,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
		private sessionProvider: SessionProvider,
		private dictionary: DictionaryProvider ) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'RankingVisualVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'RankingVisual', 'Visual' );

		await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursal = dictionary['Sucursal'];
			this.sucursales = dictionary['Sucursales']
		} );

		let to = new Date();
		
		let from = new Date( to.getFullYear(), to.getMonth(), 1 );

		this.filters.from = this.getFormatedDate( from );
		
		this.filters.to = this.getFormatedDate( to );

		this.color_progress = global.client_colors.primary;

		// Obtenemos los filtros y el ranking
		this.requesting = true;
		
		await this.getAreas();
		
		await this.getVisuals();
		
		await this.getRanking();
		
		this.requesting = false;
	}

	// Refresca el ranking de visual
	async refreshRankingVisual( refresher: any ) {
		this.filters.areas_id = [];
		
		this.filters.visuales_id = [];
		
		await this.getAreas();
		
		await this.getVisuals();
		
		await this.getRanking();
		
		refresher.complete();
	}

	// Trae el ranking de visual desde el servicio
	async getRanking() {
		if ( !this.visuals.length ) {
			this.util.showToast( 'No hemos encontrado campañas para el raking', 5000 );
			
			this.ranking = null;
			
			return;
		}
		
		await this.request.post( config.endpoints.newApi.post.ranking, this.getRankingFilters(), true )
			.then( ( response: any ) => {
				if ( response && response.data && !Array.isArray( response.data ) ) {
					this.ranking = response.data;
				}
			} ).catch( ( error ) => {
				this.util.showToast( 'No ha sido posible obtener el ranking de ' + ( UtilProvider.actualModule ? UtilProvider.actualModule : 'visual' ), 5000 );
			}
		);
	}

	// Obtiene los visuales para filtrar el ranking
	async getVisuals() {
		await this.request.post( config.endpoints.newApi.post.visuals, this.getVisualFilters(), true )
			.then( ( response: any ) => {
				if ( response && response.data ) {
					this.visuals = response.data;
					
					this.search_visuals = response.data;
				}
			} ).catch( ( error ) => { } 
		);
	}

	// Obtiene la lista de áreas
	async getAreas() {
		await this.request.post( config.endpoints.newApi.post.areas, {}, true )
			.then( ( response: any ) => {
				if ( response && response.data ) {
					this.areas = response.data;
					
					this.search_areas = response.data;
				}
			} ).catch( ( error: any ) => { }
		);
	}

	// Vuelve a solicitar los visuales cada vez que se cambia un filtro
	async filterVisuals( is_date_or_area: boolean ) {
		// Si se filtra una fecha o área, reiniciamos las áreas y los visuales
		if ( is_date_or_area ) {
			this.filters.visuales_id = [];
		}
		
		this.requesting = true;
		
		await this.getVisuals();
		
		await this.getRanking();
		
		this.requesting = false;
	}

	// Vuelve a solicitar el ranking cada vez que se cambia el filtro de visuales
	async filterRanking() {
		this.requesting = true;
		
		await this.getRanking();
		
		this.requesting = false;
	}

	// Función que se ejecuta cuando se busca en el componente ionic-selectable de campañas
	onSearch( search: any ) {
		if ( search.text ) {
			this.search_visuals = _.filter( this.visuals, ( visual ) => {
				return _.includes( this.util.cleanText( visual.nombre ), this.util.cleanText( search.text ) );
			} );
			
			return;
		}
		
		this.search_visuals = this.visuals;
	}

	// Inicializa las fechas de los filtros. Si is_today = false, se calcula el primer día del mes actual
	initializeDate( is_today ) {
		let date = new Date();
		
		let temp = null;
		
		if ( is_today ) temp = date;
		else temp = new Date( date.getFullYear(), date.getMonth(), 1 );
		
		return `${ temp.getFullYear() }-${( temp.getMonth() + 1 ) < 10 ? ('0' + ( temp.getMonth() + 1 ) ) : ( temp.getMonth() + 1 ) }-${ temp.getDate() < 10 ? '0' + temp.getDate() : temp.getDate() }`;
	}

	// Retorna los filtros para el servicio de visuales
	getVisualFilters() {
		let filters: any = {
			areas_id: this.filters.areas_id,
			
			desde: this.filters.from,
			
			hasta: this.filters.to
		};
		
		return filters;
	}

	// Retorna los filtros para el servicio de ranking
	getRankingFilters() {
		let filters = {
			visuales_id: []
		};

		if ( !this.filters.visuales_id.length ) filters.visuales_id = _.map( this.visuals, 'id' );
		else filters.visuales_id = _.map( this.filters.visuales_id, 'id' );
		
		return filters;
	}

	// Recibe una fecha y retorna un string en formato yyyy-mm-dd 
	getFormatedDate( date: any ) {
		let year = date.getFullYear();
		
		let month = ( date.getMonth() + 1 );
		
		let day = date.getDate();

		return `${ year }-${ month < 10 ? ( '0' + month ) : month }-${ day < 10 ? ( '0' + day ) : day }`;
	}

	// Función que se ejecuta cuando se busca en el componente ionic-selectable de áreas
	onSearchAreas( search: any ) {
		if ( search.text ) {
			this.search_areas = _.filter( this.areas, ( area ) => {
				return _.includes( this.util.cleanText( area.nombre ), this.util.cleanText( search.text ) );
			});
			
			return;
		}
		
		this.search_areas = this.areas;
	}

	// Levanta un modal con los usuarios de una sucursal
	showBranchOfficeUsers( branchOffice: any ) {
		let modal = this.modalController.create( BranchOfficeUsers, { branchOffice: branchOffice } );
		
		modal.present();
	}
}
