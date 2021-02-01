import { ApplicationRef, Component } from '@angular/core';
import {
    NavController,
    NavParams,
    MenuController,
    ModalController,
    LoadingController,
    AlertController, Events
} from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { Device } from "@ionic-native/device";
import { DetailsModalPage } from "../details-modal/details-modal";

// Configuración del componente
import { config } from './comunicados-tienda.config'
import { RequestProvider } from "../../../shared/providers/request/request";
import { UtilProvider } from "../../../shared/providers/util/util";
import { SessionProvider } from "../../../shared/providers/session/session";
import { DatePipe } from '@angular/common'
import * as _ from 'lodash';
import { global } from "../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';
import { DictionaryProvider } from '../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'page-comunicados-tienda',
    templateUrl: 'comunicados-tienda.html',
})
export class ComunicadosTiendaPage {

    /*fechaDesde: Date;
    fechaHasta: Date;
    sessionFechaInicio: Date;
    sessionFechafin: Date;*/

    hasta = new Date();
    desde = new Date(this.hasta.getFullYear(), this.hasta.getMonth(), 1);

    tipo_id = 0;
    filter = {
        fechaInicio: this.desde + "",
        fechaFin: this.desde + "",
        /* fechaInicioInput: new Date(),
         fechaFinInput: new Date()*/
    };
    types = [
        {
            id: 0,
            name: "Todos"
        }
    ];
    premios = null;
    releases = [];
    unreadReleases = [];
    showReleases = [];
    showUnreadReleases = [];
    selectedType = null;
    mostrarFechaEnMensaje: boolean;
    searchComunicate = "";
    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    tipoComunicado: string = null;

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
        private menu: MenuController,
        private events: Events,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {
        this.tipoComunicado = navParams.get('tipoComunicado');
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView('ComunicadosTiendaComunicados');
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ComunicadosTienda', 'Comunicados' );

        //this.events.unsubscribe('returnComTiendaList');

        if (!_.isUndefined(this.navParams.data.tipo_id) && !_.isNull(this.navParams.data.tipo_id)) {
            this.tipo_id = this.navParams.data.tipo_id;

            await this.dictionary.getDictionary().then((dictionary: any) => {
                this.premios = dictionary['Premios']
            });

            this.module = this.premios;
        }
    }

    ionViewWillEnter() {
        this.menu.enable(true, "menu");


        this.updateDates();
        this.getAllComunicates();
        /**
         * Se cargan las fecha de inicio y fin guardadas en memoria
         */
        /*this.storage.get('com-fecha-inicio').then(fechaIn => {
            this.sessionFechaInicio = fechaIn;
            this.storage.get('com-fecha-fin').then(fechaFin => {
                this.sessionFechafin = fechaFin;
                var today = new Date();
                this.fechaDesde = this.sessionFechaInicio ? new Date(this.sessionFechaInicio) : new Date(today.getFullYear(), (today.getMonth()), 1);
                this.fechaHasta = this.sessionFechafin ? new Date(this.sessionFechafin) : today;
                this.mostrarFechaEnMensaje = false;
                this.filter = {
                    fechaInicio: this.fechaDesde,
                    fechaFin: this.fechaHasta,
                    fechaInicioInput: this.fechaDesde,
                    fechaFinInput: this.fechaHasta
                };
                this.getAllComunicates();
            });
        });*/
    }

    updateDates() {
        let curr_month1 = "";
        if ((this.desde.getMonth() + 1) < 10) {
            curr_month1 = "0" + (this.desde.getMonth() + 1);
            this.filter.fechaInicio = (this.desde.getFullYear() + "-" + curr_month1)
        } else {
            this.filter.fechaInicio = (this.desde.getFullYear() + "-" + (this.desde.getMonth() + 1))
        }
        let curr_day1 = "";
        if ((this.desde.getDate()) < 10) {
            curr_day1 = "0" + this.desde.getDate();
            this.filter.fechaInicio = this.filter.fechaInicio + "-" + curr_day1
        } else {
            this.filter.fechaInicio = this.filter.fechaInicio + "-" + this.desde.getDate();
        }
        let curr_month2 = "";
        if ((this.hasta.getMonth() + 1) < 10) {
            curr_month2 = "0" + (this.hasta.getMonth() + 1);
            this.filter.fechaFin = (this.hasta.getFullYear() + "-" + curr_month2)
        } else {
            this.filter.fechaFin = (this.hasta.getFullYear() + "-" + (this.hasta.getMonth() + 1))
        }
        let curr_day2 = "";
        if ((this.hasta.getDate()) < 10) {
            curr_day2 = "0" + this.hasta.getDate();
            this.filter.fechaFin = this.filter.fechaFin + "-" + curr_day2
        } else {
            this.filter.fechaFin = this.filter.fechaFin + "-" + this.hasta.getDate();
        }
    }

