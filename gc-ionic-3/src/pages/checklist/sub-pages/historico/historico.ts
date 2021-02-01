import {ApplicationRef, Component} from '@angular/core';
import {
    AlertController,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    ActionSheetController
} from 'ionic-angular';
import {config} from '../../tienda/checklist-tienda.config'
import {global} from '../../../../shared/config/global'
import {RequestProvider} from "../../../../shared/providers/request/request";
import {UtilProvider} from "../../../../shared/providers/util/util";
import {DatePipe} from "@angular/common";
import * as _ from 'lodash';
import {AmbitoPage} from "../ambito/ambito";
import {HistoricoEvaluadosPage} from "../historico-evaluados/historico-evaluados";
import {AmbitosPage} from "../ambitos/ambitos";
import {ChecklistTiendaPage} from "../../tienda/checklist-tienda";
import {FinalizadasDetallePage} from "../finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";
import {FinalizadasPage} from "../finalizadas/finalizadas";
import { ISetting } from '../../../../shared/interfaces/setting.interface';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the HistoricoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-historico',
    templateUrl: 'historico.html',
})
export class HistoricoPage {

    /*fechaDesde: Date;
    fechaHasta: Date;
    fechaDesdeString: String;
    fechaHastaString: String;*/

    today = new Date();
    hasta = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1);
    desde = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    filtros = {
        desde: this.desde + "",
        hasta: this.hasta + "",
    };

    formError: boolean = false;
    evaluados: 0;
    checklists = [];
    showChecklists = [];

    filter = [
        {"value": 100, "title": 'Todos'},
        {"value": 1, "title": 'Evaluable'},
        {"value": 0, "title": 'No Evaluable'}
    ];
    statusFilter = {
        'evaluable': ''
    };
    thisSession = {};
    suc_id = 0;
    user_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private checklistSetting: any = null;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private alert: AlertController,
        public datepipe: DatePipe,
        private applicationRef: ApplicationRef,
        private event: Events,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

    ionViewDidLoad() {
        this.firebaseAnalyticsProvider.trackView('HistoricoChecklist');
        try {
            this.checklistSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');
        } catch (e) { }
    }

    /**
     * Metodo que se ejecuta al ingresar a la vista, asigna fechas y trae historicos
     * @returns {Promise<void>}
     */
    async ionViewWillEnter() {
        this.thisSession = await this.util.getInternalSession();
        /* var today = new Date();
         this.fechaDesde = this.fechaDesde ? new Date(this.fechaDesde) : new Date(today.getFullYear(), (today.getMonth()), 1);
         this.fechaHasta = this.fechaHasta ? new Date(this.fechaHasta) : today;*/
        this.updateDates();

        this.getHistorics();

        if (!_.isUndefined(this.navParams.data.suc_id) && !_.isNull(this.navParams.data.suc_id)) {
            this.suc_id = this.navParams.data.suc_id;
        }
        if (!_.isUndefined(this.navParams.data.user_id) && !_.isNull(this.navParams.data.user_id)) {
            this.user_id = this.navParams.data.user_id;
        }
    }

    updateDates() {
        let curr_month1 = "";
        if ((this.desde.getMonth() + 1) < 10) {
            curr_month1 = "0" + (this.desde.getMonth() + 1);
            this.filtros.desde = (this.desde.getFullYear() + "-" + curr_month1)
        } else {
            this.filtros.desde = (this.desde.getFullYear() + "-" + (this.desde.getMonth() + 1))
        }
        let curr_day1 = "";
        if ((this.desde.getDate()) < 10) {
            curr_day1 = "0" + this.desde.getDate();
            this.filtros.desde = this.filtros.desde + "-" + curr_day1
        } else {
            this.filtros.desde = this.filtros.desde + "-" + this.desde.getDate();
        }
        let curr_month2 = "";
        if ((this.hasta.getMonth() + 1) < 10) {
            curr_month2 = "0" + (this.hasta.getMonth() + 1);
            this.filtros.hasta = (this.hasta.getFullYear() + "-" + curr_month2)
        } else {
            this.filtros.hasta = (this.hasta.getFullYear() + "-" + (this.hasta.getMonth() + 1))
        }
        let curr_day2 = "";
        if ((this.hasta.getDate()) < 10) {
            curr_day2 = "0" + this.hasta.getDate();
            this.filtros.hasta = this.filtros.hasta + "-" + curr_day2
        } else {
            this.filtros.hasta = this.filtros.hasta + "-" + this.hasta.getDate();
        }
    }

    /**
     * Trae registro de checklist historico según fecha seleccionada
     * @returns {Promise<{}>}
     */
    async getHistorics() {

        var d1 = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1);
        var d2 = new Date(this.filtros.hasta);

        if (d1.getTime() >= d2.getTime()) {
            this.getFilterHistorics();
        } else {
            //this.util.showAlert('Atención', 'La fecha seleccionada debe ser menor a hoy');

            let confirm = this.alert.create({
                title: 'Atención',
                message: 'La fecha seleccionada debe ser menor a hoy',
                buttons: [{
                    text: 'Aceptar',
                    handler: (data: any) => {
                        this.today = new Date();
                        this.hasta = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1);
                        this.desde = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
                        this.filtros.desde = this.desde.toISOString() + "";
                        this.filtros.hasta = this.hasta.toISOString() + "";
                        this.applicationRef.tick();
                        this.formError = true;
                        this.getFilterHistorics();
                    }
                }]
            });
            confirm.present();
        }
    }

    /**
     * Trae registro de checklist historico según fecha seleccionada
     * @returns {Promise<{}>}
     */
    async getFilterHistorics() {
        let active = this.navCtrl.getActive();
        if (active.instance instanceof HistoricoPage) {
            const loading = this.loading.create({content: 'Obteniendo historicos'});
            loading.present();
            let params = this.buildParams(this.formError);
            this.showChecklists = [];
            let data = {};
            await this.request
                .get(config.endpoints.get.checklists + params, true)
                .then((response: any) => {
                    loading.dismiss();
                    try {
                        this.statusFilter.evaluable = null;
                        this.checklists = response.data.checklist;
                        _.forEach(this.checklists, (check) => {
                            this.showChecklists.push(check)
                        });
                        this.evaluados = response.data.evaluados;
                    }
                    catch (e) {
                    }
                })
                .catch((error: any) => {
                    loading.dismiss();
                    if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
                });
            return data;
        }
    }

    /**
     * Construye url de servicios para envio segun los filtros activados
     * @returns {string}
     */
    buildParams(formError) {
        var params = "";
        if (!_.isNull(this.filtros.hasta) && !_.isUndefined(this.filtros.hasta)) {
            var tempHasta = new Date(this.filtros.hasta);
            tempHasta.setDate(tempHasta.getDate() + 1);
            let sendHasta = "";
            if (formError == true) sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + (tempHasta.getDate() - 1);
            else sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + (tempHasta.getDate());
                /* {
                if (tempHasta.getDate() >= (this.today.getDate())) {
                    sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + (this.today.getDate());
                }
                else sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + (tempHasta.getDate());
            }*/
            params = params + "?fecha=" + sendHasta;
        }

        if (!_.isNull(this.filtros.desde) && !_.isUndefined(this.filtros.desde)) {
            let tempDesde = new Date(this.filtros.desde);
            tempDesde.setDate(tempDesde.getDate() + 1);
            let sendDesde = "";
            if (formError == true) sendDesde = tempDesde.getFullYear() + "-" + (tempDesde.getMonth() + 1) + "-" + (tempDesde.getDate() - 1);
            else sendDesde = tempDesde.getFullYear() + "-" + (tempDesde.getMonth() + 1) + "-" + 1;
            params = params + '&tipo=usuario&fecha_desde=' + sendDesde;
        }
        params = params + '&tipo=usuario';
        return params
    }

    /**
     * Filtra historicos visibles segun selector de tipo
     */
    filterbyType() {
        this.showChecklists = [];
        if (!_.isUndefined(this.statusFilter.evaluable) && !_.isNull(this.statusFilter.evaluable) && this.statusFilter.evaluable != '100') {
            this.showChecklists = _.filter(this.checklists, {'evaluable': this.statusFilter.evaluable});
        } else {
            _.forEach(this.checklists, (check) => {
                this.showChecklists.push(check)
            });
        }
        this.applicationRef.tick();
    }

    /**
     * Actualiza comunicados y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshHistoric(refresher: any, from) {
        await this.getHistorics();
        if (from == "view") {
            refresher.complete();
        }
    }

    /**
     * Redirección hacia AmbitoPage
     * @param checklist_id
     */
    navigateToAmbito(checklist_id) {
        this.navCtrl.push(FinalizadasDetallePage, {
            checklist_id: checklist_id * 1,
            sucursal_id: null,
            visita_id: null,
            action_id: null,
            from: 'Historicas'
        });
    }

    presentActionSheet(item, index) {
        let hasLean = _.find(this.thisSession["usuario"].modulos, function (mod) {
            return mod.url_prefix == "checklistambitos";
        });
        let hasCompare = false;
        if (!_.isNull(hasLean) && !_.isUndefined(hasLean)) {
            if (((hasLean.menu * 1) >= 1) || (hasLean.dashboard * 1) >= 1) hasCompare = true;
        }

        if (hasCompare == true) {
            if (this.evaluados == 0) {
                let actionSheet = this.actionSheet.create({
                    title: '',
                    buttons: [
                        {
                            text: '' + this.module,
                            handler: () => {
                                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                                if (!this.checklistSetting) {
                                    this.navCtrl.setRoot(ChecklistTiendaPage);
                                    return;
                                }

                                const value: any = this.checklistSetting.value;

                                if (value === 2) {
                                    this.navCtrl.setRoot('ChecklistsBranchOfficePage');
                                    return;
                                }
                                this.navCtrl.setRoot(ChecklistTiendaPage);
                            }
                        },
                        {
                            text: 'Comparador',
                            handler: () => {
                                this.navCtrl.push(AmbitosPage);
                            }
                        },
                        {
                            text: 'Históricos',
                            handler: () => {

                            }
                        }
                    ]
                });
                actionSheet.present();
            } else {
                const actionSheet = this.actionSheet.create({
                    buttons: [
                        {
                            text: '' + this.module,
                            handler: () => {
                                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                                if (!this.checklistSetting) {
                                    this.navCtrl.setRoot(ChecklistTiendaPage);
                                    return;
                                }

                                const value: any = this.checklistSetting.value;

                                if (value === 2) {
                                    this.navCtrl.setRoot('ChecklistsBranchOfficePage');
                                    return;
                                }
                                this.navCtrl.setRoot(ChecklistTiendaPage);
                            }
                        },
                        {
                            text: 'Comparador',
                            handler: () => {
                                this.navCtrl.push(AmbitosPage);
                            }
                        },
                        {
                            text: 'Históricos',
                            handler: () => {

                            }
                        }, {
                            text: 'Evaluados no leidos',
                            handler: () => {
                                this.navCtrl.push('HistoricoEvaluadosPage');
                            }
                        }

                    ]
                });
                actionSheet.present();
            }

        } else {
            if (this.evaluados == 0) {
                let actionSheet = this.actionSheet.create({
                    title: '',
                    buttons: [
                        {
                            text: '' + this.module,
                            handler: () => {
                                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                                if (!this.checklistSetting) {
                                    this.navCtrl.setRoot(ChecklistTiendaPage);
                                    return;
                                }

                                const value: any = this.checklistSetting.value;

                                if (value === 2) {
                                    this.navCtrl.setRoot('ChecklistsBranchOfficePage');
                                    return;
                                }
                                this.navCtrl.setRoot(ChecklistTiendaPage);
                            }
                        },
                        {
                            text: 'Históricos',
                            handler: () => {

                            }
                        }
                    ]
                });
                actionSheet.present();
            } else {
                const actionSheet = this.actionSheet.create({
                    buttons: [
                        {
                            text: '' + this.module,
                            handler: () => {
                                // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                                if (!this.checklistSetting) {
                                    this.navCtrl.setRoot(ChecklistTiendaPage);
                                    return;
                                }

                                const value: any = this.checklistSetting.value;

                                if (value === 2) {
                                    this.navCtrl.setRoot('ChecklistsBranchOfficePage');
                                    return;
                                }
                                this.navCtrl.setRoot(ChecklistTiendaPage);
                            }
                        },
                        {
                            text: 'Históricos',
                            handler: () => {

                            }
                        }, {
                            text: 'Evaluados no leidos',
                            handler: () => {
                                this.navCtrl.push('HistoricoEvaluadosPage');
                            }
                        }

                    ]
                });
                actionSheet.present();
            }
        }
    }
}
