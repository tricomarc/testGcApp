import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides
} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../shared/providers/session/session";
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {config} from "../../reloj-control.config";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'details-month',
    templateUrl: 'details-month.html',
})
export class DetailsMonthPage {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready: boolean = false;

    anio = 0;
    mes = 0;

    days = [];
    desde = new Date();
    hasta = new Date();
    monthName = "";

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider) {
    }

    async ionViewDidLoad() {
        if (!_.isUndefined(this.navParams.data.anio) && !_.isNull(this.navParams.data.anio)) {
            this.anio = this.navParams.data.anio;
            if (!_.isUndefined(this.navParams.data.mes) && !_.isNull(this.navParams.data.mes)) {
                this.mes = this.navParams.data.mes;
                this.getDetails();
            }
        }
    }

    /**
     * Trae registro de historicos desde API
     * @returns {Promise<{}>}
     */
    async getDetails() {
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();


        var endpoint = "?ano=" + this.anio + "&mes=" + this.mes;
        let data = {};
        await this.request
            .get(config.endpoints.get.monthDetails + endpoint, true)
            .then((response: any) => {
                try {
                    if (response.code == 200) {
                        this.days = response.data.registros;
                        this.desde = response.data.desde;
                        this.hasta = response.data.hasta;
                        this.monthName = response.data.mes;

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

}
