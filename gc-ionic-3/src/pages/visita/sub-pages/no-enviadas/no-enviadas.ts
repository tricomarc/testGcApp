import { ApplicationRef, Component, NgZone, ViewChild } from '@angular/core';
import {
    AlertController,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    ActionSheetController,
    Navbar
} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as _ from 'lodash';
import { SessionProvider } from "../../../../shared/providers/session/session";
import { config } from "./no-enviadas.config";
import { RequestProvider } from "../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../shared/providers/util/util";
import { global } from "../../../../shared/config/global";
import { ChecklistTiendaPage } from "../../../checklist/tienda/checklist-tienda";

import { AmbitoPage } from '../../../checklist/sub-pages/ambito/ambito';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the NoEnviadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'no-enviadas',
    templateUrl: 'no-enviadas.html',
})
export class NoEnviadasPage {

    historicosGuardados = [];
    sucursales = [];
    visitas = [];
    checklists = [];
    respuestas = [];
    arreglo_visitas = [];
    arreglo_respuestas = [];
    temp_respuestas = [];
    visita_tienda = {};
    thisSession = null;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private completed_visits: any = [];
    private incomplete_visits: any = [];

    @ViewChild(Navbar) navBar: Navbar;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private applicationRef: ApplicationRef,
        private alert: AlertController,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private zone: NgZone,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    async ionViewWillEnter() {
        this.menu.enable(false, "menu");
        this.thisSession = await this.util.getInternalSession();
        this.listarHistoricosGuardados();
    }

    ionViewDidLoad() {
        this.navBar.backButtonClick = (e: UIEvent) => {
            if (this.navParams.data.from_checklist) {
                try {
                    let page = this.navCtrl.getViews().find((view) => {
                        return view.instance instanceof AmbitoPage;
                    });
                    if (page) {
                        this.navCtrl.popTo(page);
                        return;
                    }
                    this.navCtrl.popToRoot();
                } catch (e) {
                    this.navCtrl.popToRoot();
                }
                return;
            }
            this.navCtrl.pop();
        }
    }

    /*async ionViewDidLoad() {
        this.thisSession = await this.util.getInternalSession();
        this.listarHistoricosGuardados();
    }*/

