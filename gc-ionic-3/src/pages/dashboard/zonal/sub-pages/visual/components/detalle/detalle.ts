import { Component } from '@angular/core';
import {
    IonicPage,
    MenuController,
    NavController,
    NavParams
} from 'ionic-angular';

import { config } from "../../../../estadisticas.config";
import * as _ from 'lodash';

import { RequestProvider } from "../../../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../../../shared/providers/util/util";
import { global } from "../../../../../../../shared/config/global";

import { VisualReportPage } from '../../../../../../visual/branch-office/visual-report/visual-report';
import { globalConfig } from '../../../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'page-details-visual',
    templateUrl: 'detalle.html',
})
export class DetailsVisualSubsidiaryPage {

    private branch_office: any = null;
    private branch_office_stats: any = null;
    private visuals: any = [];

    private search_visuals: any = [];

    private requesting: any = {
        stats: false,
        visuals: false
    };

    private filters: any = {
        from: null,
        to: null,
        visuals: []
    };

    private select_visuals: any = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private request: RequestProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'DetailsVisualSubsidiaryEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailsVisualSubsidiary', 'Estadisticas' );

        // Guardamos los filtros de fechas que vienen por parámetros
        let from_param: any = this.navParams.data.from;
        let to_param: any = this.navParams.data.to;

        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);

        this.filters.to = (to_param ? to_param : this.getFormatedDate(to));
        this.filters.from = (from_param ? from_param : this.getFormatedDate(from));

        this.select_visuals = this.navParams.data.select_visuals;
        this.search_visuals = this.select_visuals;

        this.branch_office = this.navParams.data.branch_office;

        // Llamamos antes esta función para obtener los visuals de esta sucursal,
        // lamentablemente vienen en el mismo servicio de la estadística
        await this.getBranchOfficeStats();

        this.filters.visuals = this.validateFilteredVisuals(this.navParams.data.filtered_visuals);

        this.getBranchOfficeStats();
        this.getVisualsReport();
    }

    // Retorna un arreglo con visuales filtrados de acuerdo a los asignados a esta sucursal
    validateFilteredVisuals(visuals) {
        return _.filter(visuals, (visual) => {
            return _.some(this.select_visuals, ['id', parseInt(visual.id)]);
        });
    }

    // Obtiene los reportes de esta sucursal
    getVisualsReport() {
        this.requesting.visuals = true;
        this.request
            .post(config.endpoints.post.visualDetalleSucursal, this.getVisualReportFilters(), true)
            .then((response: any) => {
                this.requesting.visuals = false;
                try {
                    if (response && response.data) {
                        this.visuals = _.orderBy(response.data, [(report) => { return ((report.nota === null || report.nota === undefined) ? -1 : report.nota) }], ['desc']);
                    }
                }
                catch (e) {
                    this.util.showToast('No hemos podido obtener los reportes de esta sucursal', 5000);
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting.visuals = false;
                this.util.showToast('No hemos podido obtener los reportes de esta sucursal', 5000);
            });
    }

    // Muestra el detalle de un reporte
    showReport(report) {
        this.navCtrl.push(VisualReportPage, { fromStats: true, report_id: report.id, branchOfficeName: this.branch_office.nombre });
    }

    // Obtiene la estadística de la sucursal
    async getBranchOfficeStats() {
        this.requesting.stats = true;
        await this.request
            .get(config.endpoints.get.visuales + this.getQueryParams(), true)
            .then((response: any) => {
                this.requesting.stats = false;
                this.branch_office_stats = response.data;
                this.select_visuals = response.data.visuales;
                this.search_visuals = this.select_visuals;

                // this.filters.visuals = this.validateFilteredVisuals(this.navParams.data.filtered_visuals);
            })
            .catch((error) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.requesting.stats = false;
                this.util.showToast('No hemos podido traer la estadística de esta sucursal', 5000);
            });
    }

    // Retorna los parámetros para filtrar la estadística
    getQueryParams() {
        let visuals_id = '';

        _.forEach(this.filters.visuals, (visual) => {
            visuals_id += '&visuales_id[]=' + visual.id;
        });

        return `?nivel=dual&sucursales_id=${this.branch_office.id}&desde=${this.filters.from}&hasta=${this.filters.to}${visuals_id}`;
    }

    // Cada vez que se cambia un filtro, vuelve a pedir la información
    applyFilters() {
        this.getVisualsReport();
        this.getBranchOfficeStats();
    }

    // Retorna un objeto con los filtros para la función getVisualsReport
    getVisualReportFilters() {
        let filters = {
            desde: this.filters.from,
            hasta: this.filters.to,
            sucursal_id: this.branch_office.id,
            visuales_id: _.map(this.filters.visuals, 'id')
        };

        return filters;
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd 
    getFormatedDate(date: any) {
        let year = date.getFullYear();
        let month = (date.getMonth() + 1);
        let day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }

    // Función que se ejecuta cuando se busca en el componente ionic-selectable
    onSearch(search: any) {
        if(search.text) {
            this.search_visuals = _.filter(this.select_visuals, (visual) => {
                return _.includes(this.util.cleanText(visual.nombre), this.util.cleanText(search.text));
            });
            return;
        }
        this.search_visuals = this.select_visuals;
    }
}
