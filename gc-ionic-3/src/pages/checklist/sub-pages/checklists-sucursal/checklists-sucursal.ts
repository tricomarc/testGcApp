import { Component, ApplicationRef } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Events, MenuController, ActionSheetController } from 'ionic-angular';

import { Storage } from '@ionic/storage';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';
import * as moment from 'moment';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
  selector: 'page-checklists-sucursal',
  templateUrl: 'checklists-sucursal.html',
})
export class ChecklistsSucursalPage {

    private searchControl = new FormControl();

    private sucursal_id: null;
    private checklists: any = []; 
    private auxchecklists: any = [];
    private module: string = UtilProvider.actualModule;
    private aux: any = [];

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
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {  
    }

    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistsSucursal' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ChecklistsSucursal', 'Checklist' );


        // observo cambios del buscador
        this.watchSearch();
        
        // el data desde map-visit
        if (!this.navParams.data.sucursal) {
            this.util.showToast( 'Falta información de la sucursal', 3000 );
            
            this.navCtrl.pop();
            return;
        }

        this.sucursal_id = this.navParams.data.sucursal;
                
        this.getDataChecklists();
    }

  // una vez cargada y al entrar
    async ionViewWilllEnter() {
        // cargo el menu
        this.menu.enable( true, "menu" );
    }

  // Traigo checklists asociados a la sucursal 
    async getDataChecklists(){
        let data: any = { sucursal_id: this.sucursal_id};

        const loading = this.loading.create({ content: 'Obteniendo checklists' });
    
        loading.present();

		await this.request.post( '/visitas/checklist/listar', data, true )
			.then( ( response: any ) => {
                this.checklists = response.data;
                this.auxchecklists = response.data;
            } ).catch( ( error: any ) => {
                this.util.showToast( 'No se pudieron obtener los datos', 3000 );
                
            } );

        loading.dismiss();
    }

    // ir a ambito
    navigateToAmbito( checklist_id, checklist_nombre, checklist_inicio, checklist_termino){
        this.navCtrl.push( 'AmbitoSucursalPage', { 
            check_id: checklist_id, 
            checklist_nombre: checklist_nombre,
            checklist_inicio: checklist_inicio,
            checklist_termino: checklist_termino } );
    }

    // refresher
    refreshChecklists( refresher ){
        //comprobacion necesaria?
        if( this.sucursal_id ) {
            this.getDataChecklists();
            refresher.complete();
        }else{
            refresher.complete();
            this.util.showToast( 'No se pudieron obtener los datos', 3000 );
        }

    }

    watchSearch(){
        this.searchControl.valueChanges
            .debounceTime( 300 )
            .distinctUntilChanged()
            .subscribe( async ( searchTerm: any ) => {
                if( searchTerm ){
                    this.checklists = _.filter( this.auxchecklists, ( checklist ) => {
                        return( _.includes( checklist.nombre.toLowerCase(), searchTerm.toLowerCase() ) );
                    } );
                    return;
                }
                this.checklists = _.cloneDeep( this.auxchecklists );
            } );
    }

}
