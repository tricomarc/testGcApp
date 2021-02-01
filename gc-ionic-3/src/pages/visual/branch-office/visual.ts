import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController, LoadingController, Events, Content, NavParams, ActionSheetController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';

// Páginas
import { LoginPage } from '../../../pages/login/login';
import { VisualReportPage } from './visual-report/visual-report';
import { VisualRevisionPage } from './visual-revision/visual-revision';
import { RankingVisualPage } from '../zonal/ranking/ranking-visual';
import { VisualHistoryPage } from '../branch-office/visual-history/visual-history';

// Configuración del componente
import { config } from './visual.config';

// Configuración global
import { global } from '../../../shared/config/global';

import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-visual',
	templateUrl: 'visual.html',
})

export class VisualPage {

	@ViewChild(Content) content: Content;

	// Atributos
	private visuals: any = [];
	private branchOffices: any = [];
	private statuses: any = [];
	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;
	// Representa la sucursal seleccionada en la vista
	private currentBranchOffice: any = null;
	// Filtros
	private filters: any = {
		currentStatus: 0,
		statusRead: 0
	};
	
	private revision: any = null;
	private show_ranking: any = global.show_ranking;
	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private isTask: boolean = false;
	private onlyTask: number = 0;

	private clientCode: string = global.pro.appId;


	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private zone: NgZone,
		private events: Events,
		private navParams: NavParams,
		private actionSheetController: ActionSheetController,
		private request: RequestProvider,
		private util: UtilProvider,
		private session: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Protección para las vistas, si no hay sesión no puede ingresar a esta página
	async ionViewCanEnter() {
		let result = await this.session.isSession();
		
		if ( !result ) this.navCtrl.setRoot( LoginPage );
		
		return result;
	}
	ionViewWillEnter(){
		const taskParams = this.navParams.get('isTask');
		if(taskParams) this.onlyTask = 2
		else this.onlyTask = 1; 
		// this.isTask = taskParams ? taskParams : false;
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'VisualBranchOffice' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualBranchOffice', 'Visual' );

		this.filters.statusRead = this.navParams.data.filter_by_read ? 2 : 0;
		
		this.statuses = await this.getStatuses();
		
		this.getComponentData( false, false );

		// Evento que escucha cuando se cierra la vista de detalle de reporte
		this.events.subscribe( 'visualReportPoped', async () => {
			// try { this.content.scrollToTop(); } catch (e) { }
			// Si no hay estados, los volvemos a pedir
			if (this.statuses.length < 1) this.statuses = await this.getStatuses();
			
			await this.getComponentData( false, true );
		} );
	}

	ionViewDidLeave() {
		setTimeout(() => {
			let view = this.navCtrl.getActive();
			// Si la página es root y no es VisualPage, borramos la suscripción
			if ( !( view.instance instanceof VisualPage ) && !this.navCtrl.canGoBack()) {
				this.events.unsubscribe( 'visualReportPoped' );
			}
		}, 500 );
	}

	// Obtiene las sucursales desde la sesión y los visuales desde el servicio
	async getComponentData( isRefresher: boolean, fromVisualReport: boolean ) {
		this.getRevisions();
		
		// Traemos los visuales desde el servicio
		await this.getVisuals( isRefresher, fromVisualReport );
		
		// Obtenemos el arreglo de sucursales desde la sesión (Se guardan al realizar Login)
		this.session.getSession()
			.then( ( response: any ) => {
				this.zone.run( () => {
					let sucursales = response.usuario.sucursales_completo;
					
					for ( let index = 0; index < sucursales.length; index++ ) {
						// Al primero lo dejamos "open" en true
						sucursales[index].open = ( index === 0 ? true : false );
						
						// Para cada sucursal, asignamos sus visuales
						sucursales[index].visuals = _.filter( this.visuals, ['sucursal_id', sucursales[index].id] );
					}
					
					this.branchOffices = sucursales;
					
					// Por defecto la primera sucursal queda seleccionada
					this.currentBranchOffice = this.branchOffices[0];
					
					this.applyFilters();

					this.requesting = false;
				} );
			} ).catch((error) => {
				// Registramos el error en la API
				this.util.logError( JSON.stringify( error ), 'VisualPage.getComponentData()', globalConfig.version );
				
				this.requesting = false;
			}
		);
	}

	// Obtiene los estados desde el servicio
	async getStatuses() {
		let results = [];
		
		this.requesting = true;
		
		await this.request.get( config.endpoints.newApi.get.statuses, true )
			.then( ( response: any ) => {
				// Antes de retornar los estados, cambiamos los íconos a ionic 2+
				_.forEach( response.data, ( result ) => {
					// if (result.nombre !== 'Caducado') {
					let info = this.getIconByStatus( result.icono_app );
					
					result = _.merge( result, info );
					
					results.push( result );
					// }
				} );
			} ).catch( ( error: any ) => {
				// Registramos el error en la API
				this.util.logError( JSON.stringify( error ), 'VisualPage.getStatuses()', globalConfig.version );
				
				this.util.showToast( 'No ha sido posible traer la lista de estados', 3000 );
			} 
		);
		
		this.requesting = false;
		
		return results;
	}

