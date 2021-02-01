import {ApplicationRef, Component} from '@angular/core';
import {AlertController, IonicPage, LoadingController, NavController, NavParams} from 'ionic-angular';
import {config} from "../../tienda/checklist-tienda.config";
import {AmbitoPage} from "../ambito/ambito";
import {DatePipe} from "@angular/common";
import {UtilProvider} from "../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {global} from "../../../../shared/config/global";
import {FinalizadasDetallePage} from "../finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the HistoricoEvaluadosPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-historico-evaluados',
    templateUrl: 'historico-evaluados.html',
})
export class HistoricoEvaluadosPage {

    checklists = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        public datepipe: DatePipe,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
    ) {
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'HistoricoEvaluadosChecklist' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'HistoricoEvaluados', 'Checklist' );
    }

    ionViewWillEnter() {
        this.getHistorics();
    }

    /**
     * Trae históricos deasde servicio
     * @returns {Promise<{}>}
     */
    async getHistorics() {
        const loading = this.loading.create({content: 'Obteniendo historicos'});
        loading.present();
        let data = {};
        await this.request
            .get(config.endpoints.get.checklists + '?tipo=usuario&no_leidos=1', false)
            .then((response: any) => {
                loading.dismiss();
                try {
                    this.checklists = response.data.checklist;
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
            });
        return data;
    }

    /**
     * Actualiza comunicados y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshHistoric(refresher: any) {
        await this.getHistorics();
        refresher.complete();
    }

    /**
     * Redirección hacia AmbitoPage
     * @param checklist_id
     */
    async navigateToAmbito(checklist_id, suc_id) {

        const loading = this.loading.create({content: 'Actualizando Estado'});
        loading.present();

        await this.request
            .get(config.endpoints.get.changeStatus + suc_id, true)
            .then((response: any) => {
                loading.dismiss();
                if(response.code === 200){
                    try {
                        this.navCtrl.push(FinalizadasDetallePage, {
                            checklist_id: checklist_id * 1,
                            sucursal_id: null,
                            visita_id: null,
                            action_id: null,
                            from: 'Historicas'
                        });
                    }
                    catch (e) {
                    }
                }else this.util.showToast("Ocurrió un error al actualizar el estado, por favor contacte a soporte.", 3000);

            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
            });
    }

    /**
     * Redirección hacia ambito
     * @param checklist_id
     */
    /*navigateToAmito(checklist_id) {
        this.navCtrl.push(AmbitoPage, {
            checklist_id: checklist_id,
            leer: 1
        });
    }*/

}
