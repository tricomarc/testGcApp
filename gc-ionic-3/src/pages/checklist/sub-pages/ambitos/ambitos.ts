import { ApplicationRef, Component } from '@angular/core';
import {
    ActionSheetController,
    AlertController,
    Events,
    IonicPage,
    LoadingController, MenuController,
    ModalController,
    NavController,
    NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import { DatePipe } from "@angular/common";
import { SessionProvider } from "../../../../shared/providers/session/session";
import { UtilProvider } from "../../../../shared/providers/util/util";
import { Device } from "@ionic-native/device";
import { Storage } from "@ionic/storage";
import { RequestProvider } from "../../../../shared/providers/request/request";
import { config } from '../../tienda/checklist-tienda.config';
import { global } from '../../../../shared/config/global';
import { HistoricoPage } from "../historico/historico";
import { ChecklistTiendaPage } from "../../tienda/checklist-tienda";
import { ISetting } from '../../../../shared/interfaces/setting.interface';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the AmbitosPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-ambitos',
    templateUrl: 'ambitos.html',
})
export class AmbitosPage {

    hasta = new Date();
    desde = new Date(this.hasta.getFullYear(), this.hasta.getMonth(), 1);
    filtros = {
        desde: this.desde + "",
        hasta: this.hasta + "",
    };
    /*  fechaDesde = this.desde + "";
      fechaHasta = this.hasta + "";*/

    /* fechaDesdeString: String;
     fechaHastaString: String;*/

    cabeceras = [];
    promedios = [];
    parametros = [];

    selectedType = "";
    searchComunicate = "";

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private checklistSetting: any = null;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public storage: Storage,
        private device: Device,
        private applicationRef: ApplicationRef,
        public modalCtrl: ModalController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private alert: AlertController,
        public datepipe: DatePipe,
        private event: Events,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {

        /*var today = new Date();
        this.fechaDesde = new Date(today.getFullYear(), (today.getMonth()), 1);
        this.fechaHasta = today;*/
    }

    ionViewDidLoad() {
        this.firebaseAnalyticsProvider.trackView('AmbitosChecklist');
        try {
            const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

            if (auxSetting && auxSetting.params) {
                this.checklistSetting = { value: JSON.parse(auxSetting.params).version }

            } else { this.checklistSetting = null }
        } catch (e) { }
    }

