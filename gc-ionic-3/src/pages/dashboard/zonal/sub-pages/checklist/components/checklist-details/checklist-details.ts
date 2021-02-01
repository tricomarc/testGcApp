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
import { AmbitoPage } from "../../../../../../checklist/sub-pages/ambito/ambito";
import { FinalizadasDetallePage } from "../../../../../../checklist/sub-pages/finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";

import { AmbitsComponent } from '../../../../../../checklists/components/ambits/ambits';
import { ISetting } from '../../../../../../../shared/interfaces/setting.interface';
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-checklist-details-checklist',
    templateUrl: 'checklist-details.html',
})
export class ChecklistDetailsChecklistPage {

    @ViewChild('doughnutCanvas') doughnutCanvas;
    @ViewChild('doughnutCanvas2') doughnutCanvas2;

    date = new Date();
    nombreModulo = "";
    filtros = {
        desde: this.navParams.data.filters.from,
        hasta: this.navParams.data.filters.to,
        checks_id: this.navParams.data.filters.checklists,
        sucursal_id: this.navParams.data.filters.branchOfficeId,
        checklist_id: this.navParams.data.checklist_id
    };

    checklistName = this.navParams.data.nombre_checklist;
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

    cuestionarios = [];
    totales = null;
    sucursal: null;
    datos = [];
    graphicsInfo = [];
    setting: boolean = false;
    mostrarSubgerente: boolean = false;
    mostrarZonal: boolean = false;
    ready: boolean = false;
    doughnutChart: any;
    doughnutChart2: any;
    leidos = 0;
    comprendidos = 0;
    procentaje_enviados = 0;
    procentaje_nota = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private checklistSetting: any = null;

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

    /**
     * Segun el modulo en el cual se acceda se asignan los parametros para filtros y endpoint
     */
    ionViewDidLoad() {
        try {
            const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

            if (auxSetting && auxSetting.params) {
                this.checklistSetting = { value: JSON.parse(auxSetting.params).version }

            } else { this.checklistSetting = null }
        } catch (e) { }
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistDetailsChecklistEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ChecklistDetailsChecklist', 'Estadisticas' );

        this.getDetails();
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
                    label: '% Leídos',
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
        const loading = this.loading.create({ content: 'Obteniendo listado' });
        loading.present();
        let data = {};

        let filtros = this.filtros;
        filtros.checks_id = [this.navParams.data.checklist_id];


        await this.request
            .post(config.endpoints.post.checklistDetalleSucursal, filtros, true)
            .then((response: any) => {
                try {
                    if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                        this.cuestionarios = response.data[0].asignaciones;
                        this.totales = response.data[0].totales;
                        this.procentaje_enviados = this.totales.procentaje_enviados;
                        this.procentaje_nota = this.totales.procentaje_nota;

                        this.ready = true;
                        this.detailsInfo1 = {
                            'donaData': [this.totales.total_enviados, (this.totales.total_asignaciones - this.totales.total_enviados)],
                            'donaLabel': ["Enviados", "No Enviados"],
                            'backgroundColor': ['rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                            'hoverBackgroundColor': ["#FFCE56", "#FF6384"]
                        };
                        var dif2 = 100 - this.totales.porcentaje_nota;
                        this.detailsInfo2 = {
                            'donaData': [this.totales.porcentaje_nota, dif2],
                            'donaLabel': ["Nota", ""],
                            'backgroundColor': ['rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                            'hoverBackgroundColor': ["#FF6384", "#36A2EB"]
                        };
                        this.buildChart();
                    }
                    loading.dismiss();
                }
                catch (e) {
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }


    /**
     * Actualiza formato de fecha para IOS
     * @param date
     * @returns {string}
     */
    formatDate(date) {
        let send = new Date(date);
        return this.util.dateToYMD(send);
    }

    /**
     * Redireccion a vista de checklist
     * @param id_usuario
     * @param nombre_usuario
     */
    watchChecklist(id_checklist, state, suc_id, user_id, cargo, nombre) {

        // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
        if (!this.checklistSetting) {
            if (state == 4) {
                this.navCtrl.push(FinalizadasDetallePage, {
                    checklist_id: id_checklist * 1,
                    sucursal_id: null,
                    visita_id: null,
                    action_id: null,
                    from: 'Finalizadas'
                });
            } else if (state > 1) {
                const params = {
                    checklist_id: id_checklist,
                    suc_id: suc_id ? suc_id : null,
                    user_id: user_id ? user_id : null,
                    cargo: cargo ? cargo : null,
                    nombre: nombre ? nombre : null,
                    onlyWatch: true
                };
                this.navCtrl.push(AmbitoPage, params);
            }
            return;
        }

        const value: any = this.checklistSetting.value;

        if (value === 2) {
            this.navCtrl.push(AmbitsComponent, { checklistId: id_checklist, fromStatistics: true });
            return;
        }

        if (state == 4) {
            this.navCtrl.push(FinalizadasDetallePage, {
                checklist_id: id_checklist * 1,
                sucursal_id: null,
                visita_id: null,
                action_id: null,
                from: 'Finalizadas'
            });
        } else if (state > 1) {
            const params = {
                checklist_id: id_checklist,
                suc_id: suc_id ? suc_id : null,
                user_id: user_id ? user_id : null,
                cargo: cargo ? cargo : null,
                nombre: nombre ? nombre : null,
                onlyWatch: true
            };
            this.navCtrl.push(AmbitoPage, params);
        }
    }
}