    listarHistoricosGuardados() {
        this.historicosGuardados = [];

        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
            if (val) {
                this.visita_tienda = JSON.parse(val);
                this.sucursales = this.visita_tienda['sucursales'];
                this.visitas = this.visita_tienda['visitas'];
                this.checklists = this.visita_tienda['checklist_visita'];
                this.respuestas = this.visita_tienda['respuestas'];

                var visits = this.visitas;
                var checks = this.checklists;
                var sucs = this.sucursales;

                var historics = [];

                _.forEach(visits, function(visita) {
                    if (visita.modified) {
                        var checklist = _.find(checks, { 'id': visita.checklist_id + "" });
                        if (_.isUndefined(checklist) || _.isNull(checklist)) {
                            checklist = _.find(checks, { 'id': visita.checklist_id * 1 });
                        }
                        var sucursal = _.find(sucs, { 'id': visita.sucursal_id + "" });
                        if (_.isUndefined(sucursal) || _.isNull(sucursal)) {
                            sucursal = _.find(sucs, { 'id': visita.sucursal_id * 1 });
                        }

                        // if (!_.isUndefined(checklist) && !_.isNull(checklist) && !_.isUndefined(sucursal) && !_.isNull(sucursal)) {
                        if (!_.isUndefined(sucursal) && !_.isNull(sucursal)) {
                            var newVisit = {
                                visita_id: visita.visita_id,
                                checklist: checklist ? checklist : (visita.checklist ? visita.checklist : {}),
                                sucursal_id: visita.sucursal_id,
                                sucursal_nombre: sucursal.nombre,
                                nombre_estado: visita.nombre_estado,
                                fecha: visita.fecha,
                                estado_id: visita.estado_id
                            };
                            historics.push(newVisit);
                        }
                    }
                });
                this.zone.run(() => {
                    this.historicosGuardados = historics;

                    this.completed_visits = _.filter(this.historicosGuardados, (visit) => {
                        return visit.estado_id === 4;
                    });

                    this.incomplete_visits = _.filter(this.historicosGuardados, (visit) => {
                        return visit.estado_id !== 4;
                    });

                    this.totalVisitasYRespuestas();
                });

            } else {
            }
        });
    }

    totalVisitasYRespuestas() {
        this.zone.run(() => {
            this.arreglo_visitas = _.filter(this.visitas, { 'modified': true });
            this.arreglo_respuestas = _.filter(this.respuestas, { 'modified': true });
        });
    }

    /*// Verifica que la respuesta a una pregunta esté completa
    checkAnswer(answer: any) {
        if(answer.tipo_id === 1) {
            return true;
        } 
        if(answer.tipo_id === 2) {
            return true;
        }
        if(answer.tipo_id === 3) {
            return true;
        }
        if(answer.tipo_id === 4) {
            return true;
        }
        return false;
    }*/


    refreshIndividualVisit(visita) {
        var visitas = _.filter(this.visitas, { id: visita.visita_id });
        var respuestas = _.filter(this.respuestas, { visita_id: visita.visita_id });
        this.sendOfflineData(visitas, respuestas, 'individual', visita);
    }


    async sendOfflineData(visitas, respuestas, update, visit) {
        const loading = this.loading.create({ content: 'Enviando checklists' });
        loading.present();
        let visitasTotales = visitas;
        let arreglo_visitas = _.filter(visitasTotales, { 'modified': true });
        let arreglo_respuestas = _.filter(respuestas, { 'modified': true });

        this.temp_respuestas = [];


        this.util.updateVisitResps(arreglo_respuestas, visit).then(async value => {

            let temp_respuestas = value;

            let sendResp = _.concat(arreglo_respuestas, JSON.parse(JSON.stringify(temp_respuestas)));
            var params = {
                data: {
                    visitas_respuestas: arreglo_visitas,
                    respuestas: sendResp
                }
            };
            console.log('params', params);
            let data = {};
            await this.request
                .post(config.endpoints.post.refresh, params, false)
                .then((response: any) => {
                    loading.dismiss();
                    try {
                        if (response.status == true) {
                            this.util.showToast("Datos enviados correctamente", 3000);

                            this.firebaseAnalyticsProvider.trackButtonEvent( "EnviarChecklists" );
                            if (update == 'individual') {
                                // this.getIndividualInfo(response);
                                this.getAllInfo();
                            } else if (update == 'todas') {
                                this.getAllInfo();
                            }
                            /* const confirm = this.alert.create({
                                 title: 'Atención',
                                 message: response.message,
                                 buttons: [{
                                     text: 'Aceptar',
                                     handler: () => {
                                         if (update == 'individual') {
                                             this.getIndividualInfo(response);
                                         } else if (update == 'todas') {
                                             this.getAllInfo();
                                         }
                                     }
                                 }]
                             });
                             confirm.present();*/
                        } else {
                            this.util.showToast("No ha sido posible enviar los checklists. Por favor, intente nuevamente.", 3000);
                        }
                    }
                    catch (e) {
                        this.util.showAlert("Atención", "Ocurrió un problema, por favor intente de nuevo más tarde");
                        loading.dismiss();
                    }

                })
                .catch((error: any) => {
                    console.log('offline data error', error)
                    loading.dismiss();
                    this.util.showAlert("Atención", "Ocurrió un problema, por favor intente de nuevo más tarde");
                });
            return data;
        });


        /*let temp_respuestas = await this.util.updateVisitResps(arreglo_respuestas, visit);
        */



    }

    async getAllInfo() {
        const loading = this.loading.create({ content: 'Obteniendo información.' });
        loading.present();

        var endpoint = "?zona_id=&tipo=usuario";
        let data = {};
        await this.request
            .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
            .then((response: any) => {
                console.log('getAllInfo', response)
                try {
                    if (response.code == 200) {
                        if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                            if (!_.isUndefined(response.data.sucursales_sin_responder) && !_.isNull(response.data.sucursales_sin_responder)) {


                                let arr: any = [];

                                _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                                    if (visit.estado_id != 4) {
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

                                if (this.incomplete_visits.length > 0) {
                                    this.zone.run(() => {
                                        this.completed_visits = [];
                                        this.arreglo_respuestas = [];
                                    });

                                    let alert = this.alert.create({
                                        title: 'Atención',
                                        subTitle: `Hemos enviado tus checklists, pero aún ${this.incomplete_visits.length === 1 ? "queda 1" : "quedan " + this.incomplete_visits.length} sin finalizar.`,
                                        buttons: [{
                                            text: 'Permanecer en la vista',
                                            handler: () => {
                                            }
                                        }, {
                                            text: 'Inicio',
                                            handler: () => {
                                                this.navCtrl.popToRoot();
                                            }
                                        }],
                                    });
                                    alert.present();
                                } else this.navCtrl.popToRoot();


                            } else {
                                this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                            }
                        } else {
                            this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                        }
                        if (this.sucursales.length <= 0) {
                            this.util.showAlert("Atención", "Su usuario no posee sucursales asociadas");
                        }
                    } else {
                        this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                    }
                    loading.dismiss();
                }
                catch (e) {
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    getIndividualInfo(dataPost) {


        if (dataPost.data.visita.length > 0) {
            var visita = dataPost.data.visita[0];
            var foundVisit = _.find(this.visita_tienda['visitas'], { id: visita.visita_id });
            var index = _.findIndex(this.visita_tienda['visitas'], { id: visita.visita_id });
            if (!_.isUndefined(foundVisit) && !_.isNull(foundVisit) && index > -1) {
                foundVisit.modified = false;
                this.visita_tienda['visitas'][index] = foundVisit;
                if (dataPost.data.respuestas.length > 0) {
                    _.forEach(this.visita_tienda['respuestas'], function(resp) {
                        if (resp.visita_id == visita.visita_app_id) {
                            resp.modified = false;
                        }
                    });
                }
                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda)).then((val) => {
                    this.listarHistoricosGuardados();
                });
            } else {
                var foundVisit = _.find(this.visita_tienda['visitas'], { id: visita.visita_app_id });
                var index = _.findIndex(this.visita_tienda['visitas'], { id: visita.visita_app_id });

                if (!_.isUndefined(foundVisit) && !_.isNull(foundVisit) && index > -1) {
                    foundVisit.modified = false;
                    this.visita_tienda['visitas'][index] = foundVisit;
                    if (dataPost.data.respuestas.length > 0) {
                        _.forEach(this.visita_tienda['respuestas'], function(resp) {
                            if (resp.visita_id == visita.visita_app_id) {
                                resp.modified = false;
                            }
                        });
                    }
                    this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda)).then((val) => {
                        this.listarHistoricosGuardados();
                    });
                }
                //this.util.showAlert("Atención", "Ocurrió un problema al actualizar las visitas");
            }
        }
    }

    showVisitActionSheet() {
        const actionSheet = this.actionSheet.create({
            buttons: [
                {
                    text: 'Inicio',
                    handler: () => {
                        this.navCtrl.popToRoot();
                    }
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push('HistoricasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }

    /**
     * Redireccion a formularios de sucursal
     * @param sucursal
     */
    redirectToChecklist(data) {
        if (data.estado_id === 4) {

        } else {
            this.navCtrl.push(AmbitoPage, {
                checklist_id: data.checklist.id,
                visita: data,
                visita_id: data.visita_id,
                sucursal_id: data.sucursal_id
            });
        }
        /*this.navCtrl.push(ChecklistTiendaPage, {
            sucursal: sucursal,
        });*/
    }
}
