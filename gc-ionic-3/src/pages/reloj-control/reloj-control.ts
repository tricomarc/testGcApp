import {Component, ViewChild} from '@angular/core';
import {
    Content,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides
} from 'ionic-angular';
import * as _ from 'lodash';
import {global} from '../../shared/config/global'
import {UtilProvider} from "../../shared/providers/util/util";
import {RequestProvider} from "../../shared/providers/request/request";
import {DetailsMonthPage} from "./sub-pages/details-month/details-month";
import {WeekPage} from "./sub-pages/week/week";
import {config} from "../reloj-control/reloj-control.config";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'reloj-control',
    templateUrl: 'reloj-control.html',
})
export class RelojControlPage {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready: boolean = false;

    workDays = 0;
    lateHours = 0;
    extraHours = 0;
    workHours = 0;
    filtroMeses = 0;
    month = "";
    weeks = [];
    months = [];
    toFoundDate = new Date();

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider) {

        this.module = "Reloj Control";
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        this.getResume();
    }


    /**
     * Trae registro de historicos desde API
     * @returns {Promise<{}>}
     */
    async getResume() {
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();

        this.toFoundDate = new Date();
        console.log("getMonth 1 ", this.toFoundDate.getMonth());
        console.log("getYear 1 ", this.toFoundDate.getFullYear());

        this.toFoundDate.setMonth(this.toFoundDate.getMonth() - 1);
        console.log("getMonth 2 ", this.toFoundDate.getMonth());
        console.log("getYear 2 ", this.toFoundDate.getFullYear());

        var endpoint = "?ano=" + this.toFoundDate.getFullYear() + "&mes=" + (this.toFoundDate.getMonth() + 1);
        console.log("endpoint ", endpoint);
        let data = {};
        await this.request
            .get(config.endpoints.get.monthResume + endpoint, true)
            .then((response: any) => {
                try {
                    console.log("response ", response);
                    if (response.code == 200) {

                        this.workDays = response.data.dias_trabajados;
                        this.lateHours = response.data.horas_atrasadas;
                        this.extraHours = response.data.horas_extras;
                        this.workHours = response.data.horas_trabajadas;
                        this.month = response.data.mes;
                        this.weeks = response.data.semanas;

                        this.request
                            .get(config.endpoints.get.getMonths, true)
                            .then((response: any) => {
                                try {
                                    console.log("meses ", response);
                                    if (response.code == 200) this.months = response.data;
                                    else this.util.showToast(response.message, 3000);
                                }
                                catch (e) {
                                    console.log("error ", e);
                                }
                                loading.dismiss();
                            })
                            .catch((error: any) => {
                                loading.dismiss();
                                console.log("error ", error);
                                if (error && error.message) this.util.showToast(error.message, 3000);
                            });


                    } else {
                        this.util.showToast(response.message, 3000);
                    }
                }
                catch (e) {
                    console.log("error ", e);
                }
                loading.dismiss();
            })
            .catch((error: any) => {
                loading.dismiss();
                console.log("error ", error);
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    actualizarFiltro(filtroMes) {
        console.log("filtroMes ", filtroMes, this.filtroMeses)

    }

    /**
     * Redireccion a visitas no enviadas y guardadas en memoria
     */
    redirectToDetails() {
        this.navCtrl.push(DetailsMonthPage, {
            anio: this.toFoundDate.getFullYear(),
            mes: (this.toFoundDate.getMonth() + 1)
        });
    }

    /**
     * Redireccion a semana seleccionada
     */
    redirectToWeed(week) {
        console.log("To send week ", week)
        this.navCtrl.push(WeekPage, {
            days: week.dias,
            state: week.estado_semana.codigo
        });
    }
}
