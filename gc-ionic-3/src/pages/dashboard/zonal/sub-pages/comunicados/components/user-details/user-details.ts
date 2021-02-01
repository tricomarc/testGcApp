import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    ModalController,
    NavController,
    NavParams
} from 'ionic-angular';
import {config} from "../../../../estadisticas.config";
import * as _ from 'lodash';
import {Chart} from 'chart.js';
import {RequestProvider} from "../../../../../../../shared/providers/request/request";
import {UtilProvider} from "../../../../../../../shared/providers/util/util";
import {SessionProvider} from "../../../../../../../shared/providers/session/session";
import {global} from "../../../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-user-details-comunicado',
    templateUrl: 'user-details.html',
})
export class UserDetailsComunicadosPage {

    private requesting: boolean = false;

    @ViewChild('doughnutCanvas') doughnutCanvas;
    @ViewChild('doughnutCanvas2') doughnutCanvas2;

    date = new Date();
    nombreModulo = "";
    filtros = {
        desde: this.navParams.data.filters.from,
        hasta: this.navParams.data.filters.to,
        usuario_id: this.navParams.data.usuario_id,
        comunicados_id: this.navParams.data.filters.news
    };
    userName = this.navParams.data.nombre_usuario;
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
    sucursal: null;
    datos = null;
    graphicsInfo = [];
    setting: boolean = false;
    mostrarSubgerente: boolean = false;
    mostrarZonal: boolean = false;
    doughnutChart: any;
    doughnutChart2: any;
    leidos = 0;
    comprendidos = 0;
    totales = 0;
    promLectura = 0;
    promComprension = 0;

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
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {

    }

    
    /**
     * Según el modulo en el cual se acceda se asignan los parametros para filtros y endpoint
     */
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'UserDetailsComunicadosEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'UserDetailsComunicados', 'Estadisticas' );
        
        this.getDetails();
    }
    
    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }
    
    /**
     * Se crean graficos segun parametros recibidos
     */
    buildChart() {
        this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
            type: 'doughnut',
            data: {
                labels: this.detailsInfo1.donaLabel,
                datasets: [{
                    label: '% Leidos',
                    data: this.detailsInfo1.donaData,
                    backgroundColor: this.detailsInfo1.backgroundColor,
                    hoverBackgroundColor: this.detailsInfo1.hoverBackgroundColor
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
                labels: this.detailsInfo2.donaLabel,
                datasets: [{
                    label: '% Comprensión',
                    data: this.detailsInfo2.donaData,
                    backgroundColor: this.detailsInfo2.backgroundColor,
                    hoverBackgroundColor: this.detailsInfo2.hoverBackgroundColor
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
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getDetails() {
        this.requesting = true;
        let data = {};
        await this.request
            .post(config.endpoints.post.comunicadosDetalleSucursalUsuario, this.filtros, true)
            .then((response: any) => {
                try {
                    if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                        this.datos = response.data;
                        _.forEach(this.datos, (com) => {
                            if (com.leido == true) this.leidos++;
                            if (com.comprendido == 2) this.comprendidos++;

                            this.totales++;
                        });

                        var dif1 = this.totales - this.leidos;
                        this.detailsInfo1 = {
                            'donaData': [this.leidos, dif1],
                            'donaLabel': ["Leidos", "No Leidos"],
                            'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                            'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
                        };
                        var dif2 = this.totales - this.comprendidos;
                        this.detailsInfo2 = {
                            'donaData': [this.comprendidos, dif2],
                            'donaLabel': ["Comprendidos", ""],
                            'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                            'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
                        };

                        this.promLectura = (this.detailsInfo1.donaData[0] * 100) / (this.detailsInfo1.donaData[1] + this.detailsInfo1.donaData[0]);
                        this.promComprension = (this.detailsInfo2.donaData[0] * 100) / (this.detailsInfo2.donaData[1] + this.detailsInfo2.donaData[0]);
                        this.buildChart();
                    }
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        this.requesting = false;
        return data;
    }
}
