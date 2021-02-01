import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, Content } from 'ionic-angular';
import { GoogleChartComponent, Ng2GoogleChartsModule } from 'ng2-google-charts';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

// Páginas
import { AreaDetailRipleyPage } from './area-detail-ripley/area-detail-ripley';
import { RankingKpiPage } from '../../components/ranking/ranking';

// Configuración del componente
import { config } from './kpi-ripley.config'

// Configuración global
import { global } from '../../../../shared/config/global';
import { IndicatorDepartmentsRipleyPage } from "./indicator-departments-ripley/indicator-departments-ripley";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@IonicPage()
@Component({
    selector: 'page-kpi-ripley',
    templateUrl: 'kpi-ripley.html',
    providers: [GoogleChartComponent]
})

export class KpiRipleyPage {

    @ViewChild(Content) content: Content;

    // Atributos
    private areas: any = null;
    private zones: any = [];
    private branch_offices: any = [];
    private form: any = {
        request_id: null, // Representa el id de la zona o sucursal a consultar
        charge: null
    };
    private selected_zone: any = 'Todas';
    private selected_branch_office: any = 'Todas';
    private session: any = null;
    private fulfillments: any = null;
    private chartObject: any = null;
    private current_fulfillment: any = null;
    private charge: any = null;
    private current_date: any = null;

    // Representa el estado de carga cuando se actualiza la data
    private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    // diccionario
    private sucursales: string;

