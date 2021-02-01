import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {Events, IonicPage, LoadingController, MenuController, NavController, NavParams, Slides, ActionSheetController} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import * as _ from 'lodash';
import {SessionProvider} from "../../../../../../shared/providers/session/session";
import {global} from '../../../../../../shared/config/global'
import {UtilProvider} from "../../../../../../shared/providers/util/util";
import {config} from "../../historicas.config";
import {RequestProvider} from "../../../../../../shared/providers/request/request";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'visita-detalle',
    templateUrl: 'visita-detalle.html',
})
export class VisitaDetallePage {

    @ViewChild(Slides) slides: Slides;

    visita_id = null;
    ambito_id = null;
    preguntas = [];
    respuestas = [];
    respuestasPorUnir = [];
    ready: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private menu: MenuController,
        private loading: LoadingController,
        private actionSheet: ActionSheetController,
        private request: RequestProvider,
        private util: UtilProvider) {
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
    }

    async ionViewDidLoad() {
        if (!_.isUndefined(this.navParams.data.visita_id) && !_.isNull(this.navParams.data.visita_id)) {
            this.visita_id = this.navParams.data.visita_id;
            if (!_.isUndefined(this.navParams.data.ambito_id) && !_.isNull(this.navParams.data.ambito_id)) {
                this.ambito_id = this.navParams.data.ambito_id;
                this.listarFinalizadosDetalle();
            }
        }
    }

    async listarFinalizadosDetalle() {
        const loading = this.loading.create({content: 'Obteniendo Infomación'});
        loading.present();

        var endpoint = "?ambito_id=" + this.ambito_id + "&visita_id=" + this.visita_id;
        console.log("endpoint ", endpoint);
        let data = {};
        await this.request
            .get(config.endpoints.get.detalles_visita + endpoint, true)
            .then((response: any) => {
                try {
                    console.log("response ", response);
                    if (response.code == 200) {
                        this.preguntas = response.data.preguntas;
                        this.respuestasPorUnir = response.data.respuestas;
                        this.joinQuestions(this.preguntas, this.respuestasPorUnir);
                        this.ready = true;
                    }else{
                        this.util.showToast(response.message, 3000);
                    }
                }
                catch (e) {
                    console.log("error ", e);
                }
                loading.dismiss();
            })
            .catch((error: any) => {
                loading.dismiss();
                console.log("error ", error);
                if (error && error.message) this.util.showToast(error.message, 3000);
            });
        return data;
    }

    /*async changeQuestionsFormat(detalle) {
        var detalles = {};
        var ambs = [];
        _.forEach(detalle.ambitos, function (ambito) {
            var pregs = [];
            _.forEach(ambito.preguntas, function (pregunta) {
                var alt = [];
                _.forEach(pregunta.alternativas, function (alternativa) {
                    alt.push(alternativa)
                });
                pregunta.alternativas = alt;
                pregs.push(pregunta);
            });
            ambito.preguntas = pregs;
            ambs.push(ambito);
        });
        detalles['ambitos'] = ambs;
        console.log("detalles ", detalles);
        return detalles;
    }*/

    /**
     * Envia preguntas y respuestas a función para su unión
     * @param preguntas
     * @param respuestasPorUnir
     */
    joinQuestions(preguntas, respuestasPorUnir) {
        for (let pregunta of preguntas) {
            this.joinQuestion(pregunta, respuestasPorUnir)
        }
        console.log("preguntas procesadas", preguntas);
    }

    /**
     * Une preguntas con respuestas segun el caso
     * @param pregunta
     * @param respuestasPorUnir
     */
    joinQuestion(pregunta, respuestasPorUnir) {
        console.log("pregunta ", pregunta);
        var respuestaFind = _.filter(respuestasPorUnir, {pregunta_id: pregunta.id, alternativa_id: null});
        if (!_.isUndefined(respuestaFind)) {
            console.log("respuestaFind ", respuestaFind);
            pregunta.respuesta = [];
            pregunta.adminComentario = [];
            if(respuestaFind.length > 0){
                for (var i = 0; i < respuestaFind.length; i++) {
                    if(!_.isNull(respuestaFind[i]) && !_.isUndefined(respuestaFind[i]) && !_.isNull(respuestaFind[i]['no_aplica']) && !_.isUndefined(respuestaFind[i]['no_aplica'])){
                        if(respuestaFind[i]['no_aplica'] == "1") pregunta['hasApply'] = false;
                    }
                    //if(!_.isNull(respuestaFind[i].comentarios) && !_.isUndefined(respuestaFind[i].comentarios))
                    if(!_.isNull(respuestaFind[i].respuesta) && !_.isUndefined(respuestaFind[i].respuesta)) pregunta.respuesta.push(respuestaFind[i].respuesta);
                    if(!_.isNull(respuestaFind[i].adminComentario) && !_.isUndefined(respuestaFind[i].adminComentario)) pregunta.adminComentario.push(respuestaFind[i].admin_comentario);
                    _.remove(respuestasPorUnir, {id: respuestaFind[i].id});
                }
            }

            console.log("pregunta.respuesta ", pregunta.respuesta);

           /* if(pregunta.tipo_id == 3){
                console.log("pregunta tipo texto ", pregunta)
                if(!_.isNull(respuestaFind[i]) && !_.isUndefined(respuestaFind[i]) && !_.isNull(respuestaFind[i]['no_aplica']) && !_.isUndefined(respuestaFind[i]['no_aplica'])){
                    if(respuestaFind[i]['no_aplica'] == "1") pregunta['hasApply'] = false;
                }
                console.log("respuesta tipo texto ", respuestaFind)
            }*/
            /*pregunta.respuesta = respuestaFind.respuesta;
            pregunta.adminComentario = respuestaFind.admin_comentario;*/

        }

        console.log("pregunta 2", pregunta);

        if (pregunta.alternativas) {
            console.log("pregunta 3", pregunta);
            for (let alternativa of pregunta.alternativas) {
                if (_.isNull(alternativa.respuesta)) {
                    alternativa.respuesta = {}
                }
                var respuestaFind2 = _.find(respuestasPorUnir, {
                    pregunta_id: pregunta.id,
                    alternativa_id: alternativa.id
                });
                if(!_.isNull(respuestaFind2) && !_.isUndefined(respuestaFind2) && !_.isNull(respuestaFind2['no_aplica']) && !_.isUndefined(respuestaFind2['no_aplica'])) {
                    if(respuestaFind2.no_aplica == "1") pregunta['hasApply'] = false;
                }

                if (!_.isUndefined(respuestaFind2)) {
                    console.log("respuestaFind2 ", respuestaFind2);
                    alternativa.respuestaAdmin = respuestaFind2.admin_comentario; //modalMessage directiva
                    alternativa.respuesta = respuestaFind2.respuesta;
                    alternativa.comentarios = respuestaFind2.comentarios;
                    _.remove(respuestasPorUnir, {id: respuestaFind2.id});

                    console.log("alternativa ", alternativa)
                }
                if (alternativa.subPregunta) {
                    this.joinQuestion(alternativa.subPregunta, respuestasPorUnir);
                }

                console.log("alternativa resp ", JSON.parse(JSON.stringify(alternativa.respuesta)))
                var resp = JSON.parse(JSON.stringify(alternativa.respuesta))
                if (pregunta.tipo_id == 2 && (!_.isUndefined(resp) && !_.isNull(resp))) {
                    if (!_.isUndefined(alternativa.respuesta.data) && !_.isNull(alternativa.respuesta.data) && !_.isUndefined(alternativa.respuesta.alternativa_id) && !_.isNull(alternativa.respuesta.alternativa_id)) {
                        alternativa.respuesta.checked = true;
                        console.log("update resp ", alternativa)
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
            console.log("es null ", pregunta)
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

    /**
     * Cambia a foto siguiente
     */
    slideChanged() {
        let currentIndex = this.slides.getActiveIndex();
        console.log('Current index is', currentIndex);
    }

    goToRightSlide() {
        console.log("goToRightSlide ")
        if(!this.slides.isEnd()) this.slides.slideTo(this.slides.getActiveIndex() + 1, 500);
        else console.log("es la ultima")
    }

    goToLeftSlide() {
        console.log("goToLeftSlide ")
        if(!this.slides.isBeginning()) this.slides.slideTo(this.slides.getActiveIndex() - 1, 500);
        else console.log("es la primera")
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
