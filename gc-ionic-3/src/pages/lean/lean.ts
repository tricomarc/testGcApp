import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { UtilProvider } from '../../shared/providers/util/util';
import { RequestProvider } from '../../shared/providers/request/request';

import { leanConfig } from '../lean/lean.config';
import { SessionProvider } from '../../shared/providers/session/session';
import * as _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-lean',
  templateUrl: 'lean.html',
})

export class LeanPage {

	// modificar luego
	private moduleName: string = "Lean"

	private session: any = null;

	private areas: any = [];
	private categorias: any = [];
	private cuadro: any = [];
	private tipoMueble: any = [];
	private currentDate: string;

	private senderBody: any = {
		sucursal_id: null,
		mueble_id: null,
		fecha: null
	}

	private noReport: boolean = false;
	private currentType: string;
	
	constructor(
		public navCtrl: NavController, 
		public navParams: NavParams,
		private requestProvider: RequestProvider,
		private utilProvider: UtilProvider,
		private sessionProvider: SessionProvider,
		private loading: LoadingController ) {
	}

	async ionViewDidLoad() {
		await this.sessionProvider.getSession().then((session: any) => {
			this.senderBody.sucursal_id = session.usuario.sucursales_completo[0].id;
		});
		
		let hoy = new Date();
		
		this.senderBody.fecha = hoy.getFullYear() + "-" + ( hoy.getMonth() + 1 ) + "-" + hoy.getDate();
		 
		// por el momento forzamos la sucursal para una ficticia
		//this.senderBody.sucursal_id = 82;

		// Setiamos el reporte para tipo Mueble
		this.senderBody.mueble_id = 1;

		await this.getIndicadoresMuebles();

		await this.getReportLean();
	}

	// trae los datos del reporte segun la sucursal y el mueble seleccionado
	async getReportLean( ){
		// loading de carga
		const loading = this.loading.create( { content: 'Obteniendo reporte...' } );

		loading.present();
		
		this.requestProvider
			.post( leanConfig.endpoints.newApi.post.reporte , this.senderBody, true )
			.then( ( res: any ) => {
				// comprobamos que venga la data no vacia
				if ( res && res.data && !_.isEmpty(res.data) ) {
					this.noReport = false;
	
					this.areas = res.data.areas;
	
					this.categorias = res.data.categorias;
	
					this.cuadro = res.data.cuadro_respuestas;

					// agregamos el nombre al cuadro con las categorias
					// transformamos en arreglo los valores para poder iterar en la tabla
					for( let i=0; i< this.categorias.length; i++ ){
						this.cuadro[i].nombre = this.categorias[i].nombre;
						this.cuadro[i].valores = _.toArray( this.cuadro[i].valores );
					}
				} else{
					// Mostramos mensaje de no reporte
					this.noReport = true;
				}
				loading.dismiss();
			})
			.catch( ( error: any ) => {
				loading.dismiss();

				// Mostramos mensaje de no reporte
				this.noReport = true;

				this.utilProvider.showToast('No ha sido posible traer el reporte. Intente nuevamente.', 3000);
			} );
	}

	// trae los muebles que puede seleccionar el ususario
	async getIndicadoresMuebles(){
		this.requestProvider.get( leanConfig.endpoints.newApi.get.indicadores, true )

		let muebles = [];
		await this.requestProvider.get( leanConfig.endpoints.newApi.get.indicadores, true )
			.then( ( res: any ) => {
				// comprobamos que exista el reporte
				if ( res && res.data && res.data ) {
					this.tipoMueble = res.data;
				}
			})
			.catch( ( error: any ) => {
				this.utilProvider.showToast('No ha sido posible traer los checklists. Intente nuevamente.', 3000);
			});
		return muebles;
	}

	// Filtra los checklists normales por su tipo de mueble
	async filterReportByMueble( mueble ) {
		await this.getReportLean();
	}

	// Filtra por fecha
	async filterByDateRange(){
		await this.getReportLean();
	}
}
