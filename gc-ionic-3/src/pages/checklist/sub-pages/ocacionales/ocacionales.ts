import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {global} from "../../../../shared/config/global";
import {UtilProvider} from "../../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the OcacionalesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-ocacionales',
    templateUrl: 'ocacionales.html',
})
export class OcacionalesPage {

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(public navCtrl: NavController, public navParams: NavParams, private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'OcacionalesChecklist' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'Ocacionales', 'Checklist' );
    }

}
