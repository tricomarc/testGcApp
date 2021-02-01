import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides
} from 'ionic-angular';
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {Tareas4Page} from "../tareas4/tareas4";
import {Tareas3Page} from "../tareas3/tareas3";
import {Tareas1Page} from "../tareas1/tareas1";
import {HistoricoPage} from "../../../checklist/sub-pages/historico/historico";
import {config} from "../../branch-office/tasks-branch-office.config";
import * as _ from 'lodash';
import {RequestProvider} from "../../../../shared/providers/request/request";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'tareas2',
    templateUrl: 'tareas2.html',
})
export class Tareas2Page {

    @ViewChild(Content) content: Content;

    visita_id = null;

    checklist: {};
    filters = [];
    areas = [];
    cargos = [];
    usuarios = [];
    zonas = [];

    ready: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private request: RequestProvider,
        private loading: LoadingController) {
    }

    async ionViewDidLoad() {
        this.loadFilters();
    }

    toDetails() {
        this.navCtrl.push(Tareas3Page);
    }

    /**
     * Trae filtros para tareas
     */
    async loadFilters() {

        const loading = this.loading.create({content: 'Obteniendo filtros'});
        loading.present();
        let data = {};
        await this.request
            .get(config.endpoints.newApi.get.filters, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    this.filters = response.data;

                    this.areas = response.data.areas;
                    this.cargos = response.data.cargos;
                    this.usuarios = response.data.usuarios;
                    this.zonas = response.data.zonas_sucursales;

                }
                catch (e) {
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                //if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
            });
        return data;
    }


}
