import { ApplicationRef, Component } from '@angular/core';
import {
    AlertController,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    ActionSheetController
} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { SessionProvider } from "../../../../shared/providers/session/session";
import { config } from "./historicas.config";
import { UtilProvider } from "../../../../shared/providers/util/util";
import { RequestProvider } from "../../../../shared/providers/request/request";
import { DatePipe } from "@angular/common";
import { global } from "../../../../shared/config/global";
import { VisitasHistoricasSucursalPage } from "./sub-pages/visitas-historicas-sucursal/visitas-historicas-sucursal";
import { D } from "@angular/core/src/render3";
import { VisitaSucursalPage } from "../sucursal/sucursal";
import { ChecklistTiendaPage } from "../../../checklist/tienda/checklist-tienda";

import * as _ from 'lodash';

/**
 * Generated class for the HistoricasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@IonicPage()
@Component({
    selector: 'historicas',
    templateUrl: 'historicas.html',
})
export class HistoricasPage {

    newDate = new Date();
    hasta = new Date();
    desde = new Date();

    showHasta = "";
    showDesde = "";
    /*tempHasta = new Date();
    tempDesde = new Date(this.fechaHasta.getFullYear(), this.fechaHasta.getMonth(), 1);*/
    /*fechaDesdeString: String;
    fechaHastaString: String;*/

    sendDates = {
        desde: this.desde,
        hasta: this.hasta
    };

    filter = [
        {
            value: 0,
            title: 'Todas'
        }, {
            value: 1,
            title: 'Visitadas'
        }, {
            value: 2,
            title: 'Por visitar'
        }
    ];
    historicosList = [];
    sucursales_visitadas = [];
    sucursales_por_visitar = [];

    sucursales_visitadas_ver = [];
    sucursales_por_visitar_ver = [];

    filtroEstado = 0;
    realizadas = 0;
    faltantes = 0;
    total = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private requesting: boolean = false;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private util: UtilProvider,
        private request: RequestProvider,
        public datepipe: DatePipe,
        private alert: AlertController,
        private loading: LoadingController,
        private menu: MenuController,
        private applicationRef: ApplicationRef,
        private actionSheet: ActionSheetController) {

    }

    async ionViewDidEnter() {
        this.menu.enable(false, "menu");

        if ((this.newDate.getMonth() + 1) < 10) {
            this.showDesde = this.newDate.getFullYear() + "-0" + (this.newDate.getMonth() + 1) + "-01";
            this.showHasta = this.newDate.getFullYear() + "-0" + (this.newDate.getMonth() + 1)
        } else {
            this.showDesde = this.newDate.getFullYear() + "-" + (this.newDate.getMonth() + 1) + "-01";
            this.showHasta = this.newDate.getFullYear() + "-" + (this.newDate.getMonth() + 1)
        }

        if ((this.newDate.getDate()) < 10) {
            this.showHasta = this.showHasta + "-0" + this.newDate.getDate();
        } else {
            this.showHasta = this.showHasta + "-" + this.newDate.getDate();
        }

        console.log("on init showDesde ", this.showDesde)
        console.log("on init showHasta ", this.showHasta)

        await this.updateDates();

        this.buscarHistoricos();
    }

    /**
     * Actualiza fechas por formato correcto
     */
    async updateDates() {

        this.desde = new Date(this.showDesde);
        this.desde.setDate(this.desde.getDate() + 1);

        this.hasta = new Date(this.showHasta);
        this.hasta.setDate(this.hasta.getDate() + 1);

        console.log("updateFilters showDesde ", this.showDesde)
        console.log("updateFilters showHasta ", this.showHasta)

        console.log("updateDates desde ", this.desde)
        console.log("updateDates hasta ", this.hasta)

        let tempDesde = "";
        let tempHasta = "";
        let curr_month1 = "";
        if ((this.desde.getMonth() + 1) < 10) {
            curr_month1 = "0" + (this.desde.getMonth() + 1);
            tempDesde = (this.desde.getFullYear() + "-" + curr_month1)
            //this.sendDates.desde = (this.desde.getFullYear() + "-" + curr_month1)
        } else {
            tempDesde = (this.desde.getFullYear() + "-" + (this.desde.getMonth() + 1))
        }
        let curr_day1 = "";
        if ((this.desde.getDate()) < 10) {
            curr_day1 = "0" + this.desde.getDate();
            tempDesde = tempDesde + "-" + curr_day1;
            //this.sendDates.desde = this.sendDates.desde + "-" + curr_day1
        } else {
            tempDesde = tempDesde + "-" + this.desde.getDate();
        }
        let curr_month2 = "";
        if ((this.hasta.getMonth() + 1) < 10) {
            curr_month2 = "0" + (this.hasta.getMonth() + 1);
            tempHasta = (this.hasta.getFullYear() + "-" + curr_month2);
            //this.sendDates.hasta = (this.hasta.getFullYear() + "-" + curr_month2)
        } else {
            tempHasta = (this.hasta.getFullYear() + "-" + (this.hasta.getMonth() + 1))
        }
        let curr_day2 = "";
        if ((this.hasta.getDate()) < 10) {
            curr_day2 = "0" + this.hasta.getDate();
            tempHasta = tempHasta + "-" + curr_day2
        } else {
            tempHasta = tempHasta + "-" + this.hasta.getDate();
        }

        console.log("tempDesde", tempDesde)
        console.log("tempHasta", tempHasta)

        this.sendDates.desde = new Date(tempDesde.replace(/-/g, '/'));
        this.sendDates.hasta = new Date(tempHasta.replace(/-/g, '/'));
        console.log("sendDates desde", this.sendDates.desde)
        console.log("sendDates hasta", this.sendDates.hasta)

        console.log("new filtros ", this.sendDates)
    }

    /**
     * Actualiza filtro de comunicados tras seleccionar fechas
     * @param value1: Fecha de Inicio
     * @param value2: Fecha de Fin
     */
    async updateFilters() {
        console.log("filterVisual ", this.sendDates)

        console.log("updateFilters showDesde ", this.showDesde)
        console.log("updateFilters showHasta ", this.showHasta)

        var d1 = new Date(this.showDesde);
        var d2 = new Date(this.showHasta);

        console.log("d1 ", d1.getTime(), " d2 ", d2.getTime());
        if (d1.getTime() <= d2.getTime()) {
            await this.updateDates();
            this.buscarHistoricos();
        } else {
            const confirm = this.alert.create({
                title: 'Atención',
                message: "La fecha de inicio debe ser menor o igual a la fecha de término",
                buttons: [{
                    text: 'Aceptar',
                    handler: () => {
                        if ((this.newDate.getMonth() + 1) < 10) {
                            this.showDesde = this.newDate.getFullYear() + "-0" + (this.newDate.getMonth() + 1) + "-01";
                            this.showHasta = this.newDate.getFullYear() + "-0" + (this.newDate.getMonth() + 1)
                        } else {
                            this.showDesde = this.newDate.getFullYear() + "-" + (this.newDate.getMonth() + 1) + "-01";
                            this.showHasta = this.newDate.getFullYear() + "-" + (this.newDate.getMonth() + 1)
                        }

                        if ((this.newDate.getDate()) < 10) {
                            this.showHasta = this.showHasta + "-0" + this.newDate.getDate();
                        } else {
                            this.showHasta = this.showHasta + "-" + this.newDate.getDate();
                        }
                        this.applicationRef.tick();

                        console.log("new showDesde ", this.showDesde);
                        console.log("new showHasta ", this.showHasta);

                        this.updateDates();
                        this.buscarHistoricos();
                        return;
                    }
                }]
            });
            confirm.present();
        }
    }

    /**
     * Trae registro de historicos desde API
     * @returns {Promise<{}>}
     */
    async buscarHistoricos() {
        this.requesting = true;
        const loading = this.loading.create({ content: 'Obteniendo Información' });
        loading.present();
        var endpoint = "?fecha_fin=" + this.util.dateToYMD(this.sendDates.hasta) + "&fecha_inicio=" + this.util.dateToYMD(this.sendDates.desde);
        console.log("endpoint ", endpoint);
        let data = {};
        await this.request
            .get(config.endpoints.get.historicos + endpoint, false)
            .then((response: any) => {
                try {
                    console.log("response ", response);
                    if (response.code == 200) {
                        this.sucursales_visitadas = response.data.sucursales_visitadas;

                        this.sucursales_visitadas.sort((one, two) => (one.fecha > two.fecha ? -1 : 1));
                        this.sucursales_visitadas.reverse();
                        console.log("sucursales_visitadas ", this.sucursales_visitadas);
                        this.sucursales_por_visitar = response.data.sucursales_por_visitar;
                        this.historicosList = response.data;

                        this.sucursales_visitadas_ver = this.sucursales_visitadas;
                        this.sucursales_por_visitar_ver = this.sucursales_por_visitar;

                        /*this.realizadas = this.sucursales_visitadas_ver.length;
                        this.faltantes = this.sucursales_por_visitar_ver.length;
                        this.total = this.realizadas + this.faltantes;*/

                        let realizadas = 0;
                        let faltantes = 0;
                        _.forEach(this.sucursales_visitadas_ver, (sucursal) => {
                            realizadas += (sucursal.cantidad_checklist * 1);
                        });
                        _.forEach(this.sucursales_por_visitar_ver, (sucursal) => {
                            faltantes += (sucursal.cantidad_checklist * 1);
                        });

                        this.realizadas = realizadas;
                        this.faltantes = faltantes;
                        this.total = this.realizadas + this.faltantes;

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
        this.requesting = false;
        return data;
    }

    /**
     * Actualiza sucursales segun filtro seleccionado
     * @param filtroEstado
     */
    actualizarFiltro(filtroEstado) {
        console.log("filtroEstado ", filtroEstado)

        console.log("sucursales_visitadas ", this.sucursales_visitadas);
        console.log("sucursales_por_visitar ", this.sucursales_por_visitar);

        this.sucursales_visitadas_ver = [];
        this.sucursales_por_visitar_ver = [];

        if (filtroEstado == 1) {
            this.sucursales_visitadas_ver = this.sucursales_visitadas;
            this.sucursales_por_visitar_ver = [];
        } else if (filtroEstado == 2) {
            this.sucursales_visitadas_ver = [];
            this.sucursales_por_visitar_ver = this.sucursales_por_visitar;
        } else {
            this.sucursales_visitadas_ver = this.sucursales_visitadas;
            this.sucursales_por_visitar_ver = this.sucursales_por_visitar;
        }

        /*this.realizadas = this.sucursales_visitadas_ver.length;
        this.faltantes = this.sucursales_por_visitar_ver.length;
        this.total = this.realizadas + this.faltantes;*/

        let realizadas = 0;
        let faltantes = 0;
        _.forEach(this.sucursales_visitadas_ver, (sucursal) => {
            realizadas += sucursal.cantidad_checklist;
        });
        _.forEach(this.sucursales_por_visitar_ver, (sucursal) => {
            faltantes += sucursal.cantidad_checklist;
        });

        this.realizadas = realizadas;
        this.faltantes = faltantes;
        this.total = this.realizadas + this.faltantes;

        console.log("sucursales_visitadas_ver ", this.sucursales_visitadas_ver);
        console.log("sucursales_por_visitar_ver ", this.sucursales_por_visitar_ver);
        this.applicationRef.tick();
    }

    /**
     * Redireccion a vista de sucursal seleccionada
     * @param sucursal
     */
    redirectToChecklist(sucursal_id, sucursal_nombre, fecha) {
        console.log("sucursal_id ", sucursal_id);

        var splitted = fecha.split("-", 3);
        let newDate = splitted[1] + "-" + splitted[0] + "-" + splitted[2];

        console.log("newDate ", newDate);
        let newDateFormat = new Date(newDate.replace(/-/g, '/'));
        console.log("newDateFormat ", newDateFormat);
        this.navCtrl.push(VisitasHistoricasSucursalPage, {
            sucursal_id: sucursal_id,
            sucursal_nombre: sucursal_nombre,
            fechaDesde: newDateFormat,
            fechaHasta: newDateFormat
        });
    }

    /**
     * Redireccion a formularios de sucursal
     * @param sucursal
     */
    redirectToSucursal(sucursal) {
        if(global.isMap) return;
        this.navCtrl.push(ChecklistTiendaPage, {
            sucursal: sucursal,
        });
    }

    showVisitActionSheet() {
        const actionSheet = this.actionSheet.create({
            buttons: [
                {
                    text: 'Inicio',
                    handler: () => {
                        this.navCtrl.popToRoot();
                    }
                }, {
                    text: 'No enviados',
                    handler: () => {
                        this.navCtrl.push('NoEnviadasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
