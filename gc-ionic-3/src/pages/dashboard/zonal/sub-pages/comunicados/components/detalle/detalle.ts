import { ApplicationRef, Component, ViewChild } from '@angular/core';
import {
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    ModalController,
    NavController,
    NavParams
} from 'ionic-angular';
import { config } from "../../../../estadisticas.config";
import * as _ from 'lodash';
import { Chart } from 'chart.js';
import { RequestProvider } from "../../../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../../../shared/providers/util/util";
import { SessionProvider } from "../../../../../../../shared/providers/session/session";
import { UserDetailsComunicadosPage } from "../user-details/user-details";
import { global } from "../../../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-details-comunicado',
    templateUrl: 'detalle.html',
})
export class DetailsComunicadosSubsidiaryPage {

    /* Nueva versión estadística checklist */

    private filters: any = null;

    /* Nueva versión estadística checklist */




    @ViewChild('doughnutCanvas') doughnutCanvas;
    @ViewChild('doughnutCanvas2') doughnutCanvas2;

    date = new Date();
    nombreModulo = "";
    filtros = {
        desde: this.navParams.data.desde ? this.navParams.data.desde + "" : new Date(this.date.getFullYear(), this.date.getMonth(), 1) + "",
        hasta: this.navParams.data.hasta ? this.navParams.data.hasta + "" : new Date() + "",
        sucursal_id: this.navParams.data.sucursal_id
    };
    detailsInfo1 = {
        'donaData': [85, 15],
        'donaLabel': ["Ventas Online", "Ventas en tienda"],
        'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
        'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
    };
    detailsInfo2 = {
        'donaData': [55, 45],
        'donaLabel': ["Ventas Online", "Ventas en tienda"],
        'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
        'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
    };
    comunicados = [];
    datos = [];
    sucursal: null;
    setting: boolean = false;
    mostrarSubgerente: boolean = false;
    mostrarZonal: boolean = false;
    endpoint = "";
    doughnutChart: any;
    doughnutChart2: any;
    total_comprension = 0;


    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        public modalCtrl: ModalController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private event: Events,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        this.getSettings();
    }

    

    ionViewWillEnter() {
        this.menu.enable(false, "menu");

    }

    /* Nueva versión estadística checklist */

    initializeStatistics() {
        // Obtenemos los filtros de fecha (primer día del mes hasta el día actual)
        let to = new Date();
        let from = new Date(to.getFullYear(), to.getMonth(), 1);
        let filters: any = this.navParams.data.filters;

        // Definimos los filtros
        this.filters = {
            from: ((filters && filters.from) ? filters.from : this.util.getFormatedDate(from)),
            to: ((filters && filters.to) ? filters.to : this.util.getFormatedDate(to)),
            zoneId: ((filters && filters.zoneId) ? filters.zoneId : null),
            nivel: 'dual',
            news: _.map(filters.news, 'id'),
            branchOfficeId: this.navParams.data.sucursal_id,
            typeId: filters.typeId
        };

        console.log(this.navParams)

        this.getDetails();
    }

    // Cada vez que se cambia el filtro de fechas, solicita la estadística
    changeDateFilters(event: any) {
        this.getDetails();
    }

    /* Nueva versión estadística checklist */

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'DetailsComunicadosSubsidiaryEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailsComunicadosSubsidiary', 'Estadisticas' );

        this.filtros['comunicados_id'] = this.navParams.data.comunicados_id ? this.navParams.data.comunicados_id : [];

        this.endpoint = config.endpoints.post.comunicadoDetalleSucursal;
        this.initializeStatistics();

        if (this.navParams.data.graphics) {
            this.total_comprension = this.navParams.data.graphics.total_comprension;
            //var dif1 = 100 - this.navParams.data.graphics.promedio_lectura;
            this.detailsInfo1 = {
                'donaData': [this.navParams.data.graphics.cantidad_lectura, (this.navParams.data.graphics.total_lectura - this.navParams.data.graphics.cantidad_lectura)],
                'donaLabel': ["Leidos", "No Leidos"],
                'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
            };
            //var dif2 = 100 - this.navParams.data.graphics.promedio_comprension;
            this.detailsInfo2 = {
                'donaData': [this.navParams.data.graphics.cantidad_comprension, (this.navParams.data.graphics.total_comprension - this.navParams.data.graphics.cantidad_comprension)],
                'donaLabel': ["Comprendidos", "No Comprendidos"],
                'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
            };
            this.buildChart();
        } else if (this.filters.branchOfficeId) {
            await this.getGraphics();
        }
    }

    /**
     * Se crean graficos segun parametros recibidos
     */
    buildChart() {
        this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
            type: 'doughnut',
            data: {
                labels: this.detailsInfo1['donaLabel'],
                datasets: [{
                    label: '% Leidos',
                    data: this.detailsInfo1['donaData'],
                    backgroundColor: this.detailsInfo1['backgroundColor'],
                    hoverBackgroundColor: this.detailsInfo1['hoverBackgroundColor']
                }]
            },
            options: {
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: true
                }
            }
        });

        this.doughnutChart2 = new Chart(this.doughnutCanvas2.nativeElement, {
            type: 'doughnut',
            data: {
                labels: this.detailsInfo2['donaLabel'],
                datasets: [{
                    label: '% Comprensión',
                    data: this.detailsInfo2['donaData'],
                    backgroundColor: this.detailsInfo2['backgroundColor'],
                    hoverBackgroundColor: this.detailsInfo2['hoverBackgroundColor']
                }]
            },
            options: {
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: true
                }
            }
        });
    }

    /**
     * Asignación de variables de sesion
     * @returns {Promise<void>}
     */
    async getSettings() {
        this.session.getSession().then(session => {
            let result = session;
            var suc = result["usuario"].sucursales_completo;
            var id = this.filtros.sucursal_id;
            suc = _.find(suc, { id: id });
            if (!_.isNull(suc) && !_.isUndefined(suc)) {
                this.sucursal = suc.nombre_real;
            }
        });
    }

    /**
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getDetails() {
        const loading = this.loading.create({ content: 'Obteniendo comunicados' });
        loading.present();
        let data = {};
        let sendFilters = this.filtros;
        /* let newDesde = new Date(sendFilters.desde);
         newDesde.setDate(newDesde.getDate() + 2);
         sendFilters.desde = this.util.dateToYMD(newDesde);
 
         let newHasta = new Date(sendFilters.hasta);
         newHasta.setDate(newHasta.getDate() + 1);
         sendFilters.hasta = this.util.dateToYMD(newHasta);*/


        let body: any = {
            desde: this.filters.from,
            hasta: this.filters.to,
            sucursal_id: this.navParams.data.sucursal_id,
            comunicados_id: this.filters.news
        };

        await this.request
            .post(this.endpoint, body, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                        this.datos = response.data;

                    }
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Redireccion a vista de detalles por usuario
     * @param id_usuario
     * @param nombre_usuario
     */
    redirectToUser(id_usuario, nombre_usuario) {
        var params = {
            desde: this.filtros.desde + "",
            hasta: this.filtros.hasta + "",
            usuario_id: id_usuario,
            nombre_usuario: nombre_usuario,
            filters: this.filters
        };
        this.navCtrl.push(UserDetailsComunicadosPage, params);
    }

    /**
     * Actualiza formato de fecha para IOS
     * @param date
     * @returns {string}
     */
    formatDate(date) {
        let send = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        return this.util.dateToYMD(send);
    }

    async getGraphics() {
        await this.request
            .get(config.endpoints.get.comunicados + this.getQueryParams(), true)
            .then((response: any) => {
                if (
                    response
                    && response.data
                    && response.data.bot
                    && response.data.bot.length
                ) {
                    let branchOffice: any = _.find(response.data.bot, (bo: any) => {
                        return this.filters.branchOfficeId === bo.id;
                    });
                    if (branchOffice) {
                        this.navParams.data.graphics = branchOffice.datos;
                        this.total_comprension = this.navParams.data.graphics.total_comprension;
                        //var dif1 = 100 - this.navParams.data.graphics.promedio_lectura;
                        this.detailsInfo1 = {
                            'donaData': [this.navParams.data.graphics.cantidad_lectura, this.navParams.data.graphics.total_lectura],
                            'donaLabel': ["Leidos", "No Leidos"],
                            'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                            'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
                        };
                        //var dif2 = 100 - this.navParams.data.graphics.promedio_comprension;
                        this.detailsInfo2 = {
                            'donaData': [this.navParams.data.graphics.cantidad_comprension, this.navParams.data.graphics.total_comprension],
                            'donaLabel': ["Comprendidos", "No Comprendidos"],
                            'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                            'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
                        };
                        this.buildChart();
                    }
                }
            })
            .catch((error: any) => { });
        return true;
    }

    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams() {
        let params = `?desde=${this.filters.from}&hasta=${this.filters.to}&nivel=${this.filters.nivel}&tipo_id=${this.filters.typeId}`;
        if (this.filters.zoneId) {
            params += ('&zona_id=' + this.filters.zoneId);
        }
        if (this.filters.news && this.filters.news.length) {
            _.forEach(this.filters.news, (nw: any) => {
                params += ('&comunicados_id[]=' + nw.id);
            });
        }
        return params;
    }
}
