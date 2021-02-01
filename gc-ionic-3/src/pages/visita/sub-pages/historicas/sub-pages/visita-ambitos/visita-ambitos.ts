import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides,
    ActionSheetController
} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../../../shared/providers/session/session";
import {global} from '../../../../../../shared/config/global'
import {UtilProvider} from "../../../../../../shared/providers/util/util";
import {config} from "../../historicas.config";
import {RequestProvider} from "../../../../../../shared/providers/request/request";
import {VisitaDetallePage} from "../visita-detalle/visita-detalle";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'visita-ambitos',
    templateUrl: 'visita-ambitos.html',
})
export class VisitaAmbitosPage {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready:boolean = false;

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
    }

    async ionViewDidLoad() {
        if (!_.isUndefined(this.navParams.data.visita_id) && !_.isNull(this.navParams.data.visita_id)) {
            this.visita_id = this.navParams.data.visita_id;
            this.listarFinalizadosDetalle();
        }
    }

    async listarFinalizadosDetalle() {
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();
        var endpoint = "?visita_id=" + this.visita_id;
        let data = {};
        await this.request
            .get(config.endpoints.get.ambitos_visita + endpoint, true)
            .then((response: any) => {
                try {
                    if (response.code == 200) {
                        this.ready = true;
                        this.checklist = response.data;
                    }else{
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
    navigateToDetails(visita_id, ambito_id) {
        this.navCtrl.push(VisitaDetallePage, {
            visita_id: visita_id,
            ambito_id: ambito_id
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
