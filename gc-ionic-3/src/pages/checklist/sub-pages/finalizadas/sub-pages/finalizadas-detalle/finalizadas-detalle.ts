import { Component, ViewChild } from '@angular/core';
import {
    IonicPage,
    MenuController,
    NavController,
    NavParams,
    Slides,
    ActionSheetController,
    LoadingController, Events
} from 'ionic-angular';

import { Storage } from '@ionic/storage';
import * as _ from 'lodash';
import { SessionProvider } from "../../../../../../shared/providers/session/session";
import { global } from '../../../../../../shared/config/global'
import { UtilProvider } from "../../../../../../shared/providers/util/util";
import { config } from "../../../../tienda/checklist-tienda.config";
import { AmbitoPage } from "../../../ambito/ambito";
import { DetallePage } from "../../../detalle/detalle";
import { RequestProvider } from "../../../../../../shared/providers/request/request";
import { FirebaseAnalyticsProvider } from '../../../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'finalizadas-detalle',
    templateUrl: 'finalizadas-detalle.html',
})
export class FinalizadasDetallePage {

    @ViewChild( Slides ) slides: Slides;

    sucursalSeleccionada = null;
    actionSeleccionado = null;
    visitaSeleccionada = null;
    checklistSeleccionado = null;
    thisSession = null;
    visita_tienda = [];
    respuestas = [];
    preguntas = [];
    respuestasPorUnir = [];
    sucursal = {};
    finalizadosDetalle = {};
    checklist: {};
    visitsReady: boolean = false;
    checklistsready: boolean = false;
    suc_id = 0;
    user_id = 0;
    from = "Finalizadas";

