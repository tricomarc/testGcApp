import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ModalController, Events} from 'ionic-angular';

import * as _ from 'lodash';

// Páginas
import {VisualRevisionDetailPage} from '../visual-revision-detail/visual-revision-detail';

// Proveedores
import {UtilProvider} from '../../../../shared/providers/util/util';
import {RequestProvider} from '../../../../shared/providers/request/request';

// Configuración
import {config} from './visual-revision.config';

// Configuración global
import {global} from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-visual-revision',
    templateUrl: 'visual-revision.html',
})
export class VisualRevisionPage {

    private visuals: any = [];
    private visuals_view: any = [];
    private branch_offices: any = [];
    private filters: any = {
        branch_office: 'Todas'
    };
    private requesting: boolean = false;
    private locked_buttons: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(private navCtrl: NavController,
                private navParams: NavParams,
                private modal: ModalController,
                private events: Events,
                private util: UtilProvider,
                private request: RequestProvider,
                private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'VisualRevisionVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualRevision', 'Visual' );

        let visuals = await this.getVisuals(false);
        this.visuals = visuals;
        this.visuals_view = visuals;

        // Cada vez que llaman al evento "visualReportRevisionPoped" se vuelve a solicitar los visuales
        this.events.subscribe('visualReportRevisionPoped', async () => {
            let visuals = await this.getVisuals(false);
            this.visuals = visuals;
            this.visuals_view = visuals;
        });
    }

    // Cada vez que se cierra esta vista, activa el evento "visualReportPoped"
    ionViewWillLeave() {
        this.events.publish('visualReportPoped');
    }

    // Bloqueamos los botones por 1.5 segundos
    blockButtons() {
        this.locked_buttons = true;
        setTimeout(() => {
            this.locked_buttons = false;
        }, 1500);
    }

    // Retorna la lista de visuales a revisar
    async getVisuals(isRefresher: boolean) {
        if (!isRefresher) this.requesting = true;
        let visuals = [];
        await this.request
            .get(config.endpoints.newApi.get.revision, true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data) {
                        visuals = response.data.visuales;
                        this.branch_offices = [];
                        _.forEach(visuals, (visual) => {
                            if (!_.includes(this.branch_offices, visual.nombre_sucursal)) this.branch_offices.push(visual.nombre_sucursal);
                        });
                        this.filters.branch_office = 'Todas';
                    } else {
                        this.util.showAlert('Atención', 'No ha sido posible obtener la lista de campañas.');
                    }
                } catch (e) {
                    this.util.showAlert('Atención', 'No ha sido posible obtener la lista de campañas.');
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No ha sido posible obtener la lista de campañas.');
            });
        if (!isRefresher) this.requesting = false;
        return visuals;
    }

    // Se activa cada vez que se cambia el filtro "sucursal"
    applyFilters() {
        // Si el filtro es 'Todas' mostramos todos los visuales
        if (this.filters.branch_office === 'Todas') {
            this.visuals_view = this.visuals;
            return;
        }
        let visuals = [];
        _.forEach(this.visuals, (visual) => {
            // Obtenemos los visuales
            visuals = _.filter(this.visuals, {nombre_sucursal: this.filters.branch_office});
        });
        this.visuals_view = visuals;
    }

    // Navega hasta el detalle de una revisión para un visual
    showRevisionDetail(visual: any) {
        this.navCtrl.push(VisualRevisionDetailPage, {
            visual_id: visual.id,
            report_id: visual.reporte_id,
            branch_office_id: visual.sucursal_id
        });
    }

    // Actualiza la lista de visuales
    async refreshVisuals(refresher: any) {
        let visuals = await this.getVisuals(true);
        this.visuals = visuals;
        this.visuals_view = visuals;
        refresher.complete();
    }
}