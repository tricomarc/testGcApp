import {ApplicationRef, Component} from '@angular/core';
import {
    ActionSheetController,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Tab
} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import {global} from '../../../shared/config/global';
import {SessionProvider} from "../../../shared/providers/session/session";
import {RequestProvider} from "../../../shared/providers/request/request";
import {UtilProvider} from "../../../shared/providers/util/util";
import * as _ from 'lodash';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../shared/providers/dictionary/dictionary';

/**
 * Generated class for the ChecklistZonalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-comunicados-zonal',
    templateUrl: 'comunicados-zonal.html',
})
export class ComunicadosZonalPage {

    showTienda: boolean = true;
    showPropios: boolean = false;

    static propios: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    //diccionario
    private sucursales: string;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private applicationRef: ApplicationRef,
        private event: Events,
        private storage: Storage,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {

        //this.createTabs();
        UtilProvider.comunicadosZonalIntent++;
    }

    async ionViewDidLoad(){
        this.firebaseAnalyticsProvider.trackView( 'ComunicadosZonalComunicados' );
       
        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.sucursales = dictionary['Sucursales']
        } );
    }

    async ionViewWillEnter() {
        this.menu.enable(true, "menu");
    }

    ionViewDidEnter(){
    }

    ionViewDidLeave(){
    }

    presentActionSheet(item, index) {
        let actionSheet = this.actionSheet.create({
            title: '',
            buttons: [
                {
                    text: `${this.sucursales}`,
                    handler: () => {
                        this.showTienda = true;
                        this.showPropios = false;
                        ComunicadosZonalPage.propios = false;
                        this.applicationRef.tick();
                    }
                },
                {
                    text: 'Propios',
                    handler: () => {
                        this.showTienda = false;
                        this.showPropios = true;
                        ComunicadosZonalPage.propios = true;
                        this.applicationRef.tick();
                    }
                }
            ]
        });
        actionSheet.present();
    }

}
