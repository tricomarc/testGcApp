import { Component } from '@angular/core';
import { IonicPage, NavController, Events, LoadingController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';
import { SessionProvider } from '../../shared/providers/session/session';

// Configuración del componente
import { config } from './materials.config'

// Páginas
import { MaterialDetailPage } from './material-detail/material-detail';

// Configuración global
import { global } from '../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-materials',
	templateUrl: 'materials.html',
})

export class MaterialsPage {

	// Atributos
	private materials: any = [];
	private materials_view: any = [];
	private statuses: any = ['Recibido', 'Pendiente'];
	private filters: any = {
		currentStatus: 'Todos'
	};

	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	// Constructor
	constructor(
		private navCtrl: NavController,
		private events: Events,
		private request: RequestProvider,
		private util: UtilProvider,
		private session: SessionProvider,
		private loading: LoadingController,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
	) {}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'Materials' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'Materials', 'Materials' );

		let temp = await this.getMaterials();
		
		this.materials = temp;
		
		this.materials_view = temp;

		this.events.subscribe( 'materialDetailPoped', async () => {
			let view: any = this.navCtrl.getActive();
			
			if ( view.instance instanceof MaterialsPage ) {
				let temp = await this.getMaterials();
				
				this.materials = temp;
				
				this.materials_view = temp;
			}
		});
	}

	// Solicita la lista de materiales
	async getMaterials() {
		// loading
		const loading = this.loading.create({ content: 'Obteniendo materiales...' });

		loading.present();

		let materials = [];
		
		this.requesting = true;
		
		await this.request
			.get( config.endpoints.oldApi.get.materials, config.useNewApi )
			.then( ( response: any ) => {
				loading.dismiss();

				if ( response && response.data ) {
					materials = response.data;
				}
			} ).catch( ( error: any ) => {
				loading.dismiss();

				this.util.showToast( 'No ha sido posible obtener la lista de materiales', 3000 );
			}
		);
		
		this.requesting = false;
		
		return materials;
	}

	// Refresca la lista de materiales
	async refreshMaterials( refresher: any ) {
		let temp = await this.getMaterials();
		
		this.materials = temp;
		
		this.materials_view = temp;
		
		this.applyFilterByStatus();
		
		refresher.complete();
	}

	// Filtra la lista de materiales
	applyFilterByStatus() {
		if ( this.filters.currentStatus === 'Todos' ) { this.materials_view = this.materials; return; }
		
		this.materials_view = _.filter( this.materials, { estado: this.filters.currentStatus } );
	}

	// Navega hasta el detalle de un material
	navigateToMaterialDetail( material_id: any ) {
		this.navCtrl.push( MaterialDetailPage, { material_id: material_id } );
	}
}
