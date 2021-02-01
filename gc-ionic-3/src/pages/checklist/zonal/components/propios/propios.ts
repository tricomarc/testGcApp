import { Component } from '@angular/core';
import {
    App,
    LoadingController,
    MenuController,
    NavController,
    Events,
    ModalController
} from "ionic-angular";
import * as _ from 'lodash';
import { config } from '../../checklist-zonal.config'
import { RequestProvider } from "../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { AmbitoPage } from "../../../sub-pages/ambito/ambito";
import { global } from "../../../../../shared/config/global";
import { FinalizadasDetallePage } from "../../../sub-pages/finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";
import { ComunicadosZonalPage } from "../../../../comunicados/zonal/comunicados-zonal";
import { ChecklistZonalPage } from "../../checklist-zonal";

import { SucursalesModalComponent } from '../../../components/sucursales-modal/sucursales-modal';

import { SessionProvider } from '../../../../../shared/providers/session/session';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the ChecklistPropiosZonalComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'propios',
    templateUrl: 'propios.html'
})
export class ChecklistPropiosZonalComponent {

    private occasionalChecklists: any = [];
    private showOccasionalChecklists: boolean = true;
    private session: any = null;
    private charge: string = null;

    checklists_propios = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private request: RequestProvider,
        private menu: MenuController,
        private util: UtilProvider,
        private loading: LoadingController,
        public events: Events,
        public app: App,
        private sessionProvider: SessionProvider,
        private modalController: ModalController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
    ) {

    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistPropiosZonal' );
    }

    async ngOnInit() {

        await this.sessionProvider
            .getSession()
            .then((response: any) => { 
                this.session = response;
                if (response && response.usuario) {
                    this.charge = (
                        (
                            response.usuario.jerarquia < 98 || !response.usuario.jerarquia
                        ) ? 'branch-office' : (
                            response.usuario.jerarquia > 97 && response.usuario.jerarquia < 99
                        ) ? 'zonal' : 'country'
                    );
                }
            })
        this.occasionalChecklists = await this.getOccasionalChecklists();


        this.menu.enable(true, "menu");
        this.getAllChecklists();

        /**
             * Recibe señal para recargar checklist desde vista ambito
             */
        this.events.subscribe('returnCheckZonalList', (data) => {
            if (data === true && ChecklistZonalPage.propios == true) this.getAllChecklists();

        });
    }

    ngOnDestroy() {
        this.events.unsubscribe('returnCheckZonalList');
    }

    /**
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getAllChecklists() {
        const loading = this.loading.create({ content: 'Obteniendo checklist' });
        loading.present();
        let data = {};
        await this.request
            .post(config.endpoints.post.listaChecklistZonal, null, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    this.checklists_propios = response.data.propios;
                    _.forEach(this.checklists_propios, (check) => {
                        if (check.estado_id == 4) check.icon = 'checkmark-circle';
                        if (check.estado_id == 3) check.icon = 'checkmark-circle-outline';
                        if (check.estado_id == 2) check.icon = 'ios-radio-button-on';
                        if (check.estado_id == 1) check.icon = 'ios-radio-button-off';
                    });

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
    navigateToAmbito(checklist: any) {

        if (checklist.estado_id == 4) {

            this.app.getRootNav().push(FinalizadasDetallePage, {
                checklist_id: checklist.asignacion_id * 1,
                sucursal_id: null,
                visita_id: null,
                action_id: null,
                from: 'Finalizadas'
            });
            /*
            this.navCtrl.push(FinalizadasDetallePage, {
                checklist_id: checklist.asignacion_id * 1,
                sucursal_id: null,
                visita_id: null,
                action_id: null,
                from: 'Finalizadas'
            });*/
        } else {
            this.app.getRootNav().push(AmbitoPage, {
                checklist_id: checklist.asignacion_id,
            });

            /*this.navCtrl.push(AmbitoPage, {
                checklist_id: checklist.asignacion_id
            });*/
        }

        /*this.app.getRootNav().push(AmbitoPage, {
            checklist_id: checklist.asignacion_id,
        });*/
    }

    /**
     * Actualiza checklists y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshChecklist(refresher: any) {
        this.occasionalChecklists = await this.getOccasionalChecklists();
        await this.getAllChecklists();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }

    // Obtiene la lista de checklists ocasionales
    async getOccasionalChecklists() {
        let occasionalChecklists = [];

        await this.request
            .get(config.endpoints.get.occasionalChecklists, true)
            .then((response: any) => {
                if (response && response.data && response.data.length) {
                    occasionalChecklists = response.data;
                }
            })
            .catch((error: any) => { });
        return occasionalChecklists;
    }

    // Genera la asignación del checklist ocasional
    async assignChecklist(checklist: any) {
        let body: any = { check_id: checklist.id };
        let branchOfficeId: any = null;

        if(this.charge !== 'branch-office' && checklist.sucursales && checklist.sucursales.length) {
            await this.selectBranchOffice(checklist.sucursales)
            .then((branchOffice: any) => {
                if(branchOffice && branchOffice.id) {
                    branchOfficeId = branchOffice.id;
                }
            });

            if(!branchOfficeId) return;
        }

        body.sucursal_id = branchOfficeId;

        const loading = this.loading.create({ content: 'Asignando checklist.' });
        loading.present();

        this.request
            .post(config.endpoints.post.assignChecklist, body, true)
            .then((response: any) => {
                loading.dismiss();
                if (response && response.data && response.data.asignacion_id) {
                    this.navigateToAmbito({ asignacion_id: response.data.asignacion_id });
                    return;
                }
                this.util.showToast((response.message ? response.message : 'No ha sido posible asignar el checklist ocasional, intente nuevamente.'), 3000);
            })
            .catch((error: any) => {
                this.util.showToast('No ha sido posible asignar el checklist ocasional, intente nuevamente.', 3000);
                loading.dismiss();
            });
    }

    async selectBranchOffice(branchOffices: any) {
        return new Promise((resolve) => {
            const modal = this.modalController.create(SucursalesModalComponent, { branchOffices: branchOffices});
            modal.present();
            modal.onDidDismiss((params: any) => {
                resolve(params);
            });
        });
    }
}