import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {global} from "../../../shared/config/global";
import {UtilProvider} from "../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the ImageModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-image-modal',
    templateUrl: 'image-modal.html',
})
export class ImageModalPage {

    imgUrl = "";

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
        this.imgUrl = this.navParams.get('url');
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ImageModalComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ImageModal', 'Comunicados' );
    }

    public closeModal() {
        this.viewCtrl.dismiss();
    }

}