    /**
     * Obtiene todos los comunicados que cumplen con los filtro de busqueda
     * @returns {Promise<{}>}
     */
    async getAllComunicates() {

        let data = {};
        let tempDesde = new Date(this.filter.fechaInicio);
        var tempHasta = new Date(this.filter.fechaFin);

        if (!_.isNull(this.filter.fechaInicio) && !_.isUndefined(this.filter.fechaInicio)) {
            tempDesde.setDate(tempDesde.getDate() + 1);
            let sendDesde = tempDesde.getFullYear() + "-" + (tempDesde.getMonth() + 1) + "-" + tempDesde.getDate();
            config.dateFilter.fecha_inicio = sendDesde;
        }

        if (!_.isNull(this.filter.fechaFin) && !_.isUndefined(this.filter.fechaFin)) {
            tempHasta.setDate(tempHasta.getDate() + 1);
            let sendHasta = tempHasta.getFullYear() + "-" + (tempHasta.getMonth() + 1) + "-" + tempHasta.getDate();
            config.dateFilter.fecha_fin = sendHasta;
        }

        if (tempDesde > tempHasta) {
            let alert = this.alert.create({
                title: 'Alerta',
                subTitle: 'La fecha de inicio debe ser menor a la fecha de término',
                buttons: [{
                    text: 'Aceptar',
                    handler: () => {
                        this.hasta = new Date();
                        this.desde = new Date(this.hasta.getFullYear(), this.hasta.getMonth(), 1);

                        this.filter = {
                            fechaInicio: this.desde + "",
                            fechaFin: this.desde + "",
                        };
                        this.updateDates();
                        this.getAllComunicates();

                    }
                }],
            });
            alert.present();
            return data;
        } else {
            const loading = this.loading.create({ content: 'Obteniendo comunicados' });
            loading.present();
            let result = await this.session.getSession();
            config.dateFilter.usuario_id = result["usuario"].id + "";
            config.dateFilter.session_id = result["sessionid"];
            config.dateFilter.uuid = this.device.uuid;
            config.dateFilter.tipo_id = this.tipoComunicado != null ? [this.tipoComunicado] : []
            console.log(config.dateFilter)
            // const com_tipo = result['usuario']['settings'].filter((t) => {return t.nombre == 'com_tipo_premio'});
            // config.dateFilter.tipo_id = com_premio ? [com_premio[0]['value']] : [];

            // config.dateFilter.tipo_id =
            if (this.tipo_id != 0) config.dateFilter['tipo_id'] = [this.tipo_id];
            console.log("datafilter ", config.dateFilter)
            await this.request
                .post(config.endpoints.post.comunicados, JSON.stringify(config.dateFilter), true)
                .then((response: any) => {
                    loading.dismiss();
                    try {
                        let data = (this.util.isJson(response) ? JSON.parse(response).data : response.data);
                        this.releases = data["comunicados"] ? data["comunicados"] : [];
                        this.unreadReleases = data["no_leidos"] ? data["no_leidos"] : [];

                        console.log("data ", data)

                        _.forEach(this.releases, (com) => {
                            com.estado = com.estado * 1;
                            com.tipo_id = com.tipo_id * 1;
                        });

                        _.forEach(this.unreadReleases, (com) => {
                            com.estado = com.estado * 1;
                            com.tipo_id = com.tipo_id * 1;
                        });

                        if (_.isUndefined(this.selectedType) || _.isNull(this.selectedType)) {
                            if (!_.isUndefined(data["tipos"]) && !_.isNull(data["tipos"])) {
                                _.forEach(data["tipos"], (type) => {
                                    this.types.push({
                                        id: type.id,
                                        name: type.nombre
                                    })
                                });
                            }
                            this.asignTypes();
                        }
                        this.filterbyType();
                        this.applicationRef.tick();
                    }
                    catch (e) {
                        console.log("error ", e);
                    }
                })
                .catch((error: any) => {
                    loading.dismiss();
                    console.log("error ", error);
                    if (error && error.message) this.util.showAlert('Atención', error.message);
                });
        }
    }

    /**
     * Elimina fechas seleccionadas en filtro para volver al filtro por defecto
     */
    /*borrarFecha() {
        console.log("borrar fechas");
        var today = new Date();
        this.filter.fechaInicio = new Date(today.getFullYear(), (today.getMonth()), 1);
        this.filter.fechaFin = today;
        this.selectedType = null;
        this.getAllComunicates();
    };*/