	// Alterna el estado "open" de una oficina
	selectBranchOffice( branchOffice: any ) {
		if ( this.branchOffices.length < 2 ) { branchOffice.open; return; }
		
		branchOffice.open = !branchOffice.open;
		
		if ( branchOffice.open ) {
			this.currentBranchOffice = branchOffice;
			
			// Cada vez que se selecciona una nueva sucursal se debe aplicar el filtro de estado y lectura
			this.applyFilters();
			
			// Se scrollea hasta la sucursal seleccionada
			this.scrollTo( branchOffice.id );
		} else {
			// Si no hay sucursal seleccionada scrolleamos hasta arriba
			try { this.content.scrollToTop(); } catch ( e ) { }
		}
		
		// Deseleccionamos las no seleccionadas
		_.forEach( this.branchOffices, ( br ) => {
			if ( br.id !== branchOffice.id ) {
				br.open = false;
			}
		} );
	}

	// Obtiene la lista de "visuales"
	async getVisuals( isRefresher: boolean, fromVisualReport: boolean ) {
		let results = [];

		if (!isRefresher && !fromVisualReport) this.requesting = true;

		await this.request.post( config.endpoints.newApi.post.visuals, {}, true )
			.then( ( response: any ) => {
				try {
					let data = (this.util.isJson(response) ? JSON.parse(response).data : response.data);

					if(this.onlyTask == 0){
						this.isTask = false;
					}
					if(this.onlyTask == 1){
						this.isTask = false;
						data = this.visualTasks(data, true)
					}
					if(this.onlyTask == 2){
						this.isTask = true;
						data = this.visualTasks(data, false);
					}

					// El objeto data (que llega desde el servicio), aparte de "visuales" puede traer otros objetos
					// Por lo cual se hace un filtro antes de asignar los "visuales" a la vista
					results = _.filter( data, ( visual ) => {
						visual.status_data = this.getStatusValueByKey( visual.estado );
						
						return _.has( visual, 'id' );
					} );
					
					this.visuals = results;
				}
				catch ( e ) {
					// Registramos el error en la API
					this.util.logError( e, 'VisualPage.getVisuals() -> Try[0]', globalConfig.version ) ;
				}
			} ).catch( ( error: any ) => {
				// Registramos el error en la API
				this.util.logError( JSON.stringify( error ), 'VisualPage.getVisuals()', globalConfig.version );
				
				if ( error && error.message ) this.util.showToast( 'No ha sido posible obtener la lista de campañas', 3000 );
			}
		);
	}

	visualTasks(visuals: JSON, excludeTask: boolean){
		var _visuals = null;
		if(excludeTask){
			_visuals = (<any>Object).values(visuals)
				.filter(element => {return element.tarea != true});
		}else{
			_visuals = (<any>Object).values(visuals)
				.filter(element => {return element.tarea == true});
		}
		return _visuals;
	}
	
	async implementar(visual){
		const loading = this.loading.create({content: 'Implementando campaña'});
		loading.present();
		if (await this.isExpired(visual)) {loading.dismiss(); return};
		this.request
			.post(config.endpoints.newApi.post.implement, {reporte_id: visual.reporte_id}, true)
			.then((response) => {
				loading.dismiss();
				if(!response['status']){
					this.util.showToast(response['message'], 3000);
					return;
				}
				console.log(response)
				this.util.showToast('Campaña implementada exitosamente', 3000);
				this.getComponentData(false, false);
				
			})
			.catch((error) => {
				loading.dismiss(); 
				this.util.showAlert('Atención', 'No ha sido posible implementar la campaña, intente nuevamente.');
			})
	}

	// Verifica si una campaña ha caducado o no, además agrega la holgura del cliente en caso de que exista
	async isExpired(visual) {
		let result = true;
		await this.request
			.get(config.endpoints.newApi.get.info, true)
			.then((response: any) => {
				if (!response || !response.data || !response.data.timestamp) {
					this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
				} else if (response.data.timestamp > (visual.fecha_reporte.timestamp + (visual.holgura ? visual.holgura : 0))) {
					let formatedDate = visual.fecha_reporte.day.string + ' '
						+ visual.fecha_reporte.day.real + ' de ' + visual.fecha_reporte.month.string
						+ ', ' +visual.fecha_reporte.year.real + '<br> a las '
						+ visual.fecha_reporte.time + ' hrs.';
					this.util.showAlert('Atención', 'La fecha de reporte ha caducado. Fecha de vencimiento: ' + formatedDate);
				} else {
					result = false;
				}
			})
			.catch((error: any) => {
				this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
			});
		return result;
	}


