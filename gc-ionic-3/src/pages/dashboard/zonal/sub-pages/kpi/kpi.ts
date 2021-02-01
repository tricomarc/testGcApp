import { ApplicationRef, Component } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { config } from "../../estadisticas.config";
import { RequestProvider } from "../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { global } from "../../../../../shared/config/global";
import { DetailsKpiSubsidiaryPage } from "./components/detalle/detalle";
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'page-kpi-details',
    templateUrl: 'kpi.html',
})
export class KpiDetailsPage {

    private filters: any = {
        period: null,
        type: '',
        dataId: ''
    };

    private statistics: any = null;
    private requesting: boolean = false;

    params = 'zona=:tipo&id=:id&fecha=:fecha';
    filtros = {
        tipo: this.navParams.data.tipo,
        id: this.navParams.data.id,
        fecha: this.navParams.data.fecha
    };
    mesSeleccionado = null;
    selectedDate = null;
    indicadores = [];
    selectFecha = [];
    sucursales = [];
    zonas = [];
    fechas = (this.mesSeleccionado == null) ? "Actual" : this.mesSeleccionado;
    fromSelect = false;
    zone: String = "";
    pais = 0;
    zona = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'KpiDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'KpiDetails', 'Estadisticas' );
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        if (!_.isNull(this.filtros.fecha) && !_.isUndefined(this.filtros.fecha)) {
            this.selectedDate = this.filtros.fecha;
            this.fromSelect = true;
        }
        this.pais = this.navParams.data.pais;
        this.zona = this.navParams.data.zona;
        this.getKpis();
    }

    /**
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getKpis() {
        let data = {};
        var params = this.buildParams();
        await this.request
            .get(config.endpoints.get.detalleKpiAreas + params, true)
            .then((response: any) => {
                try {
                    this.indicadores = response.data.indicadores;
                    this.fechas = (this.mesSeleccionado == null) ? "Actual" : this.mesSeleccionado;
                    this.selectFecha = response.data.fechas;
                    this.sucursales = response.data.sucursales;
                    this.zonas = response.data.zonas;
                    this.zone = response.data.nombre;
                    if (!this.fromSelect) {
                        this.selectedDate = this.selectFecha[(this.selectFecha.length - 1)].fecha;
                    } else {
                        _.forEach(this.selectFecha, (fecha) => {
                            if (fecha.mes == this.selectedDate.mes) {
                                this.selectedDate = fecha.fecha;
                            }
                        });
                    }
                    this.fromSelect = false;
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Construye url de servicios para envio segun los filtros activados
     * @returns {string}
     */
    buildParams() {
        var params = "";
        var add = 0;
        if (!_.isNull(this.filtros.tipo) && !_.isUndefined(this.filtros.tipo) && !_.isNull(this.filtros.id) && !_.isUndefined(this.filtros.id)) {
            if (add == 0) {
                params = params + "?tipo=" + this.filtros.tipo;
            } else {
                params = params + "&tipo=" + this.filtros.tipo;
            }
            add++;
        }
        if (!_.isNull(this.filtros.id) && !_.isUndefined(this.filtros.id)) {
            if (add == 0) {
                params = params + "?dataId=" + this.filtros.id;
            } else {
                params = params + "&dataId=" + this.filtros.id;
            }
            add++;
        }
        if (!_.isNull(this.filtros.fecha) && !_.isUndefined(this.filtros.fecha)) {
            if (add == 0) {
                params = params + "?fecha=" + this.filtros.fecha;
            } else {
                params = params + "&fecha=" + this.filtros.fecha;
            }
            add++;
        }
        return params
    }

    /**
     * Obtiene filtros de fechas para agregar en servicio
     * @param data
     */
    actualizarFecha = function(data) {
        this.mesSeleccionado = data.mes;
        if (data != "Todas") this.filtros.fecha = data;
        else this.filtros.fecha = null;
        this.fromSelect = true;
        this.getKpis();
    };

    /**
     * Redireccion a vista de estadisticas por area de kpi
     * @param area
     * @param date
     */
    goToDetails(area, date) {
        var foundDate = _.find(this.selectFecha, { fecha: date });
        if (!_.isUndefined(foundDate) && !_.isNull(foundDate)) this.navCtrl.push(DetailsKpiSubsidiaryPage, { area: area, date: foundDate });
        else this.navCtrl.push(DetailsKpiSubsidiaryPage, { area: area, date: date });
    }
}
