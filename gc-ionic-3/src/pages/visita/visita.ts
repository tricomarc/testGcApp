import { ApplicationRef, Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams, Content, ActionSheetController, Select, AlertController } from 'ionic-angular';
import { SessionProvider } from "../../shared/providers/session/session";
import * as _ from 'lodash';
import { config } from "./visita.config";
import { global } from '../../shared/config/global'
import { RequestProvider } from "../../shared/providers/request/request";
import { UtilProvider } from "../../shared/providers/util/util";
import { Storage } from '@ionic/storage';
import { VisitaSucursalPage } from "./sub-pages/sucursal/sucursal";
import { NoEnviadasPage } from "./sub-pages/no-enviadas/no-enviadas";
import { HistoricasPage } from "./sub-pages/historicas/historicas";
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';
// import { MapPage } from "./sub-pages/map/map";

/**
 * Generated class for the VisitaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-visita',
    templateUrl: 'visita.html',
})
export class VisitaPage {

    @ViewChild('branch_office_select') branch_office_select: Select;

    @ViewChild(Content) content: Content;

    zonas = [];
    sucursales = [];
    arreglo_visitas = [];
    arreglo_respuestas = [];
    user = {};
    visita_tienda = {};
    zonaSeleccionada = {};
    sucursalSeleccionada: any = {};
    thisSession = null;
    showView = false;
    userJerarquia = false;
    last_update = new Date();
    totalToSend = 0;


    visitas = [];
    checklists = [];
    respuestas = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private incomplete_visits: any = [];

    private choosing_view: boolean = true;

    private selectedZone: any = null;
    private selectedBranchOffice: any = null;

    private disableUpdateButton: boolean = false;

    private branchOffices: any = {
        all: [], // Todas las sucursales del usuario en la sesión
        current: [], // Las sucursales de la zona actual (zona seleccionada)
        view: [] // Las sucursales que se muestran en la vista (filtradas)
    };

    private zones: any = {
        all: [], // Todas las zonas del usuario en la sesión
        view: [] // Las zonas que se muestran en la vista (filtradas)
    };

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private session: SessionProvider,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private applicationRef: ApplicationRef,
        private storage: Storage,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private alert: AlertController,
        private ngZone: NgZone,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    // Función que filtra las zonas
    onSearchZones(search: any) {
        this.ngZone.run(() => {
            if (search.text) {
                // Filtramos las zonas que contengan en su nombre el texto buscado
                this.zones.view = _.filter(this.zones.all, (zone) => {
                    return _.includes(this.util.cleanText(zone.nombre), this.util.cleanText(search.text));
                });
                return;
            }
            this.zones.view = this.zones.all;
        });
    }

    // Función que filtra las sucursales
    onSearchBranchOffices(search: any) {
        this.ngZone.run(() => {
            if (search.text) {
                // Filtramos las sucursales que contengan en su nombre el texto buscado
                this.branchOffices.view = _.filter(this.branchOffices.current, (branchOffice) => {
                    return _.includes(this.util.cleanText(branchOffice.nombre), this.util.cleanText(search.text));
                });
                return;
            }
            this.branchOffices.view = this.branchOffices.current;
        });
    }

    // Busca y asigna las sucursales de una sucursal
    setBranchOffices() {
        if (this.selectedZone) {
            // Cada vez que se cambia la zona, dejamos nula la sucursal selccecionada
            this.selectedBranchOffice = null;
            this.sucursalSeleccionada = {};
            // Filtramos las sucursales de la zona actual
            let branchOffices = _.filter(this.branchOffices.all, (branchOffice: any) => {
                return branchOffice.zona_id.toString() === this.selectedZone.id.toString();
            });
            this.branchOffices.current = branchOffices;
            this.branchOffices.view = branchOffices;
        }
    }

    // Asigna la sucursal seleccionada
    selectBranchOffice() {
        this.sucursalSeleccionada = this.selectedBranchOffice;
    }

    async ionViewWillEnter() {
        if (!global.isMap) {
            this.menu.enable(true, "menu");
            this.getDatafromMemory(true);
        }
    }

    async ionViewDidLoad() {

        if (global.isMap) {
            this.navCtrl.setRoot('MapVisitPage');
            // this.navCtrl.setRoot(MapPage);
        } else {
            this.showView = true;
            this.thisSession = await this.util.getInternalSession();
            this.zonas = this.thisSession['usuario'].zonas;
            var jerarquia = this.thisSession['usuario'].jerarquia;
            if (jerarquia >= 100) this.userJerarquia = true;

            this.getDatafromMemory(false);
        }
        this.content.resize();

    }

    /**
     * Trae informacion de visitas asociadas al usuario actual guardadas en memoria
     */
    async getDatafromMemory(fromViewEnter: boolean) {
        this.disableUpdateButton = true;
        if (!this.thisSession) this.thisSession = await this.util.getInternalSession();
        await this.storage
            .get('visita_tienda_' + this.thisSession['usuario'].id)
            .then(async (val) => {
                if (val) this.visita_tienda = JSON.parse(val)

                //TODO: Probar arreglo para radios no aplica
                let apply = false;
                _.forEach(this.visita_tienda['respuestas'], function(resp) {
                    if (resp.no_aplica == 1 || resp.no_aplica == '1') {
                        resp.modified = true;
                        apply = true;
                    }
                });

                if (!apply) {
                } else {
                    this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                }

                //this.arreglo_visitas = this.visita_tienda['visitas_respuestas'];
                this.arreglo_visitas = _.filter(this.visita_tienda['visitas_respuestas'], { 'modified': true });
                if (!_.isNull(this.arreglo_visitas) && !_.isUndefined(this.arreglo_visitas)) this.arreglo_visitas = _.filter(this.visita_tienda['visitas'], { 'modified': true });


                this.arreglo_respuestas = _.filter(this.visita_tienda['respuestas'], { 'modified': true });

                var visit = 0;

                this.sucursales = this.visita_tienda['sucursales'];
                let zonas = (this.visita_tienda['zonas'] ? this.visita_tienda['zonas'] : []);
                this.visitas = this.visita_tienda['visitas'];
                this.checklists = this.visita_tienda['checklist_visita'];
                this.respuestas = this.visita_tienda['respuestas'];

                // Solo si se llama este método en ionViewDidLoad, asignamos los filtros de zonas y sucursales
                if (!fromViewEnter) {
                    this.branchOffices = {
                        all: (this.sucursales ? this.sucursales : []),
                        current: [],
                        view: []
                    };

                    this.zones = {
                        all: zonas,
                        view: zonas
                    };
                    // Si el usuario sólo tiene una zona, la seleccionamos por defecto
                    if (this.zones.all && this.zones.all.length === 1) {
                        this.selectedZone = this.zones.all[0];
                    }
                    this.setBranchOffices();
                }

                var visits = this.visitas;
                var checks = this.checklists;
                var sucs = this.sucursales;

                var historics = [];


                _.forEach(visits, (visita) => {
                    if (visita.modified) {
                        var checklist = _.find(checks, { 'id': visita.checklist_id + "" });
                        if (_.isUndefined(checklist) || _.isNull(checklist)) {
                            checklist = _.find(checks, { 'id': visita.checklist_id * 1 });
                        }
                        var sucursal = _.find(sucs, { 'id': visita.sucursal_id + "" });
                        if (_.isUndefined(sucursal) || _.isNull(sucursal)) {
                            sucursal = _.find(sucs, { 'id': visita.sucursal_id * 1 });
                        }
                        if (!_.isUndefined(sucursal) && !_.isNull(sucursal)) {
                            var newVisit = {
                                visita_id: visita.visita_id,
                                checklist: checklist ? checklist : (visita.checklist ? visita.checklist : {}),
                                sucursal_id: visita.sucursal_id,
                                sucursal_nombre: sucursal.nombre,
                                nombre_estado: visita.nombre_estado,
                                fecha: visita.fecha,
                                estado_id: visita.estado_id
                            };
                            historics.push(newVisit);
                        }
                    }
                });

                this.incomplete_visits = _.filter(historics, (visit) => {
                    return (visit.estado_id !== 4 && visit.estado_id !== 1);
                });

                // Si no hay sucursales del módulo de visita, usamos la de la sesión.
                if (!this.visita_tienda['sucursales'] || !this.visita_tienda['sucursales'].length) {
                    await this.session
                        .getSession()
                        .then((session: any) => {
                            if (
                                session
                                && session.usuario
                                && session.usuario.sucursales_visita
                            ) {
                                this.sucursales = _.orderBy(session.usuario.sucursales_visita, 'nombre');
                            }
                        })
                        .catch((error: any) => {
                        });
                    this.updateData().then(() => { }).catch(() => { });
                }

                var total = 0;
                _.forEach(visits, function(visita) {

                    let context = this;
                    if (visita.modified) {
                        if (visita.estado_id === 4) {
                            var checklist = _.find(checks, { 'id': visita.checklist_id + "" });
                            if (_.isUndefined(checklist) || _.isNull(checklist)) {
                                checklist = _.find(checks, { 'id': visita.checklist_id * 1 });
                            }
                            var sucursal = _.find(sucs, { 'id': visita.sucursal_id + "" });
                            if (_.isUndefined(sucursal) || _.isNull(sucursal)) {
                                sucursal = _.find(sucs, { 'id': visita.sucursal_id * 1 });
                            }

                            if (!_.isUndefined(checklist) && !_.isNull(checklist) && !_.isUndefined(sucursal) && !_.isNull(sucursal)) {
                                total++
                            }
                        }
                    }
                });
                this.totalToSend = total;
                this.applicationRef.tick();

                if (_.isUndefined(this.zonas)) {
                    this.zonas = this.visita_tienda['zonas'];
                }
                if (!_.isNull(this.zonas) && !_.isUndefined(this.zonas)) {
                    if (this.zonas.length > 0) {
                        var ultima_fecha = this.visita_tienda['fecha_actualizacion_visita'];
                        if (this.zonas.length == 1) {
                            this.zonaSeleccionada = this.zonas[0];
                        } else {
                            var zonaAlmacenada = this.visita_tienda['zonaSeleccionadaVisita'];
                            if (zonaAlmacenada != null) {
                                var foundZone = _.find(this.zonas, { id: zonaAlmacenada.id })
                                if (!_.isUndefined(foundZone) && !_.isNull(foundZone)) {
                                    this.zonaSeleccionada = foundZone;
                                }
                            }
                            if (ultima_fecha) {
                                this.last_update = new Date(ultima_fecha);
                            }
                        }
                        if (this.zonaSeleccionada) {
                            this.traerSucursalesDelDia(fromViewEnter);
                        }
                    } else {
                        this.util.showAlert('Atención', 'Recuerde actualizar los datos periódicamente para evitar la pérdida de información y mantener tus checklist al día');
                    }
                }
            });
        this.disableUpdateButton = false;
    }

    /**
     * Busca sucursales con la zona correspondiente al usuario
     */
    traerSucursalesDelDia(fromViewEnter: boolean) {
        let thisZonas = this.zonaSeleccionada['id'] * 1;
        this.sucursales = _.filter(this.visita_tienda['sucursales'], { 'zona_id': thisZonas });
        if (this.sucursales.length <= 0) {
            let thisZonas2 = this.zonaSeleccionada['id'] + "";
            this.sucursales = _.filter(this.visita_tienda['sucursales'], { 'zona_id': thisZonas2 });
            if (_.isUndefined(this.sucursales) || _.isNull(this.sucursales) || this.sucursales.length < 0) this.sucursales = _.filter(this.visita_tienda['sucursales'], { 'zona_id': thisZonas2 + "" });
        }

        if (this.sucursales.length <= 0 && this.branchOffices.all.length < 1 && fromViewEnter) {
            this.util.showAlert('Atención', 'Recuerde actualizar los datos periódicamente para evitar la pérdida de información y mantener tus checklist al día');
        }
        this.applicationRef.tick();
    }

    /**
     * Llama a servicio para actualizar informacion de visitas
     * @param itemZona
     * @returns {Promise<{}>}
     */
    async actualizarData(itemZona) {
        const loading = this.loading.create({ content: 'Espere unos segundos estamos actualizando los datos con nuestros servidores...' });
        loading.present();


        this.util.updateVisitResps(this.arreglo_respuestas, null).then(async value => {

            let temp_respuestas = value;

            _.forEach(this.arreglo_visitas, function(visita) {
                if (visita.estado_id == 1) {
                    _.forEach(temp_respuestas, function(resp) {
                        if (resp.visita_id == visita.visita_id) {
                            visita.estado_id = 2;
                        }
                    })
                }
            });

            var params = {
                data: {
                    visitas_respuestas: this.arreglo_visitas,
                    respuestas: temp_respuestas
                }
            };

            console.log('upload data', params)

            await this.request
                .post(config.endpoints.post.refreshOfflinePost, params, false)
                .then((response: any) => {
                    console.log('upload data response', response)
                    try {
                        if (response.status == true) {
                            let data = {};
                            var endpoint = "";
                            if (_.isUndefined(itemZona)) {
                                endpoint = "?zona_id=&tipo=usuario";
                            } else endpoint = "?zona_id=" + itemZona + "&tipo=usuario";

                            this.request
                                .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
                                .then((response: any) => {
                                    console.log('refreshOfflineGet', response);
                                    try {

                                        if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                                            if (!_.isUndefined(response.data.sucursales_sin_responder) && !_.isNull(response.data.sucursales_sin_responder)) {
                                                this.sucursales = response.data.sucursales_sin_responder.sucursales;

                                                let arr: any = [];

                                                _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                                                    if (visit.estado_id != 4) {
                                                        visit.modified = true;
                                                        let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
                                                        if (visit_checklist) visit.checklist = visit_checklist;
                                                        arr.push(visit);
                                                    }
                                                });

                                                this.visita_tienda = {
                                                    sucursales: response.data.sucursales_sin_responder.sucursales,
                                                    zonas: response.data.sucursales_sin_responder.zonas,
                                                    checklists: response.data.sucursales_sin_responder.checklists,
                                                    visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                                                    respuestas: response.data.sucursales_sin_responder.respuestas,
                                                    estados_visita: response.data.sucursales_sin_responder.estado_visita,
                                                    visitas: arr
                                                };

                                                this.visita_tienda['fechaActualizacion'] = new Date();
                                                this.sucursalSeleccionada = {};
                                                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                                                this.last_update = new Date();
                                                this.applicationRef.tick();

                                            }
                                            //this.content.resize();
                                            //this.getDatafromMemory();
                                        }
                                        if (this.sucursales.length <= 0) {
                                            this.util.showAlert("Atención", "Su usuario no posee sucursales asociadas, si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl ");
                                        }
                                        this.navCtrl.setRoot(this.navCtrl.getActive().component);

                                        loading.dismiss();

                                        if (this.incomplete_visits.length > 0) {
                                            let alert = this.alert.create({
                                                title: 'Atención',
                                                subTitle: `Hemos enviado tus checklists, pero aún ${this.incomplete_visits.length === 1 ? "queda 1" : "quedan " + this.incomplete_visits.length} sin finalizar.`,
                                                buttons: [{
                                                    text: 'VER CHECKLISTS',
                                                    handler: () => {
                                                        this.navCtrl.push('NoEnviadasPage');
                                                    }
                                                }, {
                                                    text: 'OK',
                                                    handler: () => { }
                                                }],
                                            });
                                            alert.present();
                                        }


                                    }
                                    catch (e) {
                                        this.util.showToast(e, 3000);
                                        loading.dismiss();
                                    }
                                })
                                .catch((error: any) => {
                                    loading.dismiss();
                                    if (error && error.message) this.util.showToast(error.message, 3000);
                                });
                            return data;
                        }
                    }
                    catch (e) {
                        this.util.showAlert("Atención", "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl");
                        loading.dismiss();
                    }
                })
                .catch((error: any) => {
                    console.log('upload data error', error)
                    loading.dismiss();
                    this.util.showAlert("Atención", "Ocurrió un problema de comunicación con nuestros servidores, por favor intente de nuevo más tarde si persiste el problema póngase en contacto con nuestra mesa de ayuda, soporte@andain.cl");
                });

        });
    }

    /**
     * Selector de zonas para mostrar sucursales
     * @param zona
     */
    selecionarZona(zona) {
        this.visita_tienda['zonaSeleccionadaVisita'] = zona;
        this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
        this.traerSucursalesDelDia(false);
        //this.actualizarData(zona.id);
    };


    actualizarLocal(sucursal) {
    }

    /**
     * Redireccion a vista de sucursal seleccionada
     * @param sucursal
     */
    async redirectToSucursal(sucursal) {
        if (!this.visita_tienda['sucursales'] || !this.visita_tienda['sucursales'].length) {
            await this.updateData()
                .then(() => { })
                .catch(() => { });
        }

        this.navCtrl.push('ChecklistTiendaPage', {
            sucursal: sucursal,
        });

        this.firebaseAnalyticsProvider.trackButtonEvent( "IrATienda" );
    }

    /**
     * Redireccion a visitas no enviadas y guardadas en memoria
     */
    redirectToNotSend() {
        this.navCtrl.push(NoEnviadasPage);

        this.firebaseAnalyticsProvider.trackButtonEvent( "EnviaTusChecklistsFinalizados" );
    }

    /**
     * Redireccion a visitas enviadas historicas
     */
    redirectToHistorics() {
        this.navCtrl.push(HistoricasPage);
    }


    updateData() {
        return new Promise((resolve, reject) => {
            let endpoint = ((!this.zonaSeleccionada || this.zonaSeleccionada === {}) ? '?zona_id=&tipo=usuario' : `?zona_id=${this.zonaSeleccionada}&tipo=usuario`);
            this.request
                .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
                .then((response: any) => {
                    try {
                        if (
                            response
                            && response.data
                            && response.data.sucursales_sin_responder
                        ) {
                            this.sucursales = response.data.sucursales_sin_responder.sucursales;
                            let arr: any = [];
                            _.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
                                if (visit.estado_id !== 4) {
                                    visit.modified = true;
                                    let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
                                    if (visit_checklist) visit.checklist = visit_checklist;
                                    arr.push(visit);
                                }
                            });
                            this.visita_tienda = {
                                sucursales: response.data.sucursales_sin_responder.sucursales,
                                zonas: response.data.sucursales_sin_responder.zonas,
                                checklists: response.data.sucursales_sin_responder.checklists,
                                visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                                respuestas: response.data.sucursales_sin_responder.respuestas,
                                estados_visita: response.data.sucursales_sin_responder.estado_visita,
                                visitas: arr
                            };


                            this.visita_tienda['fechaActualizacion'] = new Date();
                            this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                            this.applicationRef.tick();
                            resolve();
                        } else {
                            reject();
                        }
                    } catch (e) {
                        reject();
                    }
                })
                .catch((error: any) => {
                    reject();
                });
        });
    }

    async showVisitActionSheet() {
        const actionSheet = this.actionSheet.create({
            buttons: [
                {
                    text: 'No enviados',
                    handler: () => {
                        this.navCtrl.push(NoEnviadasPage);
                    }
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push(HistoricasPage);
                    }
                }
            ]
        });
        actionSheet.present();
    }

    openBranchOfficeSelect() {
        if (!this.sucursalSeleccionada || !this.sucursalSeleccionada.nombre) this.branch_office_select.open();
    }
}
