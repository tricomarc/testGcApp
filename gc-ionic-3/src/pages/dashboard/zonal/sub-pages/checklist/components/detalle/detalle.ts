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
import { global } from "../../../../../../../shared/config/global";
import { UserDetailsComunicadosPage } from "../../../comunicados/components/user-details/user-details";
import { ChecklistDetailsChecklistPage } from "../checklist-details/checklist-details";
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-details-checklist',
    templateUrl: 'detalle.html',
})
export class DetailsChecklistSubsidiaryPage {


    /* Nueva versión estadística checklist */

    private filters: any = null;

    /* Nueva versión estadística checklist */

    @ViewChild('doughnutCanvas') doughnutCanvas;
    @ViewChild('doughnutCanvas2') doughnutCanvas2;

    date = new Date();
    nombreModulo = "";

    filtros = {
        desde: this.formatDate(this.navParams.data.desde ? new Date(this.navParams.data.desde) : new Date(this.date.getFullYear(), this.date.getMonth(), 1)),
        hasta: this.formatDate(this.navParams.data.hasta ? new Date(this.navParams.data.hasta) : new Date()),
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
    sucursal: null;
    datos = [];

    setting: boolean = false;
    mostrarSubgerente: boolean = false;
    mostrarZonal: boolean = false;
    isReady: boolean = false;
    endpoint = "";
    doughnutChart: any;
    doughnutChart2: any;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private showFilter: boolean = false;
    private searchChecklist: string = '';
    private auxChecklist: any = [];

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

    }

    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'DetailsChecklistSubsidiaryEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailsChecklistSubsidiary', 'Estadisticas' );

        this.initializeStatistics();
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
            checklists: _.map(filters.checklists, 'id'),
            branchOfficeId: this.navParams.data.sucursal_id
        };

        this.getDetails();
    }

    // Cada vez que se cambia el filtro de fechas, solicita la estadística
    changeDateFilters(event: any) {
        this.getDetails();
    }

    filterChecklist( ){
        console.log( 'DEsde el filtro', this.searchChecklist );

        if( this.searchChecklist ){
            this.datos[0].checklist = _.filter( this.auxChecklist, ( ( check: any ) => {
                return _.includes( check.nombre.toLowerCase(), this.searchChecklist.toLowerCase() )
            } ) );

        }else{
            this.datos[0].checklist = this.auxChecklist;
            console.log( 'nada', this.datos[0].checklist, this.auxChecklist )
        }
    }

    /* Nueva versión estadística checklist */

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }
    
    ionViewWillLeave() {
        this.menu.enable(true, "menu");
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
                    label: '% Enviados',
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
                    label: '% Nota',
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
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getDetails() {
        const loading = this.loading.create({ content: 'Obteniendo listado' });
        loading.present();
        let data = {};
        let sendFilters = this.filtros;

        let body: any = {
            desde: this.filters.from,
            hasta: this.filters.to,
            sucursal_id: this.filters.branchOfficeId,
            checks_id: this.filters.checklists
        };

        await this.request
            .post(config.endpoints.post.checklistDetalle, body, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    if (response.data && response.data[0]) {
                        this.datos = response.data;
                        this.auxChecklist = this.datos[0].checklist;
                        
                        // verificamos si mostramos el filtro o no
                        if( this.datos[0].checklist.length > 3 ){
                            this.showFilter = true;
                        }else{
                            this.showFilter = false;
                        }

                        this.detailsInfo1 = {
                            'donaData': [this.datos[0].totales.total_enviados, (this.datos[0].totales.total_general - this.datos[0].totales.total_enviados)],
                            'donaLabel': ["Enviados", "No Enviados"],
                            'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                            'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
                        };
                        var dif2 = 100 - this.datos[0].totales.porcentaje_nota;
                        this.detailsInfo2 = {
                            'donaData': [this.datos[0].totales.porcentaje_nota, dif2],
                            'donaLabel': ["Nota", ""],
                            'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                            'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
                        };
                        this.buildChart();
                    } else {
                        this.util.showAlert('Atención', 'No hay estadística para mostrar.');
                    }
                }
                catch (e) {
                }
                this.isReady = true;
            })
            .catch((error: any) => {
                loading.dismiss();
                this.isReady = true;
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Redireccion a vista de detalles por usuario
     * @param id_usuario
     * @param nombre_usuario
     */
    redirectToChecklist(id_checklist, nombre_checklist) {
        var params = {
            desde: this.filtros.desde + "",
            hasta: this.filtros.hasta + "",
            checklist_id: id_checklist,
            nombre_checklist: nombre_checklist,
            sucursal_id: this.filtros.sucursal_id,
            filters: this.filters
        };
        this.navCtrl.push(ChecklistDetailsChecklistPage, params);
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

}