    // Constructor
    constructor(private navCtrl: NavController,
        private googleChart: GoogleChartComponent,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'KpiRipley' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'KpiRipley', 'KPI' );

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursales = dictionary['Sucursales']
        } );
        
        this.getInitData();
    }

    // Actualiza la información de la vista
    async refreshKpi(refresher: any) {
        // Obtenemos las áreas
        this.areas = await this.getAreas();

        if (!this.areas) {
            refresher.complete();
            return;
        }

        // Obtenemos el cumplimiento general
        this.fulfillments = await this.getFulfillments();

        this.chartObject = this.getChartObject();

        // Obtenemos el cumplimiento actual
        this.current_fulfillment = await this.getCurrentFulfillment();

        refresher.complete();
    }

    // Llama a los servicios que traen la data y la presentan como información
    async getInitData() {

        this.requesting = true;

        // Obtenemos el cargo del usuario actual
        if (!this.charge) {
            this.charge = await this.getChargeAndSession();
            if (!this.charge) {
                this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI, Falta información del usuario.');
                this.requesting = false;
                return;
            }
        }

        this.form.charge = this.charge;

        // Si el usuario es cargo sucursal, asignamos al request_id a la primera sucursal (NO DEBERÍA TENER MÁS DE 1)
        if (this.charge === 'sucursal') {
            if (!this.session.sucursales || !this.session.sucursales.length) {
                this.util.showAlert('Alerta', 'No tiene una sucursal asociada');
                this.requesting = false;
                return;
            }
            this.form.request_id = this.session.sucursales[0];
        } else if (this.charge === 'zona') {
            // Si el zonal no tiene zona paramos la ejecución de este método
            if (!this.session.zona_id) {
                this.util.showAlert('Alerta', 'No tiene una zona asociada');
                this.requesting = false;
                return;
            }
            // Si tiene zona, asignamos como primer request_id la id de su zona y obtenemos las zonas para filtrar sus sucursales
            // No hay un servicio para obtener las sucursales por zonas
            this.form.request_id = this.session.zona_id;
            this.zones = await this.getZones();
            if (this.zones.length) {
                // Buscamos la zona del usuario
                let zone = _.find(this.zones, { id: this.session.zona_id });
                if (zone) this.branch_offices = zone.sucursales;
            }
        } else if (this.charge === 'pais') {
            this.zones = await this.getZones();
        }

        // Obtenemos las áreas
        this.areas = await this.getAreas();

        if (!this.areas) {
            this.requesting = false;
            return;
        }

        let current_date = _.find(this.areas.fechas, {
            mes: 'Actual'
        });
        if (current_date) this.current_date = current_date.fecha;

        // Obtenemos el cumplimiento general
        this.fulfillments = await this.getFulfillments();

        this.chartObject = this.getChartObject();

        // Obtenemos el cumplimiento actual
        this.current_fulfillment = await this.getCurrentFulfillment();

        this.requesting = false;

        this.content.resize();
    }

    // Obtiene las áreas
    async getAreas() {
        let area = null;
        await this.request
            .get(config.endpoints.newApi.get.areas + this.getQueryParams(), true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data && response.data.indicadores) {
                        area = response.data;
                    } else {
                        this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
                    }
                } catch (e) { this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI'); }
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
            });
        return area;
    }

    // Obtiene los cumplimientos
    async getFulfillments() {
        let fulfillments = null;
        let query_params = this.getQueryParams();
        await this.request
            .get(config.endpoints.newApi.get.fulfillments + (query_params ? query_params : '?tipo=pais'), true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data) {
                        fulfillments = response.data;
                    } else {
                        this.util.showAlert('Alerta', 'No ha sido posible obtener los cumplimientos');
                    }
                } catch (e) {
                    this.util.showAlert('Alerta', 'No ha sido posible obtener los cumplimientos');
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener los cumplimientos');
            });
        return fulfillments;
    }

    // Retorna el cargo del usuario actual y obtiene la sesión
    async getChargeAndSession() {
        let charge = null;
        await this.sessionProvider
            .getSession()
            .then((response: any) => {
                this.session = response.usuario;
                charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'sucursal' : (response.usuario.jerarquia < 100 ? 'zona' : 'pais'));
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible verificar su cargo, intente nuevamente');
            });
        return charge;
    }

    // Retorna el objeto que contiene la información para graficar
    getChartObject() {
        let chart: any = null;
        try {
            let chartData = [];

            for (let index = 0; index < this.fulfillments.categorias.length; index++) {
                let country = (!this.fulfillments.pais || this.fulfillments.pais === 'undefined') ? 0 : this.fulfillments.pais.valores[index];
                let branch_office = (!this.fulfillments.sucursal || this.fulfillments.sucursal === 'undefined') ? 0 : this.fulfillments.sucursal.valores[index];
                let zonal = (!this.fulfillments.zona || this.fulfillments.zona === 'undefined') ? 0 : this.fulfillments.zona.valores[index];

                chartData[index] = {
                    c: [{
                        v: this.fulfillments.categorias[index]
                    }, {
                        v: branch_office,
                        f: branch_office + '%'
                    }, {
                        v: zonal,
                        f: zonal + '%'
                    }, {
                        v: country,
                        f: country + '%'
                    }]
                };
            }
            chart = {
                dataTable: {
                    cols: [
                        { id: 1, label: 'Mes', type: 'string' },
                        { id: 2, label: 'Tú sucursal', type: 'number' },
                        { id: 3, label: 'Tú zona', type: 'number' },
                        { id: 4, label: 'País', type: 'number' }
                    ],
                    rows: chartData
                },
                options: {
                    // title: 'Cumplimiento últimos 3 Meses',
                    title: '',
                    series: {
                        0: {
                            color: "#142421",
                            visibleInLegend: this.areas.indicadores.cabeceras.ponderado_sucursal
                        },
                        1: {
                            color: "#E52F1C",
                            visibleInLegend: this.areas.indicadores.cabeceras.ponderado_zona
                        },
                        2: {
                            color: "#FDBF42",
                            visibleInLegend: this.areas.indicadores.cabeceras.ponderado_pais
                        }
                    },
                    height: 280,
                    legend: {
                        position: 'bottom',
                        maxLines: 3
                    },
                    hAxis: {
                        title: ''
                    },
                    vAxis: {
                        title: 'Cumplimiento %',
                        format: '#'
                    },
                    chartArea: {
                        right: '0',
                        left: '40'
                    },
                    tooltip: {
                        isHtml: true,
                        trigger: 'focus'
                    }
                },
                chartType: 'ColumnChart'
            };
        } catch (e) { }
        return chart;
    }

    // Muestra el detalle de un área
    showAreaDetail(area: any) {
        this.navCtrl.push(AreaDetailRipleyPage, { area: area, filters: this.form, charge: this.charge });
    }

    // Solicita al servicio la lista de zonas
    async getZones() {
        let zones = [];
        await this.request
            .get(config.endpoints.newApi.get.zones, true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data) {
                        zones = response.data;
                    } else {
                        this.util.showAlert('Alerta', 'No ha sido posible obtener las zonas');
                    }
                } catch (e) {
                    this.util.showAlert('Alerta', 'No ha sido posible obtener las zonas');
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener las zonas');
            });
        return zones;
    }

    // Se activa cuando la zona seleccionada cambia
    async zoneChanged() {
        this.content.resize();
        if (this.selected_zone === 'Todas') {
            this.form.charge = 'pais';
            this.form.request_id = null;
            this.branch_offices = [];
        } else {
            this.branch_offices = this.selected_zone.sucursales;
            this.form.charge = 'zona';
            this.form.request_id = this.selected_zone.id;
        }
        this.selected_branch_office = 'Todas';

        this.requesting = true;

        // Obtenemos las áreas
        this.areas = await this.getAreas();

        if (!this.areas) {
            this.requesting = false;
            return;
        }

        // Obtenemos el cumplimiento general
        this.fulfillments = await this.getFulfillments();

        this.chartObject = this.getChartObject();

        // Obtenemos el cumplimiento actual
        this.current_fulfillment = await this.getCurrentFulfillment();

        this.requesting = false;
    }

    // Se activa cuando la sucursal seleccionada cambia
    async branchOfficeChanged() {
        this.content.resize();
        // Si la sucursal es 'Todas' asignamos el valor de la zona en caso de que exista
        if (this.selected_branch_office === 'Todas') {
            if (this.charge === 'pais') {
                if (this.selected_zone.id) {
                    this.form.charge = 'zona';
                    this.form.request_id = this.selected_zone.id;
                } else {
                    this.form.charge = 'pais';
                    this.form.request_id = null;
                }
            } else if (this.charge === 'zona') {
                this.form.charge = 'zona';
                this.form.request_id = this.session.zona_id;
            }
        } else {
            this.form.charge = 'sucursal';
            this.form.request_id = this.selected_branch_office.id;
        }

        this.requesting = true;

        // Obtenemos las áreas
        this.areas = await this.getAreas();

        if (!this.areas) {
            this.requesting = false;
            return;
        }

        // Obtenemos el cumplimiento general
        this.fulfillments = await this.getFulfillments();

        this.chartObject = this.getChartObject();

        // Obtenemos el cumplimiento actual
        this.current_fulfillment = await this.getCurrentFulfillment();

        this.requesting = false;
    }

    // Retorna los parámetros para filtrar los KPIS
    getQueryParams() {
        let query_params = '';
        if (this.form.charge !== 'pais') {
            query_params = '?tipo=' + this.form.charge + '&dataId=' + this.form.request_id;
        }
        return query_params;
    }

    // Retorna el cumplimiento actual
    async getCurrentFulfillment() {
        let current_fulfillment = null;
        await this.request
            .get(config.endpoints.newApi.get.current_period + this.getQueryParams(), true)
            .then((response: any) => {
                if (response && response.data) current_fulfillment = response.data;
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener el cumplimiento actual');
            });
        return current_fulfillment;
    }

    // Navega hasta la vista de Ranking
    showRanking() {
        this.navCtrl.push(RankingKpiPage, { filters: { type: null, value: null } });
    }

    /**
     * Navegación a vista de indicadores
     */
    showTachometer() {
        this.navCtrl.push(IndicatorDepartmentsRipleyPage);
    }
}
