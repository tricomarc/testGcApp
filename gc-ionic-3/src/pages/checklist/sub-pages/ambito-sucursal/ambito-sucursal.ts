import { IonicPage, NavController, NavParams, LoadingController, Events, MenuController, ActionSheetController } from 'ionic-angular';
import { Component, ApplicationRef } from '@angular/core';

import { Storage } from '@ionic/storage';

import * as _ from 'lodash';
import * as moment from 'moment';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-ambito-sucursal',
	templateUrl: 'ambito-sucursal.html',
})
export class AmbitoSucursalPage {

	private module: string = UtilProvider.actualModule;
	private checklist_id: null;
	private ambitoList: any =[];
	private preguntasSucursal = [];


  	constructor( 
		public navCtrl: NavController, 
		public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private applicationRef: ApplicationRef,
        private event: Events,
        private storage: Storage,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
		private events: Events,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {}


    // antes de cargar, traigo sesion
    ionViewDidLoad() {
		// tracks de vista
		this.firebaseAnalyticsProvider.trackView( 'AmbitoSucursalChecklist' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'AmbitoSucursal', 'Checklist' );

        // el data desde map-visit
        if ( !this.navParams.data.check_id ) {
            this.util.showToast( 'Falta información de la sucursal', 3000 );
            
            this.navCtrl.pop();
            return;
		}

		this.getDataChecklist();
    }

	async getDataChecklist(){
		let data: any = { check_id: this.navParams.data.check_id};
		const loading = this.loading.create( { content: 'Obteniendo checklists' } );

		loading.present();

		await this.request.post( '/visitas/checklist/preguntas', data, true )
			.then( ( response: any ) => {
				this.ambitoList = response.data;

				_.forEach(this.ambitoList, (ambito) => {
					_.forEach(ambito.preguntas, (pregunta) => {
						if(pregunta.codigo_tipo === 'cam') {
							pregunta.visita = true;	
						}
					})
				})
			}).catch( ( err: any ) => {
				this.util.showToast( 'No se pudieron obtener los datos', 3000 );
			});

		loading.dismiss();

	}

	navigateToDetails( ambito_id ){
		this.navCtrl.push( 'DetallePage' , {
			ambito_id: ambito_id,
			check_id: this.navParams.data.check_id,
			ambitoList: this.ambitoList,
			onlyWatch: true,
			fromStats: true
		} );
	}

	// debería agregar un refresh?
	refreshAmbitos( refresher ){
		//comprobacion necesaria?
		if( this.navParams.data.check_id ) {
            this.getDataChecklist();
            refresher.complete();
        } else{
			refresher.complete();
			this.util.showToast( 'No se pudieron obtener los datos', 3000 );
		}
        
	}
}
