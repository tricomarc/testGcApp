import { Component, Renderer2, RendererStyleFlags2, ViewChild } from '@angular/core';
import { IonicPage, LoadingController, NavController, NavParams } from 'ionic-angular';
import { IonicSelectableComponent } from 'ionic-selectable';

import { config } from '../../ripley/kpi-ripley.config'
import { RequestProvider } from "../../../../../shared/providers/request/request";
import { UtilProvider } from "../../../../../shared/providers/util/util";
import { RankingKpiPage } from "../../../components/ranking/ranking";/*
import { Page5Page } from "../../maquetas/chat/page5/page5";*/
import * as _ from 'lodash';
import { global } from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@Component({
    selector: 'page-indicator-departments-ripley',
    templateUrl: 'indicator-departments-ripley.html',
})
export class IndicatorDepartmentsRipleyPage {

    @ViewChild('branchOfficeSearch') branchOfficeSearch: IonicSelectableComponent;

    thisSession = null;
    indicators = {};
    div = {};
    dataid = 0;
    sucId = 0;
    divisiones = "";

    public rangeObject: any = { lower: 0, upper: 0 };

    private rawBranchOffices: any = [];
    private branchOffices: any = [];
    private selectedBranchOffice: any = null;

    private requesting: boolean = false;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private util: UtilProvider,
        private request: RequestProvider,
        private loading: LoadingController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Solicita al servicio la lista de zonas, y arma un arreglo con sucursales y la retorna
    async getBranchOffices() {
        let branchOffices: any = [];
        await this.request
            .get(config.endpoints.newApi.get.zones, true)
            .then((response: any) => {
                try {
                    if (response.data && response.data.length) {
                        _.forEach(response.data, (zone: any) => {
                            _.forEach(zone.sucursales, (branchOffice: any) => {
                                branchOffice.zone = { id: zone.id, name: zone.nombre };
                                branchOffices.push(branchOffice);
                            });
                        });
                    }
                } catch (e) { }
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener las zonas');
            });
        return branchOffices;
    }

    onBranchOfficeChange() {
        this.getIndicator();
    }

    setSelfBranchOffice() {
        if (this.rawBranchOffices.length) {
            if (
                this.thisSession
                && this.thisSession.usuario
                && this.thisSession.usuario.sucursales
                && this.thisSession.usuario.sucursales.length
                && !(this.thisSession.usuario.jerarquia > 97)
            ) {
                let selfBranchOffice: any = _.find(this.rawBranchOffices, { id: this.thisSession.usuario.sucursales[0] });
                if (selfBranchOffice) {
                    this.selectedBranchOffice = selfBranchOffice;
                    return;
                }
            }
            this.selectedBranchOffice = this.rawBranchOffices[0];
        }
    }

    // Filtra la lista de sucursales por su nombre
    onBranchOfficeSearch(event: any) {
        if (event.text) {
            this.branchOffices = _.filter(this.rawBranchOffices, (branchOffice) => {
                return _.includes(this.util.cleanText(branchOffice.nombre), this.util.cleanText(event.text));
            });
            return;
        }
        this.branchOffices = this.rawBranchOffices;
    }

    closeBranchOfficeSearch() {
        this.branchOfficeSearch.close();
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'IndicatorDepartmentsRipley' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'IndicatorDepartmentsRipley', 'KPI' );

        this.thisSession = await this.util.getInternalSession();

        this.requesting = true;

        let branchOffices = await this.getBranchOffices();

        this.requesting = false;

        this.branchOffices = branchOffices;
        this.rawBranchOffices = branchOffices;
        

        if(!this.navParams.data.selectedBranchOffice) this.setSelfBranchOffice();
        else this.selectedBranchOffice = this.navParams.data.selectedBranchOffice;

        if (!_.isUndefined(this.navParams.data.divisiones) && !_.isNull(this.navParams.data.divisiones)) {
            this.divisiones = this.navParams.data.divisiones;
        } else {
            this.divisiones = 'Divisiones';
        }
        if (!_.isUndefined(this.navParams.data.division) && !_.isNull(this.navParams.data.division)) {
            this.div = this.navParams.data.division;
        }
        if (!_.isUndefined(this.navParams.data.dataId) && !_.isNull(this.navParams.data.dataId)) {
            this.dataid = this.navParams.data.dataId;
        }
        if (!_.isUndefined(this.navParams.data.sucId) && !_.isNull(this.navParams.data.sucId)) {
            this.sucId = this.navParams.data.sucId;
        }

