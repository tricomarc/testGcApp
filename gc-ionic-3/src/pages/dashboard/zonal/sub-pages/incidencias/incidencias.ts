import { Component } from '@angular/core';
import { IonicPage, MenuController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

import { RequestProvider } from "../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { SessionProvider } from "../../../../../shared/providers/session/session";

import { global } from "../../../../../shared/config/global";
import { config } from "../../estadisticas.config";

import { BranchOfficeStatisticsIncidentDetailComponent } from './components/detail/incidents-statistics-branchoffice-detail';
import { OwnIncidentsComponent } from './components/own-incidents/own-incidents';
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'page-incidencias-details',
    templateUrl: 'incidencias.html',
})
export class IncidenciasDetailsPage {

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    /* Estadísticas V2, se va migrando por módulo */

    private filters: any = {
        to: null,
        from: null,
        zone_id: null,
        level: null,
    };

    private statistics: any = null;
    private requesting: any = false;

    private charge: string = null;

    /* Estadísticas V2, se va migrando por módulo */

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private request: RequestProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private session: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'IncidenciasDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IncidenciasDetails', 'Estadisticas' );

        this.initStatistics();
    }
    
    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }
    
    // Inicializa los filtros y solicita la estadística
    async initStatistics() {

        // Obtenemos el cargo del usuario actual
        this.charge = await this.util.getUserCharge();

        // Solamente zonales y gerentes (país) pueden acceder a esta vista (Jamás un usuario distinto debería llegar acá)
        if (this.charge !== 'zonal' && this.charge !== 'country' && this.charge !== 'admin') {
            this.util.showToast('No tiene permisos para acceder a esta vista', 3000);
            this.navCtrl.pop();
            return;
        }

        // Guardamos los filtros de fechas que vienen por parámetros
        let from_param: any = this.navParams.data.from;
        let to_param: any = this.navParams.data.to;

        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);
        let session: any = await this.session.getSession();

        this.filters = {
            to: (to_param ? to_param : this.getFormatedDate(to)),
            from: (from_param ? from_param : this.getFormatedDate(from)),
            zone_id: (this.navParams.data.zone_id ? this.navParams.data.zone_id : null),
            level: 'dual'
        };

        if (this.charge === 'zonal') {
            this.filters.zone_id = ((session && session.usuario) ? session.usuario.zona_id : null)
            if (!this.filters.zone_id) {
                this.util.showAlert('Alerta', 'No tienes una zona asociada');
                this.navCtrl.pop();
                return;
            }
        }

        await this.getIncidentsStatistics(false);
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd
    getFormatedDate(date: any) {
        let year = date.getFullYear();
        let month = (date.getMonth() + 1);
        let day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }

    // Obtiene las estadísticas con los filtros seleccionados
    async getIncidentsStatistics(is_refresher: boolean) {
        if (!is_refresher) this.requesting = true;
        await this.request
            .get((config.endpoints.get.incidencias + this.getQueryParams()), true)
            .then((response: any) => {
                this.requesting = false;
                try {
                    if (response && response.data) {
                        this.statistics = response.data;
                        return;
                    }
                    this.util.showToast('No ha sido posible obtener la estádistica', 30000);
                }
                catch (e) {
                    this.util.showToast('No ha sido posible obtener la estádistica', 30000);
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting = false;
                if (error && error.message) this.util.showToast(error.message, 3000);
                else this.util.showToast('No ha sido posible obtener la estádistica', 30000);
            });
    }

    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams() {
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.level}`;
        if (this.filters.zone_id) { params += ('&zona_id=' + this.filters.zone_id); }
        return params;
    }

    // Vuelve a solicitar la estadística con los filtros seleccionados
    refreshStatistics(refresher: any, is_refresher: boolean) {
        if (refresher) refresher.complete();
        this.getIncidentsStatistics(is_refresher);
    }

    // Muestra el detalle de estadística de una zona o sucursal
    showZoneOrBranchOfficeDetail(item: any) {
        let filters: any = {
            zone_id: null,
            from: this.filters.from,
            to: this.filters.to
        };

        // Si no tenemos zona_id, estamos como país
        if (!this.filters.zone_id) {
            filters.zone_id = item.id;
            this.navCtrl.push(IncidenciasDetailsPage, filters);
            return;
        }
        // Si tenemos zona, vamos al detalle de la sucursal
        this.navCtrl.push(BranchOfficeStatisticsIncidentDetailComponent, {
            branch_office_data: item,
            from: this.filters.from,
            to: this.filters.to
        });
    }

    // Muestra las incidencias propias del usuario actual
    showOwnIncidents() {
        this.navCtrl.push(OwnIncidentsComponent);
    }
}
