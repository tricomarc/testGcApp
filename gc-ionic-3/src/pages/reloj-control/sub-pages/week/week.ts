import {Component, ViewChild} from '@angular/core';
import {
    Content,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    AlertController
} from 'ionic-angular';
import * as _ from 'lodash';
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {config} from "../../../reloj-control/reloj-control.config";

/**
 * Generated class for the WeekPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'week',
    templateUrl: 'week.html',
})
export class WeekPage {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready: boolean = false;
    weekDays = "";
    state = "";
    days = [];
    desde = new Date();
    hasta = new Date();

    lateHours = 0;
    extraHours = 0;
    workHours = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private alert: AlertController) {
    }

    async ionViewDidLoad() {
        if (!_.isUndefined(this.navParams.data.days) && !_.isNull(this.navParams.data.days)) {
            this.weekDays = this.navParams.data.days;

        }
        if (!_.isUndefined(this.navParams.data.state) && !_.isNull(this.navParams.data.state)) {
            this.state = this.navParams.data.state;
        }
    }

    /**
     * Trae registro de historicos desde API
     * @returns {Promise<{}>}
     */
    async getResume() {
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();


        var endpoint = "?dias=" + this.weekDays;
        let data = {};
        await this.request
            .get(config.endpoints.get.weekDetails + endpoint, true)
            .then((response: any) => {
                try {
                    if (response.code == 200) {
                        this.days = response.data.registros;

                        this.desde = response.data.desde;
                        this.hasta = response.data.hasta;

                        this.lateHours = response.data.horas_atrasadas;
                        this.extraHours = response.data.horas_extras;
                        this.workHours = response.data.horas_trabajadas;
                    } else {
                        this.util.showToast(response.message, 3000);
                    }
                }
                catch (e) {
                }
                loading.dismiss();
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Envio de rechazo de semana
     */
    rejectWeek() {
        let alert = this.alert.create({
            title: 'Escriba el motivo por el cual no rechaza su registro horario',
            subTitle: '*Este campo es obligatorio',
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                }
            },
                {
                    text: 'Comentar',
                    handler: data => {
                        var params = {
                            dias:  this.weekDays,
                            comentario: data[0],
                            estado: 0
                        };
                        this.request
                            .post(config.endpoints.post.aprroveWeek, params, true)
                            .then((response: any) => {
                                if (response.code == 200) {
                                    let alert = this.alert.create({
                                        title: 'Atención',
                                        subTitle: response.message,
                                        buttons: [{
                                            text: 'OK',
                                            handler: () => {
                                                this.navCtrl.pop();
                                            }
                                        }],
                                    });
                                    alert.present();
                                } else {
                                    this.util.showAlert('Atención', 'Atención ' + response.code + '. ' + response.message);
                                }
                            })
                            .catch((error: any) => {
                                this.util.showAlert('Atención', 'No ha sido posible enviar los datos.');
                            });
                    }
                }]
        });
        alert.addInput({
            type: 'test',
            label: 'comentario',
            value: ""
        });
        alert.present();
    }

    /**
     * Envio de aceptacion de semana
     */
    aceptWeek() {
        var params = {
            dias:  this.weekDays,
            estado: 1,
            comentario: ""
        };
        this.request
            .post(config.endpoints.post.aprroveWeek, params, true)
            .then((response: any) => {
                if (response.code == 200) {
                    let alert = this.alert.create({
                        title: 'Atención',
                        subTitle: response.data,
                        buttons: [{
                            text: 'OK',
                            handler: () => {
                                this.navCtrl.pop();
                            }
                        }],
                    });
                    alert.present();
                } else {
                    this.util.showAlert('Atención', 'Atención ' + response.code + '. ' + response.message);
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No ha sido posible enviar los datos.');
            });
    }


}
