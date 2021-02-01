import { ApplicationRef, Component } from '@angular/core';
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
import { Storage } from '@ionic/storage';
import { global } from '../../../shared/config/global';
import { SessionProvider } from "../../../shared/providers/session/session";
import { RequestProvider } from "../../../shared/providers/request/request";
import { UtilProvider } from "../../../shared/providers/util/util";
import { ComunicadosZonalPage } from "../../comunicados/zonal/comunicados-zonal";
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the ChecklistZonalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-checklist-zonal',
    templateUrl: 'checklist-zonal.html',
})

export class ChecklistZonalPage {

    showTienda: boolean = false;
    showPropios: boolean = true;
    static propios: boolean = false;
    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

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
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {

        UtilProvider.checklistZonalIntent++;
    }

    ionViewDidLoad(){
        // tracks de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistZonal' );
    }

    async ionViewWillEnter() {
        this.menu.enable(true, "menu");

        if (this.showPropios && !this.showTienda) {
            this.event.publish('returnCheckZonalList', true);
        }
    }

    presentActionSheet(item, index) {
        let actionSheet = this.actionSheet.create({
            title: '',
            buttons: [
                {
                    text: 'Mis checklist',
                    handler: () => {
                        this.showTienda = false;
                        this.showPropios = true;
                        ChecklistZonalPage.propios = true;
                        this.applicationRef.tick();
                    }
                }, {
                    text: 'Otros checklist',
                    handler: () => {
                        this.showTienda = true;
                        this.showPropios = false;
                        ChecklistZonalPage.propios = false;
                        this.applicationRef.tick();
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
