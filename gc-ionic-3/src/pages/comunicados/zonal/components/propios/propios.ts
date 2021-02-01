import {ApplicationRef, Component, Input} from '@angular/core';
import {
    App, Events,
    LoadingController,
    MenuController,
    NavController
} from "ionic-angular";
import {config} from '../../comunicados-zonal.config'
import {RequestProvider} from "../../../../../shared/providers/request/request";
import {UtilProvider} from "../../../../../shared/providers/util/util";
import * as _ from 'lodash';
import {global} from "../../../../../shared/config/global";
import {SessionProvider} from "../../../../../shared/providers/session/session";
import {Device} from "@ionic-native/device";
import {ComunicadosZonalPage} from "../../comunicados-zonal";
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the ComunicadosPropiosZonalComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'propios',
    templateUrl: 'propios.html'
})
export class ComunicadosPropiosZonalComponent {

    comunicados_propios = [];
    tipo_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        private request: RequestProvider,
        private menu: MenuController,
        private util: UtilProvider,
        private loading: LoadingController,
        private applicationRef: ApplicationRef,
        private event: Events,
        public app: App,
        private session: SessionProvider,
        private device: Device, 
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider
    ) {
        /*this.event.subscribe('returnComZonalList', (data) => {
            console.log("llego ", data);

            let view = this.navCtrl.getActive();

            //prints out component name as string
            console.log("vista ", view.component.name );
            //console.log("showPropios ", this.showPropios)
            console.log("showPropios 2 ", ComunicadosZonalPage.propios)
            if (data === true && ComunicadosZonalPage.propios == true) this.getAllComunicates();
        });*/

    }

    async ngOnInit() {
        this.firebaseAnalyticsProvider.trackView( 'ComunicadosPropiosZonalComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ComunicadosPropiosZonal', 'Comunicados' );

        this.menu.enable(true, "menu");
        this.getAllComunicates();

        /* this.event.subscribe('returnComZonalList', (data) => {
             console.log("llego ", data);

             let view = this.navCtrl.getActive();

             //prints out component name as string
             console.log("vista ", view.component.name );
             //console.log("showPropios ", this.showPropios)
             console.log("showPropios 2 ", ComunicadosZonalPage.propios)
             if (data === true && ComunicadosZonalPage.propios == true) {
                 this.event.unsubscribe('returnComZonalList');
                 this.getAllComunicates();
             }
         });*/

        /*let context = this;
        this.event.subscribe("onBackComunicate", (selectedTab) => {

            if (selectedTab == 1 && UtilProvider.comunicadosZonalIntent == 0) {
                console.log("refreshComunicados")
                context.refreshComunicados(null);
                UtilProvider.comunicadosZonalIntent++;
            }
            else console.log("no es propio")
        });*/
    }

    /**
     * Obtiene todos los comunicados propios de usuario
     * @returns {Promise<{}>}
     */
    async getAllComunicates() {
        const loading = this.loading.create({content: 'Obteniendo comunicados'});
        loading.present();

        //TODO: solo para cruz verde, dejar tipo_id en 0 y solo si es cruz verde discriminar, aplicar tambien en checklist tienda

        let result = await this.session.getSession();
        console.log("result ", result);

        let com_types = result['usuario'].tipo_comunicado;
        console.log("tipo com ", com_types);

        /* _.forEach(menues, function(listMod) {
             switch (listMod.nombre) {
                 case "Premios":
                     var tipo = _.find(tipoComunicado, {
                         'tipo': 'com_tipo_premio'
                     });
                     tipo = tipo.id;
                     listMod.redirect = ('comunicados-tipo({tipo_id:' + tipo + ' })');
                     break;
                 case "Promociones Clientes":
                     var tipo = _.find(tipoComunicado, {
                         'tipo': 'com_tipo_comunicados'
                     });
                     tipo = tipo.id;
                     listMod.redirect = ('comunicados-tipo({tipo_id:' + tipo + ' })');
                     break;
             }
         });*/

        config.dateFilter.usuario_id = result["usuario"].id + "";
        config.dateFilter.session_id = result["sessionid"];
        config.dateFilter.uuid = this.device.uuid;
        if (this.tipo_id != 0) config.dateFilter['tipo_id'] = [this.tipo_id];

        let data = {};
        await this.request
            .post(config.endpoints.post.comunicados, JSON.stringify(config.dateFilter), true)
            .then((response: any) => {

                loading.dismiss();
                try {
                    console.log("response ", response);
                    this.comunicados_propios = response.data.propios;
                    this.applicationRef.tick();
                    this.event.unsubscribe('returnComZonalList');
                }
                catch (e) {
                    console.log("error ", e);
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                loading.dismiss();
                console.log("error ", error);
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /**
     * Actualiza comunicados y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshComunicados(refresher: any) {
        await this.getAllComunicates();
        if (!_.isNull(refresher)) {
            refresher.complete();
        }
    }

    /**
     * Abre modal de detalles para comunicado seleccionado
     * @param comunicado: Comunicado seleccionado (se envia como parametro)
     */
    public goToDetails(comunicado) {
        console.log("to DetailsModalPage ", comunicado)

        this.event.subscribe('returnComZonalList', (data) => {
            console.log("llego ", data);

            let view = this.navCtrl.getActive();

            //prints out component name as string
            console.log("vista ", view.component.name);
            //console.log("showPropios ", this.showPropios)
            console.log("showPropios 2 ", ComunicadosZonalPage.propios)
            if (data === true && ComunicadosZonalPage.propios == true) this.getAllComunicates();

        });

        this.navCtrl.push('DetailsModalPage', {
            comunicado: comunicado
        });

        /* this.app.getRootNav().push('DetailsModalPage', {
             comunicado: comunicado,
         });*/
    }
    setFavorite(isFav, id){
        const loading = this.loading.create({});
        loading.present();
        var params = {prefix: 'com', id, favorito: !isFav };
        this.util.setFavorite(params)
            .then(()=>{loading.dismiss(); this.getAllComunicates(); })
            .catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message) })

    }
}