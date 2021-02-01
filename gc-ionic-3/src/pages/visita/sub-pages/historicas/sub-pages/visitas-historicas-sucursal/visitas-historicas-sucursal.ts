import { ApplicationRef, Component, ViewChild } from '@angular/core';
import { Events, IonicPage, LoadingController, MenuController, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import * as _ from 'lodash';
import { global } from '../../../../../../shared/config/global'
import { UtilProvider } from "../../../../../../shared/providers/util/util";
import { config } from "../../historicas.config";
import { RequestProvider } from "../../../../../../shared/providers/request/request";
import { VisitaAmbitosPage } from "../visita-ambitos/visita-ambitos";
import { D } from "@angular/core/src/render3";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'visitas-historicas-sucursal',
    templateUrl: 'visitas-historicas-sucursal.html',
})
export class VisitasHistoricasSucursalPage {

    showChecklists = [];
    sucursal_id = 0;
    sucursal_nombre = "";
    fechaDesde: Date;
    fechaHasta: Date;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private actionSheet: ActionSheetController,
        private request: RequestProvider,
        private util: UtilProvider) {
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        if (!_.isUndefined(this.navParams.data.sucursal_id) && !_.isNull(this.navParams.data.sucursal_id)) {
            this.sucursal_id = this.navParams.data.sucursal_id;
        }
        if (!_.isUndefined(this.navParams.data.sucursal_nombre) && !_.isNull(this.navParams.data.sucursal_nombre)) {
            this.sucursal_nombre = this.navParams.data.sucursal_nombre;
        }
        if (!_.isUndefined(this.navParams.data.fechaDesde) && !_.isNull(this.navParams.data.fechaDesde)) {
            this.fechaDesde = this.navParams.data.fechaDesde;
        }
        if (!_.isUndefined(this.navParams.data.fechaHasta) && !_.isNull(this.navParams.data.fechaHasta)) {
            this.fechaHasta = this.navParams.data.fechaHasta;
        }

        this.searchVisits();
    }

    /**
     * Trae registro de visitas historicas desde API
     * @returns {Promise<{}>}
     */
    async searchVisits() {
        const loading = this.loading.create({ content: 'Obteniendo Infomación' });
        loading.present();
        var endpoint = "?desde=" + this.util.dateToYMD(this.fechaDesde) + "&hasta=" + this.util.dateToYMD(this.fechaHasta) + "&sucursal_id=" + this.sucursal_id;
        let data = {};
        await this.request
            .get(config.endpoints.get.historico_visitas + endpoint, true)
            .then((response: any) => {
                try {
                    if (response.code == 200) {
                        this.showChecklists = _.filter(response.data, { estado_id: 4 });
                    } else {
                        this.util.showToast(response.message, 3000);
                    }
                }
                catch (e) {
                }
                loading.dismiss();
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Redireccion a vista de sucursal seleccionada
     * @param sucursal
     */
    navigateToDetails(visita_id) {
        this.navCtrl.push(VisitaAmbitosPage, {
            visita_id: visita_id
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
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push('HistoricasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }
}