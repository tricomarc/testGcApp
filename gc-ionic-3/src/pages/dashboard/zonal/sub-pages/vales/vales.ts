import {ApplicationRef, Component} from '@angular/core';
import {IonicPage, LoadingController, MenuController, NavController, NavParams} from 'ionic-angular';
import {global} from "../../../../../shared/config/global";
import {UtilProvider} from "../../../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';
/**
 * Generated class for the IndexPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-vales-details',
    templateUrl: 'vales.html',
})
export class ValesDetailsPage {

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ValesDetailsEstadisticas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ValesDetails', 'Estadisticas' );
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }
}
