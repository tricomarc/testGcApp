import { ApplicationRef, Component } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import * as _ from 'lodash';
import { Storage } from "@ionic/storage";
import { SessionProvider } from "../../../../shared/providers/session/session";
import { ChecklistTiendaPage } from "../../../checklist/tienda/checklist-tienda";
import { GuardadosPage } from "../guardados/guardados";
import { FinalizadasPage } from "../../../checklist/sub-pages/finalizadas/finalizadas";
import { global } from '../../../../shared/config/global'
import { config } from "../../visita.config";
import { RequestProvider } from "../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../shared/providers/util/util";

/**
 * Generated class for the VisitaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-visita-sucursal',
    templateUrl: 'sucursal.html',
})
export class VisitaSucursalPage {

    thisSession = null;
    visita_tienda = {};
    sucursal = {};
    sucursales = [];
    markers = [];
    userSettingsView: boolean = false;
    hoy = new Date();
    isString: boolean = false;
    ready: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private loading: LoadingController,
        private request: RequestProvider,
        private applicationRef: ApplicationRef,
        private util: UtilProvider,
        private menu: MenuController,
        public actionSheetCtrl: ActionSheetController) {

    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    ionViewDidLoad() {
        if (global.isString) {
            this.isString = true;
        }

        if (!_.isUndefined(this.navParams.data.sucursal) && !_.isNull(this.navParams.data.sucursal)) {
            console.log("llego sucursal ", this.navParams.data.sucursal);
            this.getDatafromMemory(this.navParams.data.sucursal)
        }
    }

    async getDatafromMemory(suc_id) {
        this.thisSession = await this.util.getInternalSession();
        console.log("thisSession ", this.thisSession);
        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then((val) => {
            if (val) this.visita_tienda = JSON.parse(val);
            console.log('visita_tienda_' + this.thisSession['usuario'].id, this.visita_tienda);

            this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': suc_id + '' });
            this.markers = this.visita_tienda['markers'];

            if (_.isUndefined(this.sucursal) || _.isNull(this.sucursal)) {
                console.log("buscando")
                if (!this.isString) {
                    this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': suc_id });
                    console.log("pre actualizar", this.visita_tienda)
                    if (_.isUndefined(this.sucursal) || _.isNull(this.sucursal)) {
                        this.actualizarData(this.thisSession['usuario'].zona_id).then(resp => {
                            this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then((val) => {
                                if (val) this.visita_tienda = JSON.parse(val);

                                this.visita_tienda['markers'] = this.markers;
                                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                                console.log('visita_tienda_' + this.thisSession['usuario'].id, this.visita_tienda);
                                this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': suc_id });
                                console.log('sucursal ', this.sucursal);
                                this.applicationRef.tick();
                                if (_.isUndefined(this.sucursal) || _.isNull(this.sucursal)) {
                                    this.util.showAlert("Atención", "Las sucursales no pueden ser cargadas, por favor intente mas tarde.");
                                } else {
                                    this.ready = true;
                                }
                            });
                        });
                    } else {
                        this.ready = true;
                    }
                }
            } else {
                this.ready = true;
            }
            console.log('sucursal ', this.sucursal);
        });
    }

    async actualizarData(itemZona) {
        const loading = this.loading.create({ content: 'Obteniendo datos' });
        loading.present();
        let data = {};
        console.log("itemZona ", itemZona);
        var endpoint = "";
        if (_.isUndefined(itemZona)) {
            endpoint = "?zona_id=&tipo=usuario";
        } else endpoint = "?zona_id=" + itemZona + "&tipo=usuario";

        console.log("endpoint ", endpoint)
        await this.request
            .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
            .then((response: any) => {
                try {
                    console.log("response ", response);

                    if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                        if (!_.isUndefined(response.data.sucursales_sin_responder) && !_.isNull(response.data.sucursales_sin_responder)) {
                            this.sucursales = response.data.sucursales_sin_responder.sucursales;

                            let arr: any = [];

                            _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                                if (visit.estado_id !== 4) {
                                    visit.modified = true;
                                    let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
                                    if (visit_checklist) visit.checklist = visit_checklist;
                                    arr.push(visit);
                                }
                            });

                            this.visita_tienda = {
                                sucursales: response.data.sucursales_sin_responder.sucursales,
                                zonas: response.data.sucursales_sin_responder.zonas,
                                checklists: response.data.sucursales_sin_responder.checklists,
                                visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                                respuestas: response.data.sucursales_sin_responder.respuestas,
                                estados_visita: response.data.sucursales_sin_responder.estado_visita,
                                visitas: arr
                            };


                            this.visita_tienda['fechaActualizacion'] = new Date();
                            this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                            this.applicationRef.tick();
                        }
                    }
                    if (this.sucursales.length <= 0) {
                        this.util.showAlert("Atención", "Su usuario no posee sucursales asociadas");
                    }
                    console.log("sucursales ", this.sucursales);
                    console.log("zonas visita", this.visita_tienda['zonas']);
                    loading.dismiss();
                }
                catch (e) {
                    console.log("error ", e);
                    this.util.showToast(e, 3000);
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                console.log("error ", error);
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    redirectToChecklist(sucursal_id) {
        console.log("sucursal_id ", sucursal_id);
        this.navCtrl.push(ChecklistTiendaPage, {
            sucursal: sucursal_id,
        });
    }

    redirectToGuardados(sucursal_id) {
        console.log("sucursal_id ", sucursal_id);
        this.navCtrl.push(GuardadosPage, {
            sucursal: sucursal_id,
        });
    }

    redirectToFinalizados(sucursal_id, action) {
        console.log("sucursal_id ", sucursal_id);
        this.navCtrl.push(FinalizadasPage, {
            sucursal: sucursal_id,
            action: action
        });
    }
}
