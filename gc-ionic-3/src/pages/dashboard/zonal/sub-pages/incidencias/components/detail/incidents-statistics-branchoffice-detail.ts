import { Component } from '@angular/core';
import { MenuController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

import { RequestProvider } from "../../../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../../../shared/providers/util/util";
import { SessionProvider } from "../../../../../../../shared/providers/session/session";

import { global } from "../../../../../../../shared/config/global";

import { DetailIncidentPage } from '../../../../../../incidents/branch-office/sub-pages/detail-incident/detail-incident';
import { globalConfig } from '../../../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'incidents-statistics-branchoffice-detail-component',
    templateUrl: 'incidents-statistics-branchoffice-detail.html',
})
export class BranchOfficeStatisticsIncidentDetailComponent {

	private branch_office: any = null;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private filters: any = {
        to: null,
        from: null,
        zone_id: null,
        level: null
    };

    private statistics: any = null;

    private requesting: boolean = false;

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private menu: MenuController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'BranchOfficeStatisticsIncidentEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'BranchOfficeStatisticsIncidentDetail', 'Estadisticas' );

        if (!this.navParams.data.branch_office_data) {
            this.util.showToast('Falta información de la sucursal, intente nuevamente', 3000);
            return;
        }

        this.branch_office = this.navParams.data.branch_office_data;

        // Guardamos los filtros de fechas que vienen por parámetros
        let from_param: any = this.navParams.data.from;
        let to_param: any = this.navParams.data.to;

        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);
        let session: any = await this.session.getSession();

        this.filters = {
            to: (to_param ? to_param : this.getFormatedDate(to)),
            from: (from_param ? from_param : this.getFormatedDate(from))
        };

        this.getBranchOfficeStatistics(false);
    }

    // Obtiene la estadística de una sucursal y sus incidencias
    getBranchOfficeStatistics(is_refresher: boolean) {
        if (!is_refresher) this.requesting = true;
        this.request
            .get('/incidencias/estadisticasSucursal' + this.getQueryParams(), true)
            .then((response: any) => {
                this.requesting = false;
                this.statistics = response.data;
                if(this.statistics && this.statistics.incidencias && this.statistics.incidencias.length) {
                    _.forEach(this.statistics.incidencias, (incident) => {
                        if(incident.status === 'En Proceso' && incident.fecha_estimada && new Date() > new Date(incident.fecha_estimada)) {
                            incident.status = 'Vencida';
                        }
                        incident.status_info = this.getStatusInfo(incident.status);
                    });
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting = false;
                this.util.showAlert('Atención', 'No hemos podido obtener la información de la sucursal, intente nuevamente.');
            });
    }

    // Retorna los parámetros para la consulta de la estadística
    getQueryParams() {
        return `?sucursalId=${this.branch_office.id}&desde=${this.filters.from}&hasta=${this.filters.to}`;
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd
    getFormatedDate(date: any) {
        let year = date.getFullYear();
        let month = (date.getMonth() + 1);
        let day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }

    // Navega hasta el detalle de una incidencia
    showIncident(incident: any) {
        this.navCtrl.push(DetailIncidentPage, { incident_id: incident.id, status_info: incident.status_info, from_statistics: true });
    }

    // Vuelve a solicitar la estadística con los filtros seleccionados
    refreshStatistics(refresher: any, is_refresher: boolean) {
        if (refresher) refresher.complete();
        this.getBranchOfficeStatistics(is_refresher);
    }

    // Retorna el color/clase y el ícono a partir del estado de la incidencia
    getStatusInfo(status: string) {
        if (status === 'Vencida' || status === 'Anulada' || status === 'Rechazada') return { color: 'danger', icon: 'md-alert' };
        if (status === 'Resuelta') return { color: 'balanced', icon: 'md-checkmark' };
        if (status === 'En Proceso') return { color: 'energized', icon: 'ios-clock-outline' };
        if (status === 'Solicitada' || status === 'En espera' || status === 'Término Tienda') return { color: 'assertive', icon: 'md-alert' };
        return { color: 'default', icon: 'md-alert' };
    }
}