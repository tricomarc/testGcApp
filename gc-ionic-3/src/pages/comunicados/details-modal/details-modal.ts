import {ApplicationRef, Component, ViewEncapsulation} from '@angular/core';
import {IonicPage, LoadingController, NavController, MenuController, NavParams, Events} from 'ionic-angular';
import {ViewController} from 'ionic-angular';
import {Storage} from "@ionic/storage";

import {config} from "../tienda/comunicados-tienda.config";
import {RequestProvider} from "../../../shared/providers/request/request";
import {UtilProvider} from "../../../shared/providers/util/util";
import {SessionProvider} from "../../../shared/providers/session/session";
import {Device} from "@ionic-native/device";
import * as _ from 'lodash';

import {ComunicadoComponent} from "../components/comunicado/comunicado";
import {CuestionarioComponent} from "../components/cuestionario/cuestionario";
import {EquipoComponent} from "../components/equipo/equipo";
import {RespuestasComponent} from "../components/respuestas/respuestas";
import {global} from "../../../shared/config/global";
import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the DetailsModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */



@IonicPage()
@Component({
    selector: 'page-details-modal',
    templateUrl: 'details-modal.html',
    encapsulation: ViewEncapsulation.None
})
export class DetailsModalPage {

    public comunicado = {};
    tab1Root = ComunicadoComponent;
    tab2Root = CuestionarioComponent;
    tab3Root = RespuestasComponent;
    details = {};
    tabs = [];
    onlyWatch: boolean = false;
    isFavorite: boolean = null;
    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private showFavorite: boolean = false;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public viewCtrl: ViewController,
        public storage: Storage,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private device: Device,
        private applicationRef: ApplicationRef,
        private menu: MenuController,
        private events: Events,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        UtilProvider.comunicadosZonalIntent = 0;

    }

 
    /**
     * Una vez que se genera la vista, recibimos el comunicado enviado por parametro para obtener sus detalles
     */
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'DetailsModalComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetailsModal', 'Comunicados' );

        this.comunicado = this.navParams.get('comunicado');
        if(!_.isUndefined(this.navParams.get('onlyWatch')) && !_.isNull(this.navParams.get('onlyWatch'))){
            this.onlyWatch = true;
        }
        this.getDetails();
    }
    
    ionViewWillEnter() {
        this.selectedTabs(1);
        this.menu.enable(false, "menu");
    }

    /**
     * Envia aviso de actualización a comunicados zonal propio
     */
    async ionViewDidLeave(){
        this.menu.enable(true, "menu");
        let result = await this.session.getSession();
        if(result['usuario'].jerarquia >= 98) {
            this.events.publish("returnComZonalList", true)
        } else if (!result['usuario'].jerarquia || result['usuario'].jerarquia < 98) {
            this.showFavorite = true;
        }
    }

    /**
     * Trae detalles del comunicado seleccionado
     * @returns {Promise<{}>}
     */
    async getDetails() {

        if(!_.isUndefined(this.comunicado["comunicado_id"]) && !_.isNull(this.comunicado["comunicado_id"])){
            let data = {};
            const loading = this.loading.create({content: 'Obteniendo comunicados'});
            loading.present();

            let result = await this.session.getSession();
            config.detailsFilter.comunicado_id = this.comunicado["comunicado_id"];
            config.detailsFilter.usuario_id = result["usuario"].id + "";
            config.detailsFilter.session_id = result["sessionid"];
            config.detailsFilter.uuid = this.device.uuid;
            await this.request
                .post(config.endpoints.post.details, JSON.stringify(config.detailsFilter), true)
                .then((response: any) => {
                    loading.dismiss();
                    try {
                        console.log(this.comunicado)
                        this.details = (this.util.isJson(response) ? JSON.parse(response).data : response.data);
                        if(!this.comunicado['estado']){
                            if(!response['data']['comunicado']['estado']){
                                this.details['comunicado']['estado'] = response['data']['evaluacion']['leido']
                            }else 
                                this.details['comunicado']['estado'] =  response['data']['comunicado']['estado']
                        }else this.details['comunicado']['estado'] = this.comunicado['estado'];
                        this.isFavorite = response['data']['comunicado']['favorito'];
                        //data = this.details;
                        this.details['watch'] = this.onlyWatch;
                        this.createTabs();
                    }
                    catch (e) {
                        data = e;
                    }
                })
                .catch((error: any) => {
                    try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                    loading.dismiss();
                    if (error && error.message) this.util.showToast(error.message, 3000);
                    data = error;
                });
            return data;
        }

    }

    /**
     * De acuerdo a las caracteristicas del comunicado, se crean los tabs correspondientes.
     */
    createTabs() {
        this.tabs = [];
        this.tabs.push({
            root: this.tab1Root,
            tabTitle: "Comunicado",
            tabIcon: "md-list-box"
        });

        //TODO: Pestaña de equipo eliminada temporalmente
        /*if ((!_.isUndefined(this.details["equipo"])) && (!_.isNull(this.details["equipo"]))) {
            if (this.details["equipo"].cargo_nombre != 'Jefe Zonal') {
                this.tabs.push({
                    root: this.tab2Root,
                    tabTitle: "Equipo",
                    tabIcon: "md-people"
                })
            }
        }*/
        if ((!_.isUndefined(this.details["cuestionario"])) && (!_.isNull(this.details["cuestionario"]))) {
            if ((_.isUndefined(this.details["cuestionario"].respuestas)) || (_.isNull(this.details["cuestionario"].respuestas))) {
                this.tabs.push({
                    root: this.tab2Root,
                    tabTitle: "Cuestionario",
                    tabIcon: "md-checkbox-outline"
                })
            }
        }

        if ((!_.isUndefined(this.details["cuestionario"])) && (!_.isNull(this.details["cuestionario"]))) {
            if ((!_.isUndefined(this.details["cuestionario"].respuestas)) && (!_.isNull(this.details["cuestionario"].respuestas))) {
                this.tabs.push({
                    root: this.tab3Root,
                    tabTitle: "Respuestas",
                    tabIcon: "md-list"
                })
            }
        }
        this.applicationRef.tick();

        console.log(this.tabs)
    }

    /**
     * Se ejecuta cuando se selecciona un tab
     * @param num
     */
    selectedTabs(num) {
    }

    /**
     * Cierra Modal Actual
     */
    public closeModal() {
        this.viewCtrl.dismiss();
    }

    setFavorite(){
        const loading = this.loading.create({});
        loading.present();
        var params = {prefix: 'com', id: this.comunicado['comunicado_id'], favorito: !this.isFavorite };
        this.util.setFavorite(params)
            .then(()=>{loading.dismiss(); this.isFavorite = !this.isFavorite })
            .catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message); })

    }



}