    private signature: any;
    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private storage: Storage,
        private session: SessionProvider,
        private util: UtilProvider,
        private menu: MenuController,
        private events: Events,
        private actionSheet: ActionSheetController,
        private loading: LoadingController,
        private request: RequestProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    ionViewWillEnter() {
    }

    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'FinalizadasDetalleChecklist' );

        this.thisSession = await this.util.getInternalSession();
        var required = 0;
        if (!_.isUndefined(this.navParams.data.sucursal_id) && !_.isNull(this.navParams.data.sucursal_id)) {
            this.sucursalSeleccionada = this.navParams.data.sucursal_id;
            required++;
        }
        if (!_.isUndefined(this.navParams.data.action_id) && !_.isNull(this.navParams.data.action_id)) {
            this.actionSeleccionado = this.navParams.data.action_id;
            required++;
        }
        if (!_.isUndefined(this.navParams.data.visita_id) && !_.isNull(this.navParams.data.visita_id)) {
            this.visitaSeleccionada = this.navParams.data.visita_id;
            required++;
        }
        if (!_.isUndefined(this.navParams.data.checklist_id) && !_.isNull(this.navParams.data.checklist_id)) {
            this.checklistSeleccionado = this.navParams.data.checklist_id;
            required++;
        }
        if (!_.isUndefined(this.navParams.data.from) && !_.isNull(this.navParams.data.from)) {
            this.from = this.navParams.data.from;
        }
        if (required >= 4) this.listarFinalizadosDetalle();
        else this.loadChecklist(this.checklistSeleccionado)
    }

    /**
     * Envia aviso de actualización a checklist zonal propio
     */
    ionViewDidLeave() {
        this.events.publish("toList", true)
    }


    /**
     * Trae preguntas asociadas a checklist y ambito luego ordena para asociar pregunta con respuesta
     * @param checklist_id
     * @param ambito_id
     * @returns {Promise<{}>}
     */
    async loadChecklist( checklist_id ) {
        const loading = this.loading.create({ content: 'Obteniendo checklist' });
        
        loading.present();
        
        let data = {};
        
        await this.request
            .get( config.endpoints.get.asignacion + checklist_id, true )
            .then( async ( response: any ) => {
                if( this.navParams.data.markAsRead)  {
                    this.markAsRead( checklist_id );
                }
                try {
                    if ( !_.isUndefined( response.code ) ) {
                        if ( response.code == 403 ) {
                            this.util.showAlert("Atención", "No se envio levantamiento");
                        }
                    }

                    if (!_.isUndefined(response.data)) {
                        this.checklist = response.data;

                        let noQuestions = _.filter(this.checklist["ambitos"], { total: 0 });

                        if (!_.isNull(noQuestions) && !_.isUndefined(noQuestions)) {

                            _.forEach(noQuestions, (ambito) => {
                                let indexToDelete = _.indexOf(this.checklist["ambitos"], ambito);
                                if (indexToDelete > -1) this.checklist["ambitos"].splice(indexToDelete, 1)
                            });

                        }



                        this.checklist["ambitos"] = _.orderBy(this.checklist["ambitos"], 'asc');

                        await this.asyncForEach(this.checklist["ambitos"], async (ambito, key) => {
                            ambito.preguntas = await this.getPreguntas(this.checklist['id'], ambito.id);
                        });
                        this.finalizadosDetalle = this.checklist;
                        this.checklistsready = true;
                    }
                    loading.dismiss();
                }
                catch (e) {
                    loading.dismiss();
                }
            })
            .catch((error: any) => {
                loading.dismiss();
                if (error && error.message) this.util.showAlert("Atención", error.message);
            });
        return data;
    }

    markAsRead(checklistId: any) {
        this.request
            .get(config.endpoints.get.changeStatus + checklistId, true)
            .then((data: any) => { })
            .catch((error: any) => { });
    }

    // 
    async getPreguntas(checklist_id, ambito_id) {
        let data = {};
        
        let params = "?ambito_id=" + ambito_id + "&checklist_id=" + checklist_id;
        
        if (this.suc_id != 0) {
            params = params + "&sucursal_id=" + this.suc_id
        }
        
        if (this.user_id != 0) {
            params = params + "&usuario_id=" + this.user_id
        }

        await this.request
            .get(config.endpoints.get.preguntas + params, true)
            .then( ( response: any ) => {
                try {
                    if ( !_.isUndefined( response.code ) ) {
                        if ( response.code == 403 ) {
                            this.util.showAlert("Atención", "Las preguntas no pudieron ser cargadas");
                        }
                    }
                    if ( !_.isUndefined( response.data ) ) {
                        this.preguntas = response.data.preguntas;
                        
                        this.respuestasPorUnir = response.data.respuestas;

                        this.signature = response.data.firma;
                        
                        this.joinQuestions(this.preguntas, this.respuestasPorUnir);
                        
                        data = this.preguntas
                    }
                } catch ( e ) {
                    this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
                }
            })
            .catch( ( error: any ) => {
                if ( error && error.message ) this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
            });
        return data;
    }

    /**
     * Envia preguntas y respuestas a función para su unión
     * @param preguntas
     * @param respuestasPorUnir
     */
    joinQuestions(preguntas, respuestasPorUnir) {
        for (let pregunta of preguntas) {
            this.joinQuestion(pregunta, JSON.parse(JSON.stringify(respuestasPorUnir)))
        }
    }

    /**
     * Une preguntas con respuestas segun el caso
     * @param pregunta
     * @param respuestasPorUnir
     */
    joinQuestion(pregunta, respuestasPorUnir) {

        let foundAnswer = _.find(respuestasPorUnir, { pregunta_id: pregunta.id });

        if (foundAnswer && pregunta.codigo_tipo === 'cam') {
            pregunta.adminComentario = foundAnswer.admin_comentario;
            pregunta.respuesta = foundAnswer.respuesta;
        }

        var respuestaFind = _.find(respuestasPorUnir, { pregunta_id: pregunta.id, alternativa_id: null });

        if (!_.isUndefined(respuestaFind)) {
            pregunta.respuesta = respuestaFind.respuesta;
            _.remove(respuestasPorUnir, { id: respuestaFind.id });
        } else {
            if (pregunta.codigo_tipo == "check" || pregunta.codigo_tipo == "radio") {
                let respuestaFind2 = _.find(respuestasPorUnir, { pregunta_id: pregunta.id });
                if (!_.isUndefined(respuestaFind2)) {
                    pregunta.respuesta = respuestaFind2.respuesta;
                }
            }
        }


        if (pregunta.codigo_tipo == "fecha") {
            if (!_.isNull(pregunta.respuesta)) {
                if (!_.isNull(pregunta.respuesta.data)) {
                    pregunta.respuesta.data = pregunta.respuesta.data.toLocaleString();
                }
            }
        }
        if (pregunta.codigo_tipo == "porcentual") {
            if (!_.isNull(pregunta.respuesta)) {
                if (!_.isNull(pregunta.respuesta.data)) {
                    if (pregunta.respuesta.data == 0) pregunta.hasChanges = false;
                    else pregunta.hasChanges = true;
                }
            }
        }

        if (pregunta.alternativas) {
            for (let alternativa of pregunta.alternativas) {
                if (_.isNull(alternativa.respuesta)) {
                    alternativa.respuesta = {}
                }
                var respuestaFind2 = _.find(respuestasPorUnir, {
                    pregunta_id: pregunta.id,
                    alternativa_id: alternativa.id
                });
                if (!_.isUndefined(respuestaFind2)) {
                    alternativa.respuestaAdmin = respuestaFind2.admin_comentario; //modalMessage directiva
                    alternativa.respuesta = respuestaFind2.respuesta;
                    _.remove(respuestasPorUnir, { id: respuestaFind2.id });
                }
                if (alternativa.subPregunta) {
                    this.joinQuestion(alternativa.subPregunta, respuestasPorUnir);
                }
                var resp = JSON.parse(JSON.stringify(alternativa.respuesta))
                if (pregunta.tipo_id == 2 && (!_.isUndefined(resp) && !_.isNull(resp))) {
                    if ((!_.isUndefined(alternativa.respuesta.data) && !_.isNull(alternativa.respuesta.data) && !_.isUndefined(alternativa.respuesta.alternativa_id) && !_.isNull(alternativa.respuesta.alternativa_id))
                        || (alternativa.respuesta && alternativa.respuesta.foto && alternativa.respuesta.foto.length && alternativa.respuesta.alternativa_id)) {
                        alternativa.respuesta.checked = true;
                    }
                }
            }
        }
        if (pregunta.subPregunta) {
            this.joinQuestion(pregunta.subPregunta, respuestasPorUnir);
        }

        /**
         * Si la respuesta es vacia, se deja el campo en blanco con el modelo respectivo
         */
        if (_.isNull(pregunta.respuesta)) {
            switch (pregunta.codigo_tipo) {
                case "porcentual": {
                    pregunta.respuesta = {
                        data: null
                    };
                    break;
                }
                case "text": {
                    pregunta.respuesta = {
                        data: null
                    };
                    break;
                }
                case "num": {
                    pregunta.respuesta = {
                        data: null
                    };
                    break;
                }
                case "fecha": {
                    pregunta.respuesta = {
                        data: null
                    };
                    break;
                }
                default: {
                    //statements;
                    break;
                }
            }
        }
    }


    listarFinalizadosDetalle() {

        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
            if (val) {
                this.visita_tienda = JSON.parse(val);
                this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': this.sucursalSeleccionada });
                //if (!_.isUndefined(this.sucursal) && !_.isNull(this.sucursal)) {
                //this.respuestas = _.filter(this.visita_tienda['respuestas'], {'visita_id': this.visitaSeleccionada});
                if (!_.isUndefined(this.respuestas) && !_.isNull(this.respuestas)) {
                    //if(_.isArray(this.respuestas)) this.respuestas

                    let indexChecklist = -1;
                    let fromVisit = true;

                    //TODO: agregar a cruz verde una vez validado
                    if (global.isString) {
                        indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], {'id': this.checklistSeleccionado + ""});
                        if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                            indexChecklist = _.findIndex(this.visita_tienda['checklists'], {'id': this.checklistSeleccionado + ""});
                            fromVisit = false;
                            if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], {'id': this.checklistSeleccionado * 1});
                                fromVisit = true;

                                if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                    indexChecklist = _.findIndex(this.visita_tienda['checklists'], {'id': this.checklistSeleccionado * 1});
                                    fromVisit = false;
                                }
                            }


                        }
                    }


                    if (!global.isString) {



                        let indexVisit = _.findLastIndex(this.visita_tienda['visitas_respuestas'], { 'checklist_id': this.checklistSeleccionado * 1, 'sucursal_id': this.sucursal['id'] * 1 });
                        if (indexVisit == -1) {
                            indexVisit = _.findLastIndex(this.visita_tienda['visitas'], { 'checklist_id': this.checklistSeleccionado * 1, 'sucursal_id': this.sucursal['id'] * 1 });
                            if (indexVisit != -1) {
                                this.respuestas = _.filter(this.visita_tienda['respuestas'], { 'visita_id': this.visita_tienda['visitas'][indexVisit].id });
                                indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], { 'id': this.visita_tienda['visitas'][indexVisit].checklist_id * 1 });
                                if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                    indexChecklist = _.findIndex(this.visita_tienda['checklists'], { 'id': this.visita_tienda['visitas'][indexVisit].checklist_id * 1 });
                                    fromVisit = false;
                                }
                            }
                        } else {
                            this.respuestas = _.filter(this.visita_tienda['respuestas'], { 'visita_id': this.visita_tienda['visitas_respuestas'][indexVisit].id });
                            indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], { 'id': this.visita_tienda['visitas_respuestas'][indexVisit].checklist_id * 1 });
                            if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                indexChecklist = _.findIndex(this.visita_tienda['checklists'], { 'id': this.visita_tienda['visitas_respuestas'][indexVisit].checklist_id * 1 });
                                fromVisit = false;
                            }
                        }
                    } else {

                        let indexVisit = _.findLastIndex(this.visita_tienda['visitas_respuestas'], { 'checklist_id': this.checklistSeleccionado * 1, 'sucursal_id': this.sucursal['id'] * 1 });
                        if (indexVisit == -1) {
                            indexVisit = _.findLastIndex(this.visita_tienda['visitas'], { 'checklist_id': this.checklistSeleccionado * 1, 'sucursal_id': this.sucursal['id'] + '' });

                            if (indexVisit == -1) indexVisit = _.findLastIndex(this.visita_tienda['visitas'], { 'checklist_id': this.checklistSeleccionado * 1, 'sucursal_id': this.sucursal['id'] * 1 });
                            if (indexVisit != -1) {
                                this.respuestas = _.filter(this.visita_tienda['respuestas'], { 'visita_id': this.visita_tienda['visitas'][indexVisit].id });
                                indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], { 'id': this.visita_tienda['visitas'][indexVisit].checklist_id + '' });

                                if (indexChecklist == -1) indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], { 'id': this.visita_tienda['visitas'][indexVisit].checklist_id * 1 });

                                if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                    indexChecklist = _.findIndex(this.visita_tienda['checklists'], { 'id': this.visita_tienda['visitas'][indexVisit].checklist_id + '' });
                                    fromVisit = false;
                                }
                            }
                        } else {
                            this.respuestas = _.filter(this.visita_tienda['respuestas'], { 'visita_id': this.visita_tienda['visitas_respuestas'][indexVisit].id });
                            indexChecklist = _.findIndex(this.visita_tienda['checklist_visita'], { 'id': this.visita_tienda['visitas_respuestas'][indexVisit].checklist_id * 1 });
                            if (_.isNull(indexChecklist) || _.isUndefined(indexChecklist) || indexChecklist == -1) {
                                indexChecklist = _.findIndex(this.visita_tienda['checklists'], { 'id': this.visita_tienda['visitas_respuestas'][indexVisit].checklist_id * 1 });
                                fromVisit = false;
                            }
                        }


                    }
                    if (indexChecklist != -1) {
                        if (fromVisit == true) {
                            this.finalizadosDetalle = this.visita_tienda['checklist_visita'][indexChecklist];


                        } else {
                            this.finalizadosDetalle = this.visita_tienda['checklists'][indexChecklist];
                        }

                        var finalizados = this.finalizadosDetalle;
                        _.forEach(this.respuestas, function(respuesta) {
                            var indexAmbito = _.findIndex(finalizados['ambitos'], { 'id': respuesta.ambito_id * 1 });
                            if (indexAmbito == -1) indexAmbito = _.findIndex(finalizados['ambitos'], { 'id': respuesta.ambito_id + "" });
                            /*    if (global.isString) indexAmbito = _.findIndex(finalizados['ambitos'], {'id': respuesta.ambito_id + ""});
                                if (!global.isString) indexAmbito = _.findIndex(finalizados['ambitos'], {'id': respuesta.ambito_id * 1});*/
                            if (indexAmbito > -1) {
                                //let tempAmbitos =

                                let tempPreguntas = Object.keys(finalizados['ambitos'][indexAmbito].preguntas).map(i => finalizados['ambitos'][indexAmbito].preguntas[i])
                                //let tempPreguntas = finalizados['ambitos'][indexAmbito].preguntas;

                                let foundPreg = _.find(tempPreguntas, { 'id': respuesta.pregunta_id * 1 });
                                if (_.isNull(foundPreg) || _.isUndefined(foundPreg)) foundPreg = _.find(tempPreguntas, { 'id': respuesta.pregunta_id + '' });


                                let indexPregunta = _.findIndex(tempPreguntas, foundPreg);
                                //if (_.isNull(indexPregunta) || _.isUndefined(indexPregunta)) indexPregunta = _.findIndex(tempPreguntas, {'id': respuesta.pregunta_id + ''});

                                if (indexPregunta > -1) {
                                    if (!_.isNull(respuesta) && !_.isUndefined(respuesta) && !_.isNull(respuesta['no_aplica']) && !_.isUndefined(respuesta['no_aplica'])) {
                                        if (respuesta['no_aplica'] == "1") finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id]['hasApply'] = false;
                                    }
                                    if (respuesta.tipo_id == "1" || respuesta.tipo_id == 1) {
                                        finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].comentarios = respuesta.comentarios ? respuesta.comentarios : "";
                                        if (respuesta.pregunta_alternativa_id == 0) { // Si no es una sub pregunta
                                            finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].respuesta.texto = respuesta.respuesta_alternativa_id;
                                            finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].texto_adicional = respuesta.texto_adicional;
                                            if (respuesta.foto) {
                                                finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].foto = respuesta.foto;
                                            }
                                        } else { // Si es una sub pregunta
                                            var alternativa = finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.pregunta_alternativa_id];
                                            if (alternativa && alternativa.subpregunta) {
                                                alternativa.subpregunta.respuesta.texto = respuesta.respuesta_alternativa_id;
                                            }
                                        }
                                    } else if (respuesta.tipo_id == "2" || respuesta.tipo_id == 2) {
                                        finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].comentarios = respuesta.comentarios ? respuesta.comentarios : "";
                                        finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].checked = true;
                                        if(respuesta.checked == true){
                                            finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].respuesta.texto = respuesta.respuesta_alternativa_id;
                                            finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].texto_adicional = respuesta.texto_adicional;
                                            if (respuesta.foto) {
                                                finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].alternativas[respuesta.respuesta_alternativa_id].foto = respuesta.foto;
                                            }
                                        }
                                    } else if (respuesta.tipo_id == "3" || respuesta.tipo_id == 3) {
                                        finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].respuesta.texto = respuesta.texto_respuesta;
                                    } else if (respuesta.tipo_id == "4" || respuesta.tipo_id == 4) {
                                        finalizados['ambitos'][indexAmbito].preguntas[respuesta.pregunta_id].foto = respuesta.foto;
                                    }
                                }

                            }
                        });
                        this.finalizadosDetalle = finalizados;
                        await this.changeQuestionsFormat(finalizados).then(det => {
                            this.finalizadosDetalle['ambitos'] = det['ambitos'];
                            this.visitsReady = true;
                        });
                    }
                    //}
                }
            }
        });
    }

    async changeQuestionsFormat(detalle) {
        var detalles = {};
        var ambs = [];
        _.forEach(detalle.ambitos, function(ambito) {
            var pregs = [];
            _.forEach(ambito.preguntas, function(pregunta) {
                var alt = [];
                _.forEach(pregunta.alternativas, function(alternativa) {
                    alt.push(alternativa)
                });
                pregunta.alternativas = alt;
                pregs.push(pregunta);
            });
            ambito.preguntas = pregs;
            ambs.push(ambito);
        });
        detalles['ambitos'] = ambs;
        return detalles;
    }

    /**
     * Cambia a foto siguiente
     */
    slideChanged() {
        let currentIndex = this.slides.getActiveIndex();
    }

    goToRightSlide() {
        if (!this.slides.isEnd()) this.slides.slideTo(this.slides.getActiveIndex() + 1, 500);
    }

    goToLeftSlide() {
        if (!this.slides.isBeginning()) this.slides.slideTo(this.slides.getActiveIndex() - 1, 500);
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


    /**
     * Foreach asincronico para utilizarse en funciones
     * @param array
     * @param callback
     * @returns {Promise<void>}
     */
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}