	// Se activa cada vez que se cambia un filtro
	applyFilters() {
		_.forEach( this.branchOffices, ( branchOffice ) => {
			let filtered_visuals = [];
			
			// Obtenemos las visuales de cada sucursal
			let visuals: any = _.filter( this.visuals, [ 'sucursal_id', branchOffice.id ] );

			if ( !this.filters.currentStatus ) filtered_visuals = visuals;
			// Si hay un estado seleccionado aplicamos el filtro por estado
			else filtered_visuals = _.filter(visuals, { estado: this.filters.currentStatus } );

			if ( !this.filters.statusRead ) branchOffice.visuals = filtered_visuals;
			// Si hay un estado de lectura seleccionado aplicamos el filtro por estado de lectura
			else if ( this.filters.statusRead === 1 ) branchOffice.visuals = _.filter( filtered_visuals, ( visual ) => { return visual.fecha_leido } );
			else if ( this.filters.statusRead === 2 ) branchOffice.visuals = _.filter( filtered_visuals, ( visual ) => { return !visual.fecha_leido } );
		} );
	}

	// Vuelve a solicitar la lista de visuales al servicio
	async refreshVisuals( refresher: any ) {
		// Si no hay estados, los volvemos a pedir
		if ( this.statuses.length < 1 ) this.statuses = await this.getStatuses();
		
		await this.getComponentData( true, false );
		
		refresher.complete();
	}

	// Scrollea la vista hasta el header con el nombre de la sucursal
	scrollTo( element: string ) {
		// Esperamos a que se reordene el arreglo de visuales
		setTimeout( () => {
			let y = document.getElementById( element ).offsetTop;
			try { this.content.scrollTo( 0, ( y - 5 ), 700 ); } catch ( e ) { }
		}, 100 );
	}

	// Retorna el valor (información) del estado actual o del estado que entra por parámetro (id)
	getStatusValueByKey( key: any ) {
		let value = _.find( this.statuses, { id: (key ? key : this.filters.currentStatus) } );
		
		if ( value ) return value;
		
		return { nombre: 'Desconocido' };
	}

	// Retorna un aproximado del ícono usado en ionic 1
	/*(CONFIGURAR EN ADMIN ICONOS PARA IONIC 2+ Y DEJAR DE USAR ESTA FUNCIÓN)*/
	getIconByStatus( info: any ) {
		let data = this.util.getIconAndColorFromV1( info );
		
		return data;
	}

	// Selecciona un status para filtrar visuales
	selectFilter( status: any ) {
		this.filters.currentStatus = status.id;
		
		// Aplicamos los filtros
		this.applyFilters();
		
		// Si hay una sucursal seleccionada y abierta navegamos hasta su título
		if ( this.currentBranchOffice && this.currentBranchOffice.open ) {
			this.scrollTo( this.currentBranchOffice.id );
			
			return;
		}
		// Si no solo vamos hasta arriba
		try { this.content.scrollToTop(); } catch (e) { }
	}

	// Navega a la página donde está el detalle del visual
	navigateToVisualReport( visual: any ) {
		this.navCtrl.push( VisualReportPage, {
			visual_id: visual.id,
			report_id: visual.reporte_id,
			status_data: visual.status_data,
			branch_office_id: visual.sucursal_id,
			branch_office_name: this.getBranchOfficeName(visual.sucursal_id),
			statuses: this.statuses,
			task: visual.tarea
		});
	}

	// Retorna el nombre de una sucursal a partir de su id
	getBranchOfficeName( branchOfficeId: any ) {
		let branchOffice = _.find( this.branchOffices, { id: branchOfficeId } );
		
		if ( branchOffice ) return branchOffice.nombre_real;
		return 'Desconocida';
	}

	// Obtiene la cantidad de revisiones pendientes de visuales
	getRevisions() {
		this.request.get( config.endpoints.newApi.get.revision, true )
			.then( ( response: any ) => {
				try {
					if ( response.code === 200 && response.data ) {
						this.zone.run( () => {
							this.revision = response.data;
							
							this.content.resize();
						} );
					}
				} catch ( e ) {
					// Registramos el error en la API
					this.util.logError( e, 'VisualPage.getRevisions() -> Try[0]', globalConfig.version );
				}
			} ).catch( ( error: any ) => {
				// Registramos el error en la API
				this.util.logError( JSON.stringify( error ), 'VisualPage.getRevisions()', globalConfig.version );
			} 
		);
	}

	// Navega hasta la vista de revisión de visuales
	showRevisions() {
		this.navCtrl.push( VisualRevisionPage );
	}

	// Presenta un action sheet que permite navegar a ranking e históricos
	showActionSheet() {
		let buttons: any = [{
			text: 'Implementaciones históricas',
			handler: () => {
				this.navCtrl.push( VisualHistoryPage, { statuses: this.statuses } );
			}
		}];

		if ( this.show_ranking ) {
			buttons.unshift({
				text: 'Ranking',
				handler: () => {
					this.navCtrl.push( RankingVisualPage );
				}
			} );
		}

		let actionSheet = this.actionSheetController.create( {
			buttons: buttons
		} );

		actionSheet.present();
	}

	setFavorite(isFav, id){
		const loading = this.loading.create({});
		loading.present();
		var params = {prefix: 'visual', id, favorito: !isFav };
		this.util.setFavorite(params)
			.then(() => {loading.dismiss(); this.getComponentData(false, false);})
			.catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message) })
	}

}
