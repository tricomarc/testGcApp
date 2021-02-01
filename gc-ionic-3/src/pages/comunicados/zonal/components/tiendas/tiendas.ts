import {ApplicationRef, Component, Input} from '@angular/core';
import {LoadingController, MenuController, NavController, App, Events} from "ionic-angular";
import {config} from "../../comunicados-zonal.config";
import {UtilProvider} from "../../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../../shared/providers/request/request";
import {ComunicadosDetailsPage} from "../../../../dashboard/zonal/sub-pages/comunicados/comunicados";
import * as _ from 'lodash';
import {VisualReportPage} from "../../../../visual/branch-office/visual-report/visual-report";
import {SendReportPage} from "../../../../visual/branch-office/send-report/send-report";
import {global} from "../../../../../shared/config/global";
import {SessionProvider} from "../../../../../shared/providers/session/session";
import {ChecklistDetailsPage} from "../../../../dashboard/zonal/sub-pages/checklist/checklist";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'tiendas',
    templateUrl: 'tiendas.html'
})
export class ComunicadosTiendaZonalComponent {

    comunicados_tienda = [];
    thisSession = null;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private request: RequestProvider,
        private util: UtilProvider,
        private loading: LoadingController,
        private applicationRef: ApplicationRef,
        private event: Events,
        public app: App,
        private menu: MenuController,
        private session: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
    ) {
    }

    ionViewDidLoad(){
        this.firebaseAnalyticsProvider.trackView( 'ComunicadosTiendaZonalComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ComunicadosTiendaZonal', 'Comunicados' );
    }

    async ngOnInit() {
        this.menu.enable(true, "menu");
        this.thisSession = await this.util.getInternalSession();
        this.getAllComunicates();
    }

    /**
     * Obtiene todos los comunicados que cumplen con los filtro de busqueda
     * @returns {Promise<{}>}
     */
    async getAllComunicates() {
        let data = {};
        const loading = this.loading.create({content: 'Obteniendo comunicados'});
        loading.present();
        await this.request
            .post(config.endpoints.post.comunicados, null, true)
            .then((response: any) => {

                loading.dismiss();
                try {
                    this.comunicados_tienda = response.data.tiendas;
                    this.applicationRef.tick();
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
     * Redireccion a vista de estadisticas checklist
     * @param checklist
     */
    goToDashboard(comunicado: any) {
        var comunicados_id = [];
        comunicados_id.push(comunicado.comunicado_id);
        if(!_.isNull(this.thisSession.usuario.zona_id)){
            this.app.getRootNav().push(ComunicadosDetailsPage, {
                zona_id: this.thisSession.usuario.zona_id,
                comunicados_id: comunicados_id,
                nombreModulo: comunicado.comunicado_nombre,
            });
        }else{
            this.app.getRootNav().push(ComunicadosDetailsPage, {
                comunicados_id: comunicados_id,
                nombreModulo: comunicado.comunicado_nombre,
            });
        }
    }

    /**
     * Abre modal de detalles para comunicado seleccionado
     * @param comunicado: Comunicado seleccionado (se envia como parametro)
     */
    public goToDetails(comunicado) {
        this.app.getRootNav().push('DetailsModalPage', {
            comunicado: comunicado,
            onlyWatch: true
        });
    }

    /**
     * Actualiza comunicados y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshComunicados(refresher: any) {
        await this.getAllComunicates();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }

    
    setFavorite(isFav, id){
        const loading = this.loading.create({});
        loading.present();
        var params = {prefix: 'com', id, favorito: !isFav };
        this.util.setFavorite(params)
            .then(()=>{loading.dismiss(); this.getAllComunicates(); })
            .catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message) })

    }
}

