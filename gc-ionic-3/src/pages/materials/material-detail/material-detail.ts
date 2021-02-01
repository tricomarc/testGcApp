import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, Content, LoadingController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';

// Configuración del componente
import { config } from './material-detail.config'

// Configuración global
import { global } from '../../../shared/config/global';

// Páginas
import { ReportMaterialPage } from '../report-material/report-material';
import { VisualReportPage } from '../../visual/branch-office/visual-report/visual-report';
import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-material-detail',
    templateUrl: 'material-detail.html',
})

export class MaterialDetailPage {

    @ViewChild( Content ) content: Content;

    // Atributos
    private material: any = null;
    private material_id: any = null;
    private form: any = {
        commentary: null
    };
    
    private session: any = null;
    
    // Representa el estado de carga cuando se actualiza la data
    private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    // Constructor
    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private events: Events,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private loading: LoadingController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'MaterialDetailMaterials' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'MaterialDetail', 'Materials' );

        let material_id = this.navParams.data.material_id;
        
        if ( !material_id ) {
            this.util.showAlert( 'Atención', 'Falta información del material' );
            
            this.navCtrl.pop();
            
            return;
        }
        
        this.material_id = material_id;
        
        this.material = await this.getMaterialDetail( material_id );

        this.session = await this.sessionProvider.getSession();

        this.content.resize();
    }

    // Método que se ejecuta cuando se cierra esta página
    ionViewDidLeave() {
        this.events.publish( 'materialDetailPoped' );
    }

    // Obtiene el detalle de un material
    async getMaterialDetail( material_id: any ) {
        // loading
		const loading = this.loading.create({ content: 'Obteniendo detalle...' });

		loading.present();
        
        let material = null;
        
        await this.request
            .get( ( config.endpoints.oldApi.get.material + material_id ), false )
            .then( ( response: any ) => {
                loading.dismiss();

                material = response.data;
            })
            .catch((error: any) => {
                loading.dismiss();
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.util.showAlert('Atención', 'No ha sido posible obtener el detalle del material');
            });
        return material;
    }

    // Refresca el detalle del material
    async refreshMaterial( refresher: any ) {
        if ( this.material_id ) this.material = await this.getMaterialDetail( this.material_id );
        
        refresher.complete();
    }

    // Agrega un comentario para el material
    addCommentary() {
        if ( !this.session ) {
            this.util.showAlert( 'Atención', 'Falta información de la sesión, no es posible agregar el comentario.' );
            
            return;
        }
        
        if ( !this.form.commentary ) {
            this.util.showAlert( 'Atención', 'Debe ingresar un comentario.' );
            
            return;
        }
        
        this.requesting = true;
        
        this.request
            .post( config.endpoints.oldApi.post.commentary, {
                comentario: this.form.commentary,
                reporte_id: this.material.campania.reporte_id,
                usuario_id: this.session.usuario.id,
                session_id: this.session.sessionid,
                uuid: 'local'
            }, false )
            .then( async ( response: any ) => {
                this.requesting = false;
                
                this.material = await this.getMaterialDetail( this.material_id );
                
                this.form = { commentary: null };
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting = false;
                
                this.util.showAlert( 'Atención', 'Comentario no agregado, intente nuevamente.' );
            });
    }

    // Navega hasta la vista para reportar el material
    navigateToReportMaterial() {
        this.navCtrl.push( ReportMaterialPage, { report_id: this.material.campania.reporte_id } );
    }

    // Navega hasta la campaña asociada
    showVisual() {
        this.navCtrl.push( VisualReportPage, { report_id: this.material.campania.visual_reporte_id, fromMaterial: true } );
    }
}
