import { Component } from '@angular/core';
import { IonicPage, MenuController, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as _ from 'lodash';
import { SessionProvider } from "../../../../shared/providers/session/session";
import { AmbitoPage } from "../../../checklist/sub-pages/ambito/ambito";
import { global } from "../../../../shared/config/global";
import { UtilProvider } from "../../../../shared/providers/util/util";


import { ChecklistHistoricalComponent } from '../../../checklists/components/checklist-historical/checklist-historical';

/**
 * Generated class for the ChecklistPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'guardados',
    templateUrl: 'guardados.html',
})
export class GuardadosPage {

    userSettingsView: boolean = false;
    sucursalSeleccionada = null;
    actionSeleccionado = null;
    thisSession = null;
    hoy = new Date();
    guardados = [];
    visita_tienda = [];
    sucursal: any = {};

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private actionSheet: ActionSheetController) {

    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    async ionViewDidLoad() {
        this.thisSession = await this.util.getInternalSession();
        if (!_.isUndefined(this.navParams.data.sucursal) && !_.isNull(this.navParams.data.sucursal)) {
            this.sucursalSeleccionada = this.navParams.data.sucursal;
            this.listarGuardados(this.sucursalSeleccionada)
        }
        if (!_.isUndefined(this.navParams.data.action) && !_.isNull(this.navParams.data.action)) {
            this.actionSeleccionado = this.navParams.data.action;
        }
    }

    listarGuardados(suc) {
        //TODO; Agregar filtro de dias (solo hoy)
        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
            if (val) {
                this.visita_tienda = JSON.parse(val)
                this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': suc });

                var visitasFinalizadas = _.filter(this.visita_tienda['visitas'], function (visita) {
                    return visita.estado_id != 4;
                });
                var checklists = this.visita_tienda['checklist_visita'];
                _.forEach(visitasFinalizadas, function (value) {
                    var checklist = _.find(checklists, { id: value.checklist_id + "" });
                    if (_.isUndefined(checklist) || _.isNull(checklist)) {
                        checklist = _.find(checklists, { id: value.checklist_id * 1 });
                        if (!_.isUndefined(checklist) && !_.isNull(checklist)) {
                            value.nombre = checklist.nombre;
                            value.fecha = new Date(value.fecha);
                        }
                    } else {
                        value.nombre = checklist.nombre;
                        value.fecha = new Date(value.fecha);
                    }
                });
                this.guardados = visitasFinalizadas;
            } else {
            }
        });
    }

    /**
     * Redireccion a vista de checklist singular
     * @param checklist
     */
    navigateToAmbito(sucursal_id, checklist: any) {
        this.navCtrl.push(AmbitoPage, {
            checklist_id: checklist.checklist_id,
            sucursal_id: sucursal_id,
            visita: true
        });
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
                    text: 'No enviados',
                    handler: () => {
                        this.navCtrl.push('NoEnviadasPage');
                    }
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push(ChecklistHistoricalComponent, { type: 2 });
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