        this.getIndicator();
    }

    /**
     * Trae variables de indicador segun departamento, división o sucursal
     * @returns {Promise<{}>}
     */
    async getIndicator() {

        if (!this.selectedBranchOffice) {
            this.util.showToast('No hay datos para mostrar.', 3000);
            return;
        }

        const loading = this.loading.create({ content: 'Obteniendo Información' });
        loading.present();

        let suc = 0;
        let endpoint = "";
        if (this.divisiones == "Divisiones") {
            suc = this.thisSession.usuario.sucursales[0];
            endpoint = "?tipo=sucursal&dataId=" + this.selectedBranchOffice.id + "&indicadorId=1";

            let data = {};
            await this.request
                .get(config.endpoints.newApi.get.kpi_indicator + endpoint, true)
                .then((response: any) => {
                    try {
                        if(!response) {
                            this.util.showToast('No ha sido posible obtener la información del tacómetro.', 3000);
                            loading.dismiss();
                            return;
                        }

                        if (response.code == 200) {
                            this.indicators = response.data;

                            if (this.indicators['divisiones']) {
                                this.indicators['divisiones'] = Object.keys(this.indicators['divisiones']).map(key => {
                                    return this.indicators['divisiones'][key];
                                });
                            }

                            this.rangeObject = { lower: response.data.venta, upper: response.data.meta };

                            if (!_.isNull(this.indicators['meta_dia']) && !_.isUndefined(this.indicators['meta_dia'])) {
                                const parent: HTMLElement = document.getElementById('moneyRange1');
                                const child = parent.children[1];
                                const child2 = child.children[2];
                                const child3 = child2.children[0];

                                if (this.indicators['cumplimiento'] > 100) child3.setAttribute('style', 'background-color: #468966 !important');
                                else if (this.indicators['cumplimiento'] < 100 && this.indicators['cumplimiento'] >= 95) child3.setAttribute('style', 'background-color: #F2CE1D !important');
                                else child3.setAttribute('style', 'background-color: #f53d3d !important');
                            }

                            if (this.indicators['cumplimiento'] && this.countDecimals(this.indicators['cumplimiento']) >= 2) this.indicators['cumplimiento'] = this.indicators['cumplimiento'].toFixed(2);

                            if (this.indicators['trafico_variacion'] && this.countDecimals(this.indicators['trafico_variacion']) >= 2) this.indicators['trafico_variacion'] = this.indicators['trafico_variacion'].toFixed(2);
                            if (this.indicators['conversion_variacion'] && this.countDecimals(this.indicators['conversion_variacion']) >= 2) this.indicators['conversion_variacion'] = this.indicators['conversion_variacion'].toFixed(2);
                            if (this.indicators['unidad_boleta_variacion'] && this.countDecimals(this.indicators['unidad_boleta_variacion']) >= 2) this.indicators['unidad_boleta_variacion'] = this.indicators['unidad_boleta_variacion'].toFixed(2);

                            if (this.indicators['unidad_boleta'] && this.countDecimals(this.indicators['unidad_boleta']) >= 2) this.indicators['unidad_boleta'] = this.indicators['unidad_boleta'].toFixed(2);
                            if (this.indicators['conversion'] && this.countDecimals(this.indicators['conversion']) >= 2) this.indicators['conversion'] = this.indicators['conversion'].toFixed(2);
                            if (this.indicators['trafico'] && this.countDecimals(this.indicators['trafico']) >= 2) this.indicators['trafico'] = this.indicators['trafico'].toFixed(2);

                            if (this.indicators['divisiones'] && this.indicators['divisiones'].length > 0) {
                                _.forEach(this.indicators['divisiones'], (division) => {
                                    if (division.venta && this.countDecimals(division.venta) >= 2) division.venta = division.venta.toFixed(2);
                                    if (division.cumplimiento && this.countDecimals(division.cumplimiento) >= 2) division.cumplimiento = division.cumplimiento.toFixed(2);

                                });
                            }
                        } else {
                            this.util.showToast(response.message, 3000);
                        }
                    }
                    catch (e) { }
                    loading.dismiss();
                })
                .catch((error: any) => {
                    loading.dismiss();
                    if (error && error.message) this.util.showToast(error.message, 3000);
                });
            return data;
        } else {
            /*  if (this.divisiones == "Departamentos") {
                  suc = this.div['id'];
                  endpoint = "?areaId=" + suc;
              } else {
                  suc = this.div['id'];
                  endpoint = "?areaId=" + suc;
              }*/
            suc = this.div['id'];
            endpoint = "?areaId=" + suc + "&dataId=" + this.sucId;

            let data = {};
            await this.request
                .get(config.endpoints.newApi.get.kpi_indicator + endpoint, true)
                .then((response: any) => {
                    try {
                        if(!response) {
                            this.util.showToast('No ha sido posible obtener la información del tacómetro.', 3000);
                            loading.dismiss();
                            return;
                        }

                        if (response.code == 200) {
                            this.indicators = response.data;

                            if (this.indicators['departamentos']) {
                                this.indicators['departamentos'] = Object.keys(this.indicators['departamentos']).map(key => {
                                    return this.indicators['departamentos'][key];
                                });
                            }
                            //this.indicators['departamentos'] = this.indicators['divisiones'];

                            if (this.divisiones === 'Departamentos') {

                                if (!_.isNull(this.indicators['meta_dia']) && !_.isUndefined(this.indicators['meta_dia'])) {
                                    const parent: HTMLElement = document.getElementById('moneyRange2');
                                    const child = parent.children[1];
                                    const child2 = child.children[2];
                                    const child3 = child2.children[0];

                                    if (this.indicators['cumplimiento'] > 100) child3.setAttribute('style', 'background-color: #468966 !important');
                                    else if (this.indicators['cumplimiento'] < 100 && this.indicators['cumplimiento'] >= 95) child3.setAttribute('style', 'background-color: #F2CE1D !important');
                                    else child3.setAttribute('style', 'background-color: #f53d3d !important');
                                }
                            } else if (this.divisiones === 'End') {
                                const parent: HTMLElement = document.getElementById('moneyRange3');
                                if (!_.isNull(this.indicators['meta_dia']) && !_.isUndefined(this.indicators['meta_dia'])) {
                                    const child = parent.children[1];
                                    const child2 = child.children[2];
                                    const child3 = child2.children[0];

                                    if (this.indicators['cumplimiento'] > 100) child3.setAttribute('style', 'background-color: #468966 !important');
                                    else if (this.indicators['cumplimiento'] < 100 && this.indicators['cumplimiento'] >= 95) child3.setAttribute('style', 'background-color: #F2CE1D !important');
                                    else child3.setAttribute('style', 'background-color: #f53d3d !important');
                                }
                            }
                            this.rangeObject = { lower: response.data.venta, upper: response.data.meta };

                            if (this.indicators['cumplimiento'] && this.countDecimals(this.indicators['cumplimiento']) >= 2) this.indicators['cumplimiento'] = this.indicators['cumplimiento'].toFixed(2);
                            if (this.indicators['trafico_variacion'] && this.countDecimals(this.indicators['trafico_variacion']) >= 2) this.indicators['trafico_variacion'] = this.indicators['trafico_variacion'].toFixed(2);
                            if (this.indicators['conversion_variacion'] && this.countDecimals(this.indicators['conversion_variacion']) >= 2) this.indicators['conversion_variacion'] = this.indicators['conversion_variacion'].toFixed(2);
                            if (this.indicators['unidad_boleta_variacion'] && this.countDecimals(this.indicators['unidad_boleta_variacion']) >= 2) this.indicators['unidad_boleta_variacion'] = this.indicators['unidad_boleta_variacion'].toFixed(2);
                            if (this.indicators['unidad_boleta'] && this.countDecimals(this.indicators['unidad_boleta']) >= 2) this.indicators['unidad_boleta'] = this.indicators['unidad_boleta'].toFixed(2);
                            if (this.indicators['conversion'] && this.countDecimals(this.indicators['conversion']) >= 2) this.indicators['conversion'] = this.indicators['conversion'].toFixed(2);
                            if (this.indicators['trafico'] && this.countDecimals(this.indicators['trafico']) >= 2) this.indicators['trafico'] = this.indicators['trafico'].toFixed(2);

                            if (this.indicators['departamentos'] && this.indicators['departamentos'].length > 0) {
                                _.forEach(this.indicators['departamentos'], (division) => {
                                    if (division.venta && this.countDecimals(division.venta) >= 2) division.venta = division.venta.toFixed(2);
                                    if (division.cumplimiento && this.countDecimals(division.cumplimiento) >= 2) division.cumplimiento = division.cumplimiento.toFixed(2);

                                });
                            }
                        } else {
                            this.util.showToast(response.message, 3000);
                        }
                    }
                    catch (e) { }
                    loading.dismiss();
                })
                .catch((error: any) => {
                    loading.dismiss();
                    if (error && error.message) this.util.showToast(error.message, 3000);
                });
            return data;
        }


    }

    /**
     * Redirección a departamento o sucursal segun el caso
     * @param div
     * @param divs
     */
    goToDetail(div, divs) {
        if (divs == "End") {
            this.navCtrl.push(IndicatorDepartmentsRipleyPage, { division: div, divisiones: divs, dataId: div.codigo, sucId: this.selectedBranchOffice.id, selectedBranchOffice: this.selectedBranchOffice });
        }
        else this.navCtrl.push(IndicatorDepartmentsRipleyPage, { division: div, divisiones: divs, sucId: this.selectedBranchOffice.id, selectedBranchOffice: this.selectedBranchOffice });


    }

    /*goToDetail2(div) {
        this.navCtrl.push(Page5Page, { division: div, divisiones: "Departamentos" });
        //this.navCtrl.push(IndicatorDepartmentsRipleyPage, {division: div, divisiones: "Departamento"});
    }
*/
    /*countDecimals = function () {
        if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
        return this.toString().split(".")[1].length || 0;
    }*/


    countDecimals = function(value) {
        if (Math.floor(value) !== value)
            return value.toString().split(".")[1].length || 0;
        return 0;
    }


}
