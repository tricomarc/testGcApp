import {Component} from '@angular/core';
import {
    LoadingController,
    MenuController,
    NavController,
    App
} from "ionic-angular";
import * as _ from 'lodash';
import {AmbitoPage} from "../../../sub-pages/ambito/ambito";
import {config} from "../../checklist-zonal.config";
import {UtilProvider} from "../../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../../shared/providers/request/request";
import {ChecklistDetailsPage} from "../../../../dashboard/zonal/sub-pages/checklist/checklist";
import {global} from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'tiendas',
    templateUrl: 'tiendas.html'
})
export class ChecklistTiendaZonalComponent {

    checklists_tienda = [];
    thisSession = null;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private request: RequestProvider,
        private menu: MenuController,
        private util: UtilProvider,
        private loading: LoadingController,
        public app: App,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
    ) {

    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistTiendaZonal' );
    }

    async ngOnInit() {
        this.thisSession = await this.util.getInternalSession();
        this.menu.enable(true, "menu");
        this.getAllChecklists();
    }

    /**
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getAllChecklists() {
        const loading = this.loading.create({content: 'Obteniendo checklist'});
        loading.present();
        let data = {};
        await this.request
            .post(config.endpoints.post.listaChecklistZonal, null, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    this.checklists_tienda = response.data.tiendas;
                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }


    /**
     * Redireccion a vista de checklist singular
     * @param checklist
     */
    navigateToAmbito( checklist: any ) {
        this.app.getRootNav().push( AmbitoPage, {
            checklist_id: checklist.asignacion_id,
            onlyWatch: true,
            fromStats: true
        })
    }

    /**
     * Redireccion a vista de estadisticas checklist
     * @param checklist
     */
    navigateToDashboard(checklist: any) {
        var cheks_ids = [];
        cheks_ids.push(checklist.check_id);
        if(!_.isNull(this.thisSession.usuario.zona_id)){
            this.app.getRootNav().push(ChecklistDetailsPage, {
                zona_id: this.thisSession.usuario.zona_id,
                checks_id: cheks_ids,
                nombreModulo: checklist.check_nombre,
            });
        }else{
            this.app.getRootNav().push(ChecklistDetailsPage, {
                checks_id: cheks_ids,
                nombreModulo: checklist.check_nombre,
            });
        }
    }

    /**
     * Actualiza checklists y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshChecklist(refresher: any) {
        await this.getAllChecklists();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }
}