    ionViewWillEnter() {
        this.updateDates();
        this.getInfo();
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
     * Obtiene todos los comunicados que cumplen con los filtro de busqueda
     * @returns {Promise<{}>}
     */
    async getInfo() {
        let data = {};
        let params = this.buildParams();

        if (params != null) {
            const loading = this.loading.create({ content: 'Obteniendo Ámbitos' });
            loading.present();

            await this.request
                .get(config.endpoints.get.comparador + params, true)
                .then((response: any) => {
                    loading.dismiss();
                    try {
                        data = response.data;
                        this.cabeceras = data["cabeceras"];
                        this.promedios = data["promedios"];
                        this.parametros = data["parametros"];
                        for (var i = 0; i < this.promedios.length; i++) {
                            var promedioSucursal = this.promedios[i].promedio_sucursal;
                            var promedioZona = this.promedios[i].promedio_zona;
                            var promedioPais = this.promedios[i].promedio_pais;
                            if (promedioSucursal >= 90) {
                                this.promedios[i]['colorSucursal'] = 'balanced';
                            }
                            if (promedioSucursal >= 50 && promedioSucursal < 89) {
                                this.promedios[i]['colorSucursal'] = 'energized';
                            }
                            if (promedioSucursal <= 49) {
                                this.promedios[i]['colorSucursal'] = "danger";
                            }
                            if (promedioZona >= 90) {
                                this.promedios[i]['colorZona'] = 'balanced';
                            }
                            if (promedioZona >= 50 && promedioZona < 89) {
                                this.promedios[i]['colorZona'] = 'energized';
                            }
                            if (promedioZona <= 49) {
                                this.promedios[i]['colorZona'] = "danger";
                            }
                            if (promedioPais >= 90) {
                                this.promedios[i]['colorPais'] = 'balanced';
                            }
                            if (promedioPais >= 50 && promedioPais < 89) {
                                this.promedios[i]['colorPais'] = 'energized';
                            }
                            if (promedioPais <= 49) {
                                this.promedios[i]['colorPais'] = "danger";
                            }
                        }
                    }
                    catch (e) {
                    }
                })
                .catch((error: any) => {
                    loading.dismiss();
                    if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
                });
        }

        return data;
    }


    /**
     * Construye url de servicios para envio segun los filtros activados
     * @returns {string}
     */
    buildParams() {
        var params = "";
        let tempDesde = new Date(this.filtros.desde);
        let tempHasta = new Date(this.filtros.hasta);

        if (!_.isNull(this.filtros.desde) && !_.isUndefined(this.filtros.desde)) {
            tempDesde.setDate(tempDesde.getDate() + 1);
            let sendDesde = tempDesde.getFullYear() + "-" + (tempDesde.getMonth() + 1) + "-" + tempDesde.getDate();
            params = params + "?fecha_desde=" + sendDesde;
        }
        if (!_.isNull(this.filtros.hasta) && !_.isUndefined(this.filtros.hasta)) {
            tempHasta.setDate(tempHasta.getDate() + 1);
            let sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + tempHasta.getDate();
            params = params + "&fecha_hasta=" + sendHasta;
        }
        params = params + '&tipo=usuario';
        if (tempDesde > tempHasta) {
            let alert = this.alert.create({
                title: 'Alerta',
                subTitle: 'La fecha de inicio debe ser menor a la fecha de término',
                buttons: [{
                    text: 'Aceptar',
                    handler: () => {
                        this.filtros = {
                            desde: this.desde + "",
                            hasta: this.hasta + "",
                        };
                        this.updateDates();
                        this.getInfo();
                    }
                }],
            });
            alert.present();
            params = null;
        }
        return params
    }

    /**
     * Elimina fechas seleccionadas en filtro para volver al filtro por defecto
     */
    borrarFecha() {
        this.filtros = {
            desde: this.desde + "",
            hasta: this.hasta + "",
        };
        this.updateDates();
        this.getInfo();
    };

    /**
     * Muestra calendario para filtro de fechas
     */
    /* showCalendarModal() {
         let initDate = this.datepipe.transform(this.fechaDesde, 'yyyy-MM-dd');
         let endDate = this.datepipe.transform(this.fechaHasta, 'yyyy-MM-dd');
         let alert = this.alert.create({
             title: '<span class="positive"><b>Filtro por período</b></span>',
             buttons: [{
                 text: 'Cancelar',
                 handler: () => {
                 }
             },{
                 text: 'Aceptar',
                 handler: data => {
                     this.updateFilters(data[0], data[1]);
                 }
             }],
         });
         alert.addInput({
             type: 'date',
             label: 'Fecha Inicial',
             value: initDate + ""
         });
         alert.addInput({
             type: 'date',
             label: 'Fecha Final',
             value: endDate + ""
         });
         alert.present();
     }*/

    /**
     * Actualiza filtro de comunicados tras seleccionar fechas
     * @param value1: Fecha de Inicio
     * @param value2: Fecha de Fin
     */
    updateFilters(value1, value2) {
        /* this.fechaDesde = new Date(value1) + "";
         this.fechaHasta = new Date(value2) + "";*/
        /*this.fechaDesde.setDate(this.fechaDesde.getDate() + 1);
        this.fechaHasta.setDate(this.fechaHasta.getDate() + 1);*/
        this.getInfo();
    }

    presentActionSheet(item, index) {
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
                        this.navCtrl.push(HistoricoPage);
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
