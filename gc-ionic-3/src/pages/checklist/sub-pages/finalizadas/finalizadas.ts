import {Component} from '@angular/core';
import {IonicPage, MenuController, NavController, NavParams, ActionSheetController} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../shared/providers/session/session";
import {FinalizadasDetallePage} from "./sub-pages/finalizadas-detalle/finalizadas-detalle";
import {global} from "../../../../shared/config/global";
import {UtilProvider} from "../../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'finalizadas',
    templateUrl: 'finalizadas.html',
})
export class FinalizadasPage {

    userSettingsView:boolean = false;
    sucursalSeleccionada = null;
    actionSeleccionado = null;
    thisSession = null;
    hoy = new Date();
    finalizadas = [];
    visita_tienda = [];
    sucursal = {};

    checklist_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewWillEnter() {
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'FinalizadasChecklist' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'Finalizadas', 'Checklist' );

        this.thisSession = await this.util.getInternalSession();
        if (!_.isUndefined(this.navParams.data.sucursal) && !_.isNull(this.navParams.data.sucursal)) {
            this.sucursalSeleccionada = this.navParams.data.sucursal;
            this.listarFinalizados(this.sucursalSeleccionada)
        }

        if (!_.isUndefined(this.navParams.data.action) && !_.isNull(this.navParams.data.action)) {
            this.actionSeleccionado = this.navParams.data.action;
        }

        if (!_.isUndefined(this.navParams.data.checklist_id) && !_.isNull(this.navParams.data.checklist_id)) {
            this.checklist_id = this.navParams.data.checklist_id;
        }
    }

    listarFinalizados(suc){
        //TODO; Agregar filtro de dias (solo hoy)
        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
            if (val){
                this.visita_tienda = JSON.parse(val)
                this.sucursal = _.find(this.visita_tienda['sucursales'], {'id': suc});

                var visitasFinalizadas = null;
                if(this.checklist_id == 0) {
                    visitasFinalizadas = _.filter(this.visita_tienda['visitas'], {estado_id: 4, sucursal_id: this.sucursal['id']});
                    if(_.isNull(visitasFinalizadas) || _.isUndefined(visitasFinalizadas) || visitasFinalizadas.length == 0){
                        visitasFinalizadas = _.filter(this.visita_tienda['visitas_respuestas'], {estado_id: 4, sucursal_id: this.sucursal['id']});
                    }
                }
                if(this.checklist_id != 0) {
                    visitasFinalizadas = _.filter(this.visita_tienda['visitas'], {estado_id: 4, checklist_id: this.checklist_id, sucursal_id: this.sucursal['id']});
                    if(_.isNull(visitasFinalizadas) || _.isUndefined(visitasFinalizadas) || visitasFinalizadas.length == 0){
                        visitasFinalizadas = _.filter(this.visita_tienda['visitas_respuestas'], {estado_id: 4, checklist_id: this.checklist_id, sucursal_id: this.sucursal['id']});
                    }
                }

                var checklists = this.visita_tienda['checklists'];
                _.forEach(visitasFinalizadas, function(value) {
                    var checklist = _.find(checklists, {id: value.checklist_id +""});
                    if(_.isNull(checklist) || _.isUndefined(checklist)) checklist = _.find(checklists, {id: value.checklist_id * 1});
                    if(checklist){
                        value.nombre = checklist.nombre;
                        value.fecha = new Date(value.fecha);
                    }
                });

                this.finalizadas = visitasFinalizadas;
            }
        });
    }

    /**
     * Redireccion a vista de checklist singular
     * @param checklist
     */
    navigateToDetails(sucursalSeleccionada, actionSeleccionado, visita_id, checklist_id) {
        //sucursal_id: finalizadosCtrl.sucursalSeleccionada, action_id: finalizadosCtrl.actionSeleccionado, visita_id: finalizado.visita_id, checklist_id: finalizado.checklist_id
        this.navCtrl.push(FinalizadasDetallePage, {
            checklist_id: checklist_id + "",
            sucursal_id: sucursalSeleccionada,
            visita_id: visita_id,
            action_id: actionSeleccionado
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
                        this.navCtrl.push('HistoricasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
