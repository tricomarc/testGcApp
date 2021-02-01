import {ApplicationRef, Component} from '@angular/core';
import {
    NavController,
    NavParams
} from 'ionic-angular';
import {Chart} from 'chart.js';
import {UtilProvider} from "../../../../../../../shared/providers/util/util";
import {global} from "../../../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-details-kpi',
    templateUrl: 'detalle.html',
})
export class DetailsKpiSubsidiaryPage {

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    area = {};
    fecha = {};

    constructor(
        public navCtrl: NavController,
        private navParams: NavParams,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'DetailsKpiSubsidiaryEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailsKpiSubsidiary', 'Estadisticas' );
    }

    ionViewWillEnter() {
        this.area = this.navParams.data.area;
        this.fecha = this.navParams.data.date;
    }


}
