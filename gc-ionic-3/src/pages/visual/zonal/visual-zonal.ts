import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, MenuController, ActionSheetController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';

// Páginas
import { VisualZonalDetailPage } from './visual-zonal-detail/visual-zonal-detail';
import { VisualDetailsPage } from '../../dashboard/zonal/sub-pages/visual/visual';
import { VisualRevisionPage } from '../branch-office/visual-revision/visual-revision';
import { RankingVisualPage } from './ranking/ranking-visual';

// Configuración del componente
import { config } from './visual-zonal.config';

// Configuración global
import { global } from '../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-visual-zonal',
    templateUrl: 'visual-zonal.html',
})

export class VisualZonalPage {

    // Atributos
    private visuals: any = null;
    private revision: any = null;
    private session: any = null;
    // Representa el estado de carga cuando se actualiza la data
    private requesting: boolean = false;
    private show_ranking: any = global.show_ranking;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private reporte: boolean = false;
    // Constructor
    constructor(private navCtrl: NavController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private actionSheet: ActionSheetController,
        private sessionProvider: SessionProvider,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    async ionViewWillEnter() {
        this.menu.enable(true, "menu");
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'VisualZonalVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualZonal', 'Visual' );

        this.sessionProvider.getSession()
            .then((response: any) => {
                if (response) this.session = response;
                this.showReportes(response.usuario['jerarquia']);
            });
        this.visuals = await this.getVisualList(false);
        this.revision = await this.getRevision(false);
    }

    showReportes(jerarquia){
        if(parseInt(jerarquia) == 100 || parseInt(jerarquia) == 101){
            this.reporte = true;
        }
    }
    
    // Trae la lista de visuales
    async getVisualList(isRefresh: boolean) {
        if (!isRefresh) this.requesting = true;
        let visuals = null;
        await this.request
            .post(config.endpoints.newApi.post.list, {}, true)
            .then((response: any) => {
                if (response && response.data) {
                    visuals = response.data;
                } else {
                    this.util.showAlert('Atención', 'No ha sido posible obtener la lista de campañas');
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No ha sido posible obtener la lista de campañas');
            });
        this.requesting = false;
        return visuals;
    }

    // Obtiene la cantidad de revisiones pendientes de visuales
    async getRevision(isRefresh: boolean) {
        if (!isRefresh) this.requesting = true;
        let revision = null;
        await this.request
            .get(config.endpoints.newApi.get.revision, true)
            .then((response: any) => {
                if (response && response.data) {
                    revision = response.data;
                }
            })
            .catch((error: any) => {
            });
        this.requesting = false;
        return revision;
    }

    // Muestra el detalle de un visual
    showVisualDetail(visual: any) {
        this.navCtrl.push(VisualZonalDetailPage, { visual_id: visual.visual_id });
    }

    // Actualiza la lista de visuales
    async refreshVisuals(refresher: any) {
        this.visuals = await this.getVisualList(true);
        this.revision = await this.getRevision(true);
        refresher.complete();
    }

    // Muestra las estadísticas de un visual
    showVisualStats(visual: any) {
        if (!this.session) {
            this.util.showAlert('Atención', 'Falta información de la sesión, no es posible obtener la estadística.');
            return;
        }
        this.navCtrl.push(VisualDetailsPage, {
            visuals_id: [{
                id: parseInt(visual.visual_id),
                nombre: visual.visual_nombre
            }],
            zona_id: this.session.usuario.zona_id,
            filters: {}
        });
    }

    // Navega hasta la vista de revisión de visuales
    showRevisions() {
        this.navCtrl.push(VisualRevisionPage);
    }

    // Muestra la vista con el ranking de visual
    showRanking() {
        this.navCtrl.push(RankingVisualPage);
    }

    showActionSheet(){
        this.actionSheet.create({
            title: 'Reportes',
            buttons: [
                {
                    text: 'Reporte de uso',
                    role: 'reporteuso',
                    handler: () => {
                        this.navCtrl.push('ReporteUsabilidadPage');
                    }
                }
            ]

        }).present();
    }
}