    /**
     * Asigna Area inicial para mostrar todos los checklists en el filtro
     * @param selected
     */
    asignTypes = function () {
        this.selectedType = this.types[0].id;
    };


    /**
     * Filtra comunicados visibles según selector de tipo
     */
    filterbyType() {
        if (!_.isUndefined(this.selectedType) && !_.isNull(this.selectedType)) {
            if (this.selectedType == 0) {
                this.showReleases = this.releases;
                this.showUnreadReleases = this.unreadReleases;
            } else {
                this.showReleases = _.filter(this.releases, { 'tipo_id': (this.selectedType * 1) });
                this.showUnreadReleases = _.filter(this.unreadReleases, { 'tipo_id': (this.selectedType * 1) });
            }
        } else {
            this.showReleases = this.releases;
            this.showUnreadReleases = this.unreadReleases;
        }
        this.searchComunicate = "";
        this.applicationRef.tick();
    }

    /**
     * Filtra comunicados visibles segun busqueda por texto, el filtro se realiza dentro de los
     * resultados generados por filtros anteriores
     */
    filterByText() {
        if ((!_.isUndefined(this.selectedType) && this.selectedType != "") && this.selectedType != 0) {
            this.showReleases = _.filter(this.releases, { 'tipo_id': this.selectedType });
            this.showUnreadReleases = _.filter(this.unreadReleases, { 'tipo_id': this.selectedType });

        } else {
            this.showReleases = this.releases;
            this.showUnreadReleases = this.unreadReleases;
        }

        var tempReleases = this.showReleases;
        this.showReleases = [];
        for (let release of tempReleases) {
            var hasText = _.includes(release.comunicado_nombre.toLowerCase(), this.searchComunicate.toLowerCase());
            if (hasText) this.showReleases.push(release);
        }

        tempReleases = this.showUnreadReleases;
        this.showUnreadReleases = [];
        for (let release of tempReleases) {
            var hasText2 = _.includes(release.comunicado_nombre, this.searchComunicate);
            if (hasText2) this.showUnreadReleases.push(release);
        }
        this.applicationRef.tick();
    }

    /* dateChanged(){
         console.log("date ", this.fechaDesde)
         this.updateFilters(this.fechaDesde, this.fechaHasta)
     }*/


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
     * Muestra calendario para filtro de fechas
     */
    /*showCalendarModal() {
        console.log("fechas ", this.filter.fechaInicio, this.filter.fechaFin);
        let initDate = this.datepipe.transform(this.filter.fechaInicio, 'yyyy-MM-dd');
        let endDate = this.datepipe.transform(this.filter.fechaFin, 'yyyy-MM-dd');
        let alert = this.alert.create({
            title: '<span class="positive"><b>Filtro por período</b></span>',
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                    console.log('Disagree clicked');
                }
            },
                {
                    text: 'Aceptar',
                    handler: data => {
                        console.log('Agree clicked', data);
                        if (data[0] < data[1]) this.updateFilters(data[0], data[1]);
                        else this.util.showAlert('Atención', "La fecha de inicio no puede ser mayor a la de término");
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

    /* updateFilters(value1, value2) {
         this.filter.fechaInicio = new Date(value1);
         this.filter.fechaFin = new Date(value2);
         this.filter.fechaInicio.setDate(this.filter.fechaInicio.getDate() + 1);
         this.filter.fechaFin.setDate(this.filter.fechaFin.getDate() + 1);
         console.log("return date ", value1, value2);
         console.log("new filter ", this.filter.fechaInicio, this.filter.fechaFin)
         this.getAllComunicates();
     }*/

    /**
     * Abre modal de detalles para comunicado seleccionado
     * @param comunicado: Comunicado seleccionado (se envia como parametro)
     */
    public openModal(comunicado) {
        console.log(comunicado)
        this.navCtrl.push('DetailsModalPage', {
            comunicado: comunicado
        });
    }

    /**
     * Agrega o elimina de favoritos
     */
    setFavorite(isFav, id) {
        const loading = this.loading.create({});
        loading.present();
        var params = { prefix: 'com', id, favorito: !isFav };
        this.util.setFavorite(params)
            .then(() => { loading.dismiss(); this.getAllComunicates(); })
            .catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message) })

    }

    /**
     * Muestra una alerta que informa el estado del cuestionario del comunicado
     */
    explainStatus() {
        this.util.showAlert('Información', 'Estado del cuestionario asociado a este comunicado.');
    }
}
