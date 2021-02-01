import { ApplicationRef, Component, ViewChild, ElementRef } from '@angular/core';
import { Camera } from '@ionic-native/camera';
import {
    IonicPage,
    LoadingController,
    NavController,
    MenuController,
    NavParams,
    Events,
    AlertController,
    Content,
    ActionSheetController,
    ModalController,
    Nav,
    App,
    Slides
} from 'ionic-angular';
import { config } from "../../tienda/checklist-tienda.config";
import { global } from '../../../../shared/config/global'
import { RequestProvider } from "../../../../shared/providers/request/request";
import * as _ from 'lodash';
import { UtilProvider } from "../../../../shared/providers/util/util";
import { AmbitoPage } from "../ambito/ambito";
import { Storage } from "@ionic/storage";
import { SessionProvider } from "../../../../shared/providers/session/session";

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { PreguntasIncompletasComponent } from '../../components/preguntas-incompletas/preguntas-incompletas';
import { globalConfig } from '../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the DetallePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-detalle',
    templateUrl: 'detalle.html',
})
export class DetallePage {

    @ViewChild(Content) content: Content;
    @ViewChild("swiperElement") swiperElement;

    ambitos = [];
    preguntas = [];
    respuestas = [];
    respuestasPorUnir = [];
    visita_tienda = [];
    thisSession = {};
    visita = {};
    checklist = {};
    task = {};
    ambito = null;
    nombreAmbito = null;
    visita_id = null;
    task_id = null;
    sucursal = null;
    state = null;
    checklistEnviado: boolean = false;
    ready: boolean = false;
    mostrarAmbitos: boolean = false;
    mostrarPlantilla: boolean = false;
    isTask: boolean = false;
    notValidate: boolean = false;
    validSend: boolean = false;
    comentario: string;

    suc_id = 0;
    user_id = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private raw_questions: any = [];
    private leaving_with_save: boolean = false;
    private is_last_ambit: boolean = false;

    private fromStats: boolean = false;

    private ambitState: BehaviorSubject<any> = new BehaviorSubject<any>(true);

    private ambitSaved: boolean = false;

    private restantes = [];

    private mostrandoInfo = false;
    private showSaveBtn: boolean = false;

    private slideIndex: number = 0;

    // por acá
    private ambitoList: any;
    private ambito_id: any;
    private lastAmbito = false;
    private view: string = null;
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private event: Events,
        public camera: Camera,
        private applicationRef: ApplicationRef,
        private storage: Storage,
        private session: SessionProvider,
        private alert: AlertController,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private modalController: ModalController,
        private app: App,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }


    /**
     * Al iniciar el controlador, dependiendo si se trata de checklist o visitas se define el funcionamiento
     * @returns {Promise<void>}
     */
    async ionViewDidLoad() {
        // TRACK DE VISTA
        try { this.firebaseAnalyticsProvider.trackView('DetalleChecklist'); } catch (e) { }
        //try{this.firebaseAnalyticsProvider.trackScreenEvent( 'Detalle', 'Checklist' );}catch(e){}

        this.app.getActiveNav().swipeBackEnabled = false;

        this.fromStats = this.navParams.data.fromStats;

        this.validSend = false;

        this.notValidate = false;

        this.thisSession = await this.util.getInternalSession();

        let active = this.navCtrl.getActive();

        if (active.instance instanceof DetallePage) {
            // Recojo el id del ambito
            if (_.isNull(this.ambito) || _.isUndefined(this.ambito)) this.ambito = this.navParams.data.ambito_id;

            // Si proviene de visitas
            if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
                this.visita_id = this.navParams.data.visita_id;

                this.isTask = false;

                await this.getDatafromMemory(this.navParams.data.checklist_id, this.navParams.data.ambito_id);

                if (global.showQuestionsAsSlides && this.navParams.data.visita) {
                    this.restantes = this.validateAnswers();
                    if (this.restantes.length) {
                        let index = _.findIndex(this.preguntas, this.restantes[0]);

                        if (index > -1 && this.swiperElement && this.swiperElement.directiveRef) {
                            this.swiperElement.directiveRef.setIndex(index);
                        }
                    }
                    this.saveQuestionsStatus();
                }


                // si vengo de sucursal
            } else if (this.navParams.data.check_id && this.navParams.data.ambito_id && this.navParams.data.ambitoList && this.navParams.data.onlyWatch) {
                // Lista de ambitos con sus respectivas preguntas
                this.ambitoList = this.navParams.data.ambitoList;

                //pregunto si vengo desde el ultimo ambito
                if (this.navParams.data.ambito_id == _.last(this.ambitoList).id) this.lastAmbito = true;

                this.ambitos = this.ambitoList;

                if (this.navParams.data.onlyWatch == true) this.checklistEnviado = true;

                this.getPreguntasSucursal(this.navParams.data.ambito_id);

                // Si proviene de tareas
            } else if (!_.isUndefined(this.navParams.data.task_id) && !_.isNull(this.navParams.data.task_id)) {
                this.task_id = this.navParams.data.task_id;

                this.isTask = true;

                this.getTaskDetail();

                // Si proviene de checklist
            } else {
                if (!_.isUndefined(this.navParams.data.suc_id) && !_.isNull(this.navParams.data.suc_id)) {
                    this.suc_id = this.navParams.data.suc_id;
                }

                if (!_.isUndefined(this.navParams.data.user_id) && !_.isNull(this.navParams.data.user_id)) {
                    this.user_id = this.navParams.data.user_id;
                }

                this.getPreguntas(this.navParams.data.checklist_id, this.navParams.data.ambito_id);

                this.getAmbitos(this.navParams.data.checklist_id);

                this.checklistEnviado = this.navParams.data.estado == 4 ? true : false;

                if (!_.isUndefined(this.navParams.data.onlyWatch) && !_.isNull(this.navParams.data.onlyWatch)) {
                    if (this.navParams.data.onlyWatch == true) this.checklistEnviado = true;
                }

                this.isTask = false;
            }
        }

        this.ambitState.delay(500).debounceTime(2000).subscribe((data) => {
            if ((this.ambitSaved || (global.leaveWithIncompleteChecklist === false && this.areNewAnswers())) && this.visita_id) {
                this.reevaluarPreguntas();
            }
        });
    }

    slideChanged() {
        this.showSaveBtn = (this.slideIndex < (this.preguntas.length - 1) ? false : true);
        this.content.resize();
    }

    get global() {
        return global;
    }

    ionViewWillEnter() {
        this.menu.enable(false, "menu");
        this.event.subscribe('CAMERA-BACKGROUND', (data) => {
            this.view = data.view || null;
        });
    }

    ngOnDestroy(){
        this.event.unsubscribe('CAMERA-BACKGROUND');
    }

    ionViewWillLeave() {
        this.app.getActiveNav().swipeBackEnabled = true;
    }

    async ionViewCanLeave() {
        if (global.leaveWithIncompleteChecklist === false && this.restantes.length && !this.mostrandoInfo) {
            this.util.showAlert('Atención', 'El checklist está incompleto, debes completarlo antes de salir.');

            if (global.showQuestionsAsSlides && this.navParams.data.visita) {
                if (this.restantes.length) {
                    let index = _.findIndex(this.preguntas, this.restantes[0]);

                    if (index > -1 && this.swiperElement && this.swiperElement.directiveRef) {
                        this.swiperElement.directiveRef.setIndex(index);
                    }
                }
            }

            return false;
        }

        if (this.mostrandoInfo) return true;

        if (this.notValidate == false) {
            let saveBeforeLeave: any = null;

            // Promesa que al ser resuelta se le asigna un boolean, que define si se cierra o no la vista
            const canLeave = new Promise<Boolean>(resolve => saveBeforeLeave = resolve);

            // Si se ha guardado el ambito y es el último, salimos de la vista
            // (Al presionar "GUARDAR ÁMBITOS" y es el último)
            if (this.is_last_ambit) {
                saveBeforeLeave(true);
                return canLeave;
            }

            // Si no es el último ámbito y hay cambios, consultamos si quiere descartar o guardar las nuevas respuestas
            if (this.areNewAnswers()) {
                let alert = this.alert.create({
                    title: 'Atención',
                    subTitle: 'Tienes cambios sin guardar, te recomendamos guardarlos antes de salir',
                    buttons: [{
                        text: 'Descartar',
                        handler: () => {
                            // Salimos sin guardar
                            saveBeforeLeave(true)
                        }
                    }, {
                        text: 'Guardar',
                        handler: () => {
                            // Guardamos y decimos que saldremos desde la alerta (leaving_with_save = true;)
                            this.guardarPreguntas(this.preguntas, true);
                            this.leaving_with_save = true;
                        }
                    }],
                });
                alert.present();
                // Si la alerta se cerró desde los botones, la vista se cerrará
                alert.onWillDismiss(() => {
                    setTimeout(() => {
                        saveBeforeLeave(this.leaving_with_save);
                    }, 500);
                });
                return canLeave;
            }
        }
        // En cualquier otro caso cerramos la vista
        return true;
    }

    ionViewWillUnload() {
        this.ambitState.unsubscribe();
    }

    /**
     * Carga datos almacenados en memoria para visitas
     * @param checklist
     * @param ambito
     */
    getDatafromMemory(checklist, ambito) {
        this.validSend = false;

        let context = this;

        let loadingTime = setTimeout(function () {
            context.validSend = true;
        }, (2000) //5 segundos
        );

        return new Promise((resolve, reject) => {
            this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {

                if (val) this.visita_tienda = JSON.parse(val);

                let fromVisit = true;

                if (!_.isNull(this.visita_id) && !_.isUndefined(this.visita_id) && this.visita_id != 0) {
                    this.checklist = _.find(this.visita_tienda['checklist_visita'], {
                        'id': checklist,
                        'visita_id': this.visita_id
                    });
                    if (_.isUndefined(this.checklist)) {
                        this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist });
                        fromVisit = false;
                    }
                } else {
                    this.checklist = _.find(this.visita_tienda['checklists'], { 'id': checklist });
                    fromVisit = false;
                }

                this.respuestas = _.filter(this.visita_tienda['respuestas'], {
                    ambito_id: ambito,
                    visita_id: this.visita_id
                });

                if (!_.isUndefined(this.checklist) && !_.isNull(this.checklist)) {
                    this.ambitos = _.orderBy(this.checklist['ambitos'],
                        ((this.checklist['ambitos'] && this.checklist['ambitos'][0] && this.checklist['ambitos'][0].orden) ? 'orden' : 'id')
                        , 'asc');

                    var foundAmbito = _.find(this.ambitos, { 'id': ambito });

                    let context = this;

                    this.ambito = foundAmbito.id;

                    if (!_.isUndefined(foundAmbito) && !_.isNull(foundAmbito)) {
                        context.preguntas = foundAmbito['preguntas'];

                        context.nombreAmbito = foundAmbito.nombre;

                        await this.updateAnswers(context.preguntas).then(preguntas => {
                            context.preguntas = preguntas;

                            this.changeQuestionsFormat(context.preguntas).then(preguntas2 => {
                                var preguntasArray = preguntas2;

                                context.preguntas = preguntasArray;

                                this.renderPreguntas(preguntasArray, fromVisit).then(preguntas3 => {
                                    //var renderAnswer = preguntas3;

                                    // Para cada alternativa de cada pregunta transformamos el atributo foto (Sólo si es un arreglo).
                                    // Si multi_foto = 0, el atributo foto pasa a ser un objeto de tipo { foto: <base64> }
                                    _.forEach(preguntas3, (pregunta) => {

                                        let hasResp = _.find(JSON.parse(JSON.stringify(this.visita_tienda['respuestas'])), {
                                            pregunta_id: pregunta.id,
                                            no_aplica: 1,
                                            'visita_id': this.visita_id
                                        })

                                        if (!_.isUndefined(hasResp) && !_.isNull(hasResp)) pregunta.hasApply = false;
                                        else {
                                            let hasResp2 = _.find(JSON.parse(JSON.stringify(this.visita_tienda['respuestas'])), {
                                                pregunta_id: pregunta.id,
                                                no_aplica: 0,
                                                'visita_id': this.visita_id
                                            })

                                            if (!_.isUndefined(hasResp2) && !_.isNull(hasResp2)) pregunta.hasApply = true;
                                            //else pregunta.hasApply = undefined;
                                        }

                                        if (pregunta.alternativas && pregunta.alternativas.length > 0) {
                                            _.forEach(pregunta.alternativas, (alternativa) => {
                                                if (alternativa.multi_foto === 0 && _.isArray(alternativa.foto)) {
                                                    alternativa.foto = ((alternativa.foto && alternativa.foto.length) ? alternativa.foto[0] : { foto: null });
                                                }
                                            });
                                        }
                                    });

                                    this.preguntas = preguntas3;

                                    this.saveQuestionsStatus();

                                    this.applicationRef.tick();

                                    resolve(this.preguntas);
                                });
                            });
                        });
                    }
                }
            });
            try {
                this.content.scrollToTop(300);
            } catch (e) {
                // error
            }
        });
    }

    // Guarda el estado bruto de las preguntas al iniciar
    saveQuestionsStatus() {
        let questions: any = [];

        _.forEach(this.preguntas, (question) => {
            let raw = {
                value: JSON.stringify(question),
                id: question.id
            };
            questions.push(raw);
        });
        this.raw_questions = questions;
    }

    // Compara las preguntas en bruto con su nuevo estado, y retorna true o false si es que hay cambios
    areNewAnswers() {
        // Recorremos las preguntas presentes en la vista
        for (let question of this.preguntas) {
            // Buscamos su simil sin modificar, los comparamos y retornamos true en caso de que sean distintos
            let raw_question = _.find(this.raw_questions, { id: question.id });
            if (raw_question && raw_question.value !== JSON.stringify(question)) return true;
        }
        // Si todas las preguntas siguen iguales, retornamos false
        return false;
    }

    /**
     * Cambia estado a respuestas cargadas para actualizar su estado, de acuerdo al tipo de pregunta se asigna
     * la información correspondiente
     * @param preguntas
     * @returns {Promise<any>}
     */
    async updateAnswers(preguntas) {
        let context = this;

        _.forEach(preguntas, function (question) {
            if (question.tipo_id == "1" || question.tipo_id == "2") {
                _.forEach(question.alternativas, function (ans) {
                    ans.checked = false;
                });
            }
        });

        _.forEach(this.respuestas, function (value) {
            if (value && context && value.visita_id == context.visita_id) {
                if (!_.isNull(value.no_aplica) && !_.isUndefined(value.no_aplica) && value.no_aplica == 1) {
                    preguntas[value.pregunta_id]['hasApply'] = false;
                } else {
                    if (value.tipo_id == 1 || value.tipo_id == "1") {
                        if (!value.pregunta_alternativa_id || value.pregunta_alternativa_id == "0") { // Si no es una sub pregunta
                            preguntas[value.pregunta_id].respuesta.texto = value.respuesta_alternativa_id;
                            preguntas[value.pregunta_id].texto_adicional = value.texto_adicional;
                            preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].checked = true;
                            preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].comentarios = value.comentarios ? value.comentarios : "";
                            if (value.foto) {
                                switch (true) {
                                    case typeof value.foto == 'string':
                                        var timeStamp = String(new Date().getTime());
                                        var foto_id = "foto-" + timeStamp;
                                        value.foto = [{
                                            id: foto_id,
                                            foto: value.foto,
                                            text_adicional: ''
                                        }];

                                        value.foto.id = value.foto.id * 1;
                                        break;
                                }
                                preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].foto = value.foto;
                            } else if (value.texto_adicional) {
                                preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].texto_adicional = value.texto_adicional;
                            }
                        } else { // Si es una sub pregunta
                            var alternativa = preguntas[value.pregunta_id].alternativas[value.pregunta_alternativa_id];
                            if (alternativa && alternativa.subpregunta) {
                                alternativa.subpregunta.respuesta.texto = value.respuesta_alternativa_id;
                            }
                        }
                    } else if (value.tipo_id == 2 || value.tipo_id == "2") {
                        preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].checked = true;
                        preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].comentarios = value.comentarios ? value.comentarios : "";
                        if (value.texto_adicional) {
                            preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].texto_adicional = value.texto_adicional;
                        } else if (value.foto) {
                            preguntas[value.pregunta_id].alternativas[value.respuesta_alternativa_id].foto = value.foto;
                        }
                    } else if (value.tipo_id == 3 || value.tipo_id == "3") {
                        preguntas[value.pregunta_id].respuesta.texto = value.texto_respuesta;
                    } else if (value.tipo_id == 4 || value.tipo_id == "4") {
                        if (value.foto) {
                            preguntas[value.pregunta_id].respuesta.foto = value.foto;
                        }
                    }
                }
            }
        });
        return preguntas;
    }

    /**
     * Cambia formato de preguntas a array
     * @param preguntas
     * @returns {Promise<any[]>}
     */
    async changeQuestionsFormat(preguntas) {
        var preguntasArray = [];
        _.forEach(preguntas, function (pregunta) {
            preguntasArray.push(JSON.parse(JSON.stringify(pregunta)));
        });
        return preguntasArray;
    }

    /**
     * Asigna respuestas en memoria a preguntas seleccionando la información respectiva al tipo de pregunta
     * @param preguntasArray
     * @returns {Promise<any[]>}
     */
    async renderPreguntas(preguntasArray, fromVisit) {
        var preguntas = [];
        _.forEach(preguntasArray, function (value, key) {
            if (value.tipo_id == "1" || value.tipo_id == 1) {
                preguntas[key] = {
                    respuesta: value.respuesta.texto,
                    texto_adicional: value.texto_adicional,
                    id: value.id,
                    nombre: value.nombre,
                    tipo_id: value.tipo_id,
                    codigo_tipo: "radio",
                    aplica: value.aplica * 1,
                    alternativas: []
                };
                if (fromVisit == true) preguntas[key]['hasApply'] = value.hasApply || value.hasApply == false ? value.hasApply : undefined;

                _.forEach(value.alternativas, function (valor, llave) {
                    var alternativas = {};
                    alternativas = {
                        id: valor.id,
                        nombre: valor.nombre,
                        tipo_id: valor.tipo_id,
                        pregunta_id: valor.pregunta_id,
                        adicional: valor.adicional,
                        foto: valor.foto,
                        checked: valor.checked ? valor.checked : false,
                        comentario: valor.comentario ? valor.comentario : 0,
                        comentarios: valor.comentarios ? valor.comentarios : "",
                    };
                    if (!_.isUndefined(valor.checked) && !_.isNull(valor.checked)) alternativas['checked'] = valor.checked;
                    if (!_.isUndefined(valor.multi_foto) && !_.isNull(valor.multi_foto)) alternativas['multi_foto'] = valor.multi_foto;
                    if (!_.isUndefined(valor.peso) && !_.isNull(valor.peso)) alternativas['peso'] = valor.peso;
                    if (!_.isUndefined(valor.tipo_alias) && !_.isNull(valor.tipo_alias)) alternativas['tipo_alias'] = valor.tipo_alias;
                    if (!_.isUndefined(valor.texto_adicional) && !_.isNull(valor.texto_adicional)) alternativas['texto_adicional'] = valor.texto_adicional;

                    preguntas[key].alternativas.push(alternativas);
                    if (valor.subpregunta) {
                        var tempAnswer = {};
                        if (valor.subpregunta.tipo_id == "1" || valor.subpregunta.tipo_id == 1) {
                            tempAnswer[llave] = {
                                respuesta: valor.subpregunta.respuesta.texto
                            };
                            preguntas[key].subpregunta = tempAnswer;
                        } else if (valor.subpregunta.tipo_id == "2" || valor.subpregunta.tipo_id == 2) {
                            if (valor.subpregunta.respuesta.texto) {
                                preguntas[key].subpregunta = valor.subpregunta;
                                var alternativas = {};
                                _.forEach(valor.subpregunta.alternativas, function (subValor, subLlave) {
                                    alternativas[subLlave] = {
                                        id: subValor.id,
                                        nombre: subValor.nombre,
                                        tipo_id: subValor.tipo_id,
                                        pregunta_id: subValor.pregunta_id,
                                        adicional: subValor.adicional,
                                        checked: subValor.checked,
                                        parent_id: valor.id
                                    };
                                });
                                preguntas[key].subpregunta.alternativas = alternativas;
                            }
                        } else if ((valor.subpregunta.tipo_id == "3" || valor.subpregunta.tipo_id == 3) && (valor.subpregunta.respuesta || valor.subpregunta.respuesta === 0)) {
                            tempAnswer[valor.subpregunta.alternativa_id] = {
                                respuesta: valor.subpregunta.respuesta.alternativa_id,
                                texto_adicional: valor.subpregunta.respuesta.texto
                            };
                            preguntas[key].subpregunta = tempAnswer;
                        }
                    }
                });
            } else if (value.tipo_id == "2" || value.tipo_id == 2) {
                preguntas[key] = {};
                preguntas[key] = {
                    id: value.id,
                    nombre: value.nombre,
                    tipo_id: value.tipo_id,
                    aplica: value.aplica * 1,
                    codigo_tipo: "check"
                };

                if (fromVisit == true) preguntas[key]['hasApply'] = value.hasApply || value.hasApply == false ? value.hasApply : undefined;

                var alternativas = [];
                if (!_.isNull(value.alternativas) && !_.isUndefined(value.alternativas)) {
                    _.forEach(value.alternativas, function (valor, llave) {
                        alternativas.push({
                            id: valor.id,
                            nombre: valor.nombre,
                            tipo_id: valor.tipo_id,
                            pregunta_id: valor.pregunta_id,
                            adicional: valor.adicional,
                            texto_adicional: valor.texto_adicional,
                            checked: valor.checked ? valor.checked : false,
                            subpregunta: valor.subpregunta ? valor.subpregunta : null,
                            foto: valor.foto,
                            comentario: valor.comentario ? valor.comentario : 0,
                            comentarios: valor.comentarios ? valor.comentarios : "",
                            peso: valor.peso ? valor.peso : null
                        });

                        if (!_.isNull(valor.subpregunta) && !_.isUndefined(valor.subpregunta)) {
                            if (!_.isNull(valor.subpregunta.alternativas) && !_.isUndefined(valor.subpregunta.alternativas)) {
                                let alternativasArray = [];
                                _.forEach(valor.subpregunta.alternativas, function (alt) {
                                    alternativasArray.push(JSON.parse(JSON.stringify(alt)));
                                });

                                valor.subpregunta.alternativas = alternativasArray;

                            }
                        }
                    });
                }

                preguntas[key].alternativas = alternativas;
            } else if (value.tipo_id == "3" || value.tipo_id == 3) {
                value.aplica = value.aplica * 1;
                preguntas[key] = value;
                if (fromVisit == true) preguntas[key]['hasApply'] = value.hasApply || value.hasApply == false ? value.hasApply : undefined;
                //preguntas[key].hasApply = value.hasApply || value.hasApply == false ? value.hasApply : undefined;
                preguntas[key].codigo_tipo = "text";
                if (!_.isUndefined(preguntas[key].respuesta) && !_.isNull(preguntas[key].respuesta)) {
                    if (!_.isUndefined(preguntas[key].respuesta.texto) && !_.isNull(preguntas[key].respuesta.texto)) {
                        if (!_.isUndefined(preguntas[key].respuesta.texto.data) && !_.isNull(preguntas[key].respuesta.texto.data)) {
                            preguntas[key].respuesta = preguntas[key].respuesta.texto.data;
                        } else if (typeof preguntas[key].respuesta.texto === "string" || typeof preguntas[key].respuesta.texto === "number") {
                            preguntas[key].respuesta = preguntas[key].respuesta.texto;
                        } else {
                            preguntas[key].respuesta = "";
                        }
                    } else {
                        preguntas[key].respuesta = "";
                    }
                }
            } else if (value.tipo_id == "4" || value.tipo_id == 4) {
                value.aplica = value.aplica * 1;
                preguntas[key] = {};
                preguntas[key] = value;
                if (fromVisit == true) preguntas[key]['hasApply'] = value.hasApply || value.hasApply == false ? value.hasApply : undefined;
                //preguntas[key].hasApply = value.hasApply || value.hasApply == false ? value.hasApply : undefined;
                preguntas[key].codigo_tipo = "cam";
            }
            preguntas[key].visita = true;
        });

        this.ready = true;
        return preguntas;
    }

    /**
     * Trae preguntas asociadas a checklist y ambito luego ordena para asociar pregunta con respuesta
     * @param checklist_id
     * @param ambito_id
     * @returns {Promise<{}>}
     */
    async getPreguntas(checklist_id, ambito_id) {
        this.validSend = false;

        this.applicationRef.tick();

        let context = this;

        let loadingTime = setTimeout(function () {
            context.validSend = true;
        }, (2000) //5 segundos
        );

        let active = this.navCtrl.getActive();

        if (active.instance instanceof DetallePage || active.instance instanceof AmbitoPage) {
            const loading = this.loading.create({ content: 'Obteniendo detalles' });

            loading.present();

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
                .then((response: any) => {
                    try {
                        if (!_.isUndefined(response.code)) {
                            if (response.code == 403) {
                                this.util.showAlert("Atención", "Las preguntas no pudieron ser cargadas");
                            }
                        }
                        if (!_.isUndefined(response.data)) {
                            this.preguntas = response.data.preguntas;

                            this.respuestasPorUnir = response.data.respuestas;

                            this.joinQuestions(this.preguntas, this.respuestasPorUnir);

                            this.getAmbitos(checklist_id);

                            this.ready = true;
                        }
                        loading.dismiss();
                    } catch (e) {
                        this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
                    }
                })
                .catch((error: any) => {
                    loading.dismiss();
                    if (error && error.message) this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
                });
            this.saveQuestionsStatus();

            return data;
        }
    }

    // Recibo las preguntas asociadas a la sucursal y luego filtro segun ambito
    getPreguntasSucursal(ambito_id) {
        this.lastAmbito = false;

        // compruebo si vengo desde el ultimo ambito
        if (ambito_id == _.last(this.ambitoList).id) this.lastAmbito = true;

        // Filtro preguntas segun el ambito_id
        let ambito = _.find(this.ambitoList, { id: ambito_id });
        if (ambito) {
            this.preguntas = ambito.preguntas;
            this.joinQuestions(this.preguntas, []);
            this.ready = true;
            this.ambito_id = ambito.id;
            this.nombreAmbito = ambito.ambito;
            return;
        }

    }

    /**
     * Trae ambitos asociados a checklist desde api
     * @param checklist_id
     * @returns {Promise<{}>}
     */
    async getAmbitos(checklist_id) {
        let data = {};
        await this.request
            .get(config.endpoints.get.asignacion + checklist_id, true)
            .then((response: any) => {
                try {
                    if (!_.isUndefined(response.code)) {
                        if (response.code == 403) {
                            this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
                        }
                    }
                    if (!_.isUndefined(response.data)) {
                        let ambitos = response.data.ambitos;

                        if (!_.isNull(this.ambito) && !_.isUndefined(this.ambito)) {
                            this.nombreAmbito = this.updateAmbito(this.ambito);
                        } else {
                            this.nombreAmbito = this.updateAmbito(this.navParams.data.ambito_id);
                        }

                        this.ambitos = _.orderBy(ambitos, ((ambitos && ambitos[0] && ambitos[0].orden) ? 'orden' : 'id'), ['asc']);
                    }
                }
                catch (e) {
                    this.util.showAlert("Atención", "Ocurrió un error, por favor contacte a soporte.");
                }
            })
            .catch((error: any) => {
                if (error && error.message) this.util.showAlert("Atención", error.message);
            });
        return data;
    }

    validateAnswers() {
        let incompleteQuestions = [];
        _.forEach(this.preguntas, (pregunta) => {

            if (pregunta.aplica && pregunta.hasApply == false) {
                pregunta.incomplete = false;
            } else if (pregunta.aplica && (pregunta.hasApply == null || pregunta.hasApply == undefined)) {
                pregunta.incomplete = true;
                incompleteQuestions.push(pregunta);
            } else if (pregunta /* && pregunta.incomplete == true*/) {

                let foundResp = _.find(this.visita_tienda['respuestas'], {
                    visita_id: this.visita_id,
                    pregunta_id: pregunta.id
                });

                if (!_.isUndefined(foundResp) && !_.isNull(foundResp)) {

                    if (pregunta.tipo_id == 1) {
                        _.forEach(pregunta.alternativas, (alternativa) => {
                            if (alternativa.checked == true) {
                                if (alternativa.tipo_id == 3 && (!alternativa.texto_adicional && alternativa.texto_adicional !== 0)) {
                                    pregunta['incomplete'] = true;
                                    incompleteQuestions.push(pregunta);
                                } else if (alternativa.tipo_id == 4 && (_.isUndefined(alternativa.foto) || _.isNull(alternativa.foto) || this.isEmpty(alternativa.foto) || _.isUndefined(alternativa.foto.foto) || _.isNull(alternativa.foto.foto))) {
                                    pregunta['incomplete'] = true;
                                    incompleteQuestions.push(pregunta);
                                } else if (alternativa.comentario == 1 && (!alternativa.comentarios && alternativa.comentarios !== 0)) {
                                    pregunta['incomplete'] = true;
                                    incompleteQuestions.push(pregunta);
                                } else {
                                    pregunta.incomplete = false;
                                }
                            }
                        })
                    } else if (pregunta.tipo_id == 3 && (!foundResp.texto_respuesta && (foundResp.texto_respuesta !== 0 && foundResp.texto_respuesta !== '0'))) {
                        pregunta.incomplete = true;
                        incompleteQuestions.push(pregunta);
                    } else if (pregunta.tipo_id == 4 && (!pregunta.respuesta || !pregunta.respuesta.foto || !pregunta.respuesta.foto.length)) {
                        pregunta.incomplete = true;
                        incompleteQuestions.push(pregunta);
                    } else {
                        pregunta.incomplete = false;
                    }

                } else {
                    pregunta.incomplete = true;
                    incompleteQuestions.push(pregunta);
                }
            } else {


                let foundResp = _.find(this.visita_tienda['respuestas'], {
                    visita_id: this.visita_id,
                    pregunta_id: pregunta.id
                });

                if (!_.isUndefined(foundResp) && !_.isNull(foundResp)) {
                    pregunta.incomplete = false;

                    _.forEach(pregunta.alternativas, (alternativa) => {
                        if (alternativa.checked == true) {
                            if (alternativa.comentario == 1 && alternativa == "") {
                                pregunta.incomplete = true;
                                incompleteQuestions.push(pregunta);
                            }
                        }
                    });
                } else {
                    pregunta.incomplete = true;
                    incompleteQuestions.push(pregunta);
                }
            }
        });

        this.applicationRef.tick();

        return incompleteQuestions;
    }

    // Para cambiar de ambito dentro del mismo ambito
    /**
     * Avanza al siguiente ambito del cuestionario, si no hay siguiente, se cierra la página
     * @param ambito_id
     */
    changeAmbito(ambito_id) {

        if (!_.isUndefined(ambito_id) && !_.isNull(ambito_id)) {
            // Si proviene desde visitas
            if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
                this.getDatafromMemory(this.navParams.data.checklist_id, ambito_id);

                if (global.showQuestionsAsSlides && this.navParams.data.visita && this.swiperElement && this.swiperElement.directiveRef) {
                    this.swiperElement.directiveRef.setIndex(0);
                    setTimeout(() => {
                        this.swiperElement.directiveRef.update();
                        this.content.resize();
                    }, 300)
                }


                // Si vengo de sucursal
            } else if (this.navParams.data.check_id) {
                this.getPreguntasSucursal(ambito_id);
                this.nombreAmbito = this.ambitoList.ambito_id.ambito;
            } else {
                this.getPreguntas(this.navParams.data.checklist_id, ambito_id);
            }

            this.visita_id = this.navParams.data.visita_id;

            this.nombreAmbito = this.updateAmbito(ambito_id);

            this.applicationRef.tick();

            // Siguiente ambito (ambito viaja en null)
        } else {
            // desde sucursal
            if (this.navParams.data.check_id) {
                for (let i = 0; i < this.ambitoList.length; i++) {

                    // si es el ultimo ambito del arreglo
                    if (this.ambito_id == _.last(this.ambitoList).id) {
                        this.navCtrl.pop();
                        break;
                    } else if (this.ambito_id == this.ambitoList[i].id) {
                        //this.changeAmbito( this.ambitoList[ i+1 ].id );
                        this.getPreguntasSucursal(this.ambitoList[i + 1].id);
                        this.ambito = this.ambitoList[i + 1].id;
                        break;
                    }
                }

                return;
            }

            let temp_ambits = this.setAmbitStatus(this.ambitos);

            let foundAmbito = _.find(temp_ambits, { id: this.ambito });

            if (!_.isUndefined(foundAmbito) && !_.isNull(foundAmbito)) {
                let indexFound = -1;

                for (let index = 0; index < temp_ambits.length; index++) {
                    if (temp_ambits[index].id === foundAmbito['id']) {
                        indexFound = index;

                        break;
                    }
                }

                if (indexFound > -1) {
                    if (!_.isUndefined(this.visita_id) && !_.isNull(this.visita_id)) {

                        this.restantes = this.validateAnswers();

                        this.applicationRef.tick();
                        if (this.restantes.length > 0) {
                            let alert = this.alert.create({
                                title: 'Atención',
                                subTitle: 'Tiene preguntas sin responder, puedes guardar el contenido y continuar más tarde. ¿Desea guardar el formulario?',
                                buttons: [{
                                    text: 'Aceptar',
                                    handler: async data => {
                                        this.changeToValidAmbit(indexFound, temp_ambits);
                                    }
                                }, {
                                    text: 'Cancelar',
                                    handler: data => {
                                    }
                                }],
                            });
                            alert.present();


                        } else {
                            this.changeToValidAmbit(indexFound, temp_ambits);
                        }
                    } else {
                        this.changeToValidAmbit(indexFound, temp_ambits);
                    }
                } else {
                    this.notValidate = true;
                    this.navCtrl.pop();
                }
            } else {
                if (!_.isUndefined(foundAmbito) && !_.isNull(foundAmbito)) {

                    let foundAmbito = _.find(this.ambitos, { id: this.ambito });
                    let indexFound = -1;
                    for (let index = 0; index < temp_ambits.length; index++) {
                        if (temp_ambits[index].id === foundAmbito.id) {
                            indexFound = index;
                            break;
                        }
                    }
                    if (indexFound > -1) {
                        this.changeToValidAmbit(indexFound, temp_ambits);
                    } else {
                        this.notValidate = true;
                        this.navCtrl.pop();
                    }
                } else {
                    this.notValidate = true;
                    this.navCtrl.pop();
                }
            }
        }
    }

    changeToValidAmbit(indexFound: any, temp_ambits: any) {
        if (!_.isUndefined(temp_ambits[indexFound]) && !_.isNull(temp_ambits[indexFound])) {
            if (temp_ambits[indexFound].temp_status_id !== 3) {
                let preAmb = this.ambito;

                if (this.ambito != temp_ambits[indexFound].id) this.ambito = temp_ambits[indexFound].id;

                let postAmb = this.ambito;

                // Si proviene desde visitas
                if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
                    if (preAmb != postAmb) {
                        this.ambitSaved = false;

                        if (this.navParams.data.checklist_id) this.getDatafromMemory(this.navParams.data.checklist_id, this.ambito);

                        else this.getDatafromMemory(temp_ambits[indexFound].id, this.ambito);
                    } else {
                        //this.is_last_ambit = true;
                        if (temp_ambits[indexFound + 1] && temp_ambits[indexFound + 1].temp_status_id !== 3) {
                            this.changeToValidAmbit((indexFound + 1), temp_ambits);

                        } else if (temp_ambits[indexFound + 2] && temp_ambits[indexFound + 2].temp_status_id !== 3) {
                            this.changeToValidAmbit((indexFound + 2), temp_ambits);
                        } else if (temp_ambits[indexFound + 3] && temp_ambits[indexFound + 3].temp_status_id !== 3) {
                            this.changeToValidAmbit((indexFound + 3), temp_ambits);
                        } else {
                            this.is_last_ambit = true;

                            this.navCtrl.pop();
                        }
                    }
                } else {
                    this.getPreguntas(this.navParams.data.checklist_id, this.ambito);
                    this.content.scrollToTop();
                }
                this.nombreAmbito = this.updateAmbito(this.ambito);
                this.applicationRef.tick();
            } else {
                this.changeToValidAmbit((indexFound + 1), temp_ambits);
            }
        } else {
            this.is_last_ambit = true;
            this.navCtrl.pop();
        }

        if (global.showQuestionsAsSlides && this.navParams.data.visita && this.swiperElement && this.swiperElement.directiveRef) {
            this.swiperElement.directiveRef.setIndex(0);
            setTimeout(() => {
                this.swiperElement.directiveRef.update();
                this.content.resize();
            }, 300)
        }
    }

    // Retorna los ámbitos con su estado original
    setAmbitStatus(ambits: any) {
        let temp_ambits: any = [];
        // Si proviene desde visitas
        if (!_.isUndefined(this.navParams.data.visita) && !_.isNull(this.navParams.data.visita)) {
            _.forEach(ambits, (ambit) => {
                let answers = _.filter(this.visita_tienda['respuestas'], {
                    ambito_id: ambit.id,
                    visita_id: this.visita_id
                });

                let ambit_metrics = {
                    answered_questions: 0,
                    pending_comments: false,
                    pending_photos: false,
                    checkbox_answers: [],
                    total: ambit.total
                };

                _.forEach(ambit.preguntas, (pregunta) => {
                    if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                        if (pregunta.hasApply == false) {
                            ambit_metrics.answered_questions++;
                        }
                    }
                });

                _.forEach(answers, (answer) => {
                    // Buscamos la pregunta asociada a esta respuesta
                    let question = _.find(ambit.preguntas, { id: answer.pregunta_id });
                    if (question) {
                        // Luego la alternativa seleccionada para esta respuesta
                        let alternative = _.find(question.alternativas, { id: answer.respuesta_alternativa_id })
                        // Si encontramos la alternativa, al asignamos a la respuesta
                        if (alternative) {
                            answer.alternative_selected = alternative;
                        }
                    }
                    // Respuesta asociada a pregunta del tipo radio
                    if (answer.tipo_id == 1) {
                        // Con respuesta
                        if (answer.pregunta_alternativa_id === 0 || answer.pregunta_alternativa_id === null) {
                            if (answer.alternative_selected && answer.alternative_selected.tipo_id === 3 && answer.texto_adicional == "") {
                                ambit_metrics.answered_questions--;
                                ambit_metrics.pending_comments = true;
                                if (question) {
                                    var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                    if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                        var index = _.indexOf(this.preguntas, foundQuestion);
                                        if (!_.isUndefined(index) && !_.isNull(index)) {
                                            this.preguntas[index]['incomplete'] = true;
                                        }
                                    }
                                }
                            } else {
                                ambit_metrics.answered_questions++;
                            }
                        }

                        // No comentada
                        if (answer.comentario && answer.comentario == 1 && !answer.comentarios) {
                            ambit_metrics.pending_comments = true;
                            if (question) {
                                var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                    var index = _.indexOf(this.preguntas, foundQuestion);
                                    if (!_.isUndefined(index) && !_.isNull(index)) {
                                        this.preguntas[index]['incomplete'] = true;
                                    }
                                }
                            }
                        }

                        // Solamente los radio buttons tienen acción con foto
                        // Si no han agregado la foto, se considera incompleta
                        // Aunque primero debemos considerar si viene dentro de un arreglo
                        if (
                            answer.alternative_selected
                            && answer.alternative_selected.tipo_id === 4
                            && (
                                (_.isArray(answer.foto) ? (!answer.foto.length || !answer.foto[0].foto) : (!answer.foto || !answer.foto.foto))
                            )
                        ) {
                            ambit_metrics.pending_photos = true;
                            if (question) {
                                var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                    var index = _.indexOf(this.preguntas, foundQuestion);
                                    if (!_.isUndefined(index) && !_.isNull(index)) {
                                        this.preguntas[index]['incomplete'] = true;
                                    }
                                }
                            }
                        }
                        // Respuesta asociada a pregunta del tipo checkbox
                    } else if (answer.tipo_id == 2) {
                        if (answer.pregunta_id && !_.includes(ambit_metrics.checkbox_answers, answer.pregunta_id)) {
                            ambit_metrics.checkbox_answers.push(answer.pregunta_id);
                        }
                        if (answer.comentario && answer.comentario == 1 && !answer.comentarios) {
                            ambit_metrics.pending_comments = true;
                            if (question) {
                                var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                    var index = _.indexOf(this.preguntas, foundQuestion);
                                    if (!_.isUndefined(index) && !_.isNull(index)) {
                                        this.preguntas[index]['incomplete'] = true;
                                    }
                                }
                            }
                        }
                        // Respuesta asociada a pregunta del tipo texto
                    } else if (answer.tipo_id == 3) {
                        let temp = JSON.parse(JSON.stringify(answer));
                        if (temp.texto_respuesta && temp.texto_respuesta !== "") {
                            ambit_metrics.answered_questions++;
                        } else {
                            if (question) {
                                var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                    var index = _.indexOf(this.preguntas, foundQuestion);
                                    if (!_.isUndefined(index) && !_.isNull(index)) {
                                        this.preguntas[index]['incomplete'] = true;

                                        //if(_.isUndefined(question.hasApply) || _.isNull(question.hasApply) || question.hasApply == true) this.preguntas[index]['incomplete'] = true;
                                    }
                                }
                            }
                        }
                        // Respuesta asociada a pregunta del tipo foto
                    } else if (answer.tipo_id == 4) {
                        if (_.isUndefined(answer.foto) || _.isNull(answer.foto) || answer.foto.length <= 0) {
                            ambit_metrics.answered_questions++;
                            if (question) {
                                var foundQuestion = _.find(this.preguntas, { 'id': question.id });
                                if (!_.isUndefined(foundQuestion) && !_.isNull(foundQuestion)) {
                                    var index = _.indexOf(this.preguntas, foundQuestion);
                                    if (!_.isUndefined(index) && !_.isNull(index)) {
                                        this.preguntas[index]['incomplete'] = true;
                                    }
                                }
                            }
                        }
                    }
                });

                let total_answers = (ambit_metrics.answered_questions + ambit_metrics.checkbox_answers.length);
                if (total_answers < 0) total_answers = 0;

                if (total_answers === 0) {
                    ambit.temp_status_id = 1;
                } else if (total_answers > 0 && total_answers < ambit_metrics.total) {
                    ambit.temp_status_id = 2;
                } else if (total_answers >= ambit_metrics.total) {
                    if (ambit_metrics.pending_comments || ambit_metrics.pending_photos) {
                        ambit.temp_status_id = 2;
                    } else {
                        ambit.temp_status_id = 3;
                    }
                }
                temp_ambits.push(ambit);
            });
            return temp_ambits;
        } else {
            let firstTime = false;

            let ambInArray = _.find(ambits, { 'id': this.ambito });

            //let ambInArray = _.indexOf(ambits, {id: (this.ambito * 1)});
            if (!_.isNull(ambInArray) && !_.isUndefined(ambInArray)) {
                _.forEach(ambits, (ambit) => {
                    if ((ambit.contestadas < ambit.total) && ambit.pendientes > 0) {
                        if ((ambInArray.id != ambit.id) && (ambInArray.orden < ambit.orden)) {
                            if (firstTime == false) {
                                this.ambito = ambit.id;
                                firstTime = true;
                            }
                            temp_ambits.push(ambit);
                        }
                    }
                });
            }

            return temp_ambits;
        }
    }

    /**
     * Valida que exista un siguiente ámbito para mostrar en boton
     * @returns {string}
     */
    hasNext() {
        var foundAmbito = _.find(this.ambitos, { id: this.ambito });
        var indexFound = _.indexOf(this.ambitos, foundAmbito);
        if (!_.isUndefined(this.ambitos[indexFound + 1]) && !_.isNull(this.ambitos[indexFound + 1])) {
            return "Siguiente ámbito"
        } else {
            return "Volver"
        }
    }

    /**
     * Busca y actualiza el ámbito seleccionado en el arreglo de ámbitos
     * @param ambito_id
     * @returns {any}
     */
    updateAmbito(ambito_id) {
        var nombreAmbito = null;
        var foundAmbito = _.find(this.ambitos, { id: ambito_id });

        if (!_.isUndefined(foundAmbito)) {
            nombreAmbito = foundAmbito.nombre;
        }
        return nombreAmbito;
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

        if (foundAnswer) {
            pregunta.adminComentario = foundAnswer.admin_comentario;
        }


        let respuestaFind = _.find(respuestasPorUnir, { pregunta_id: pregunta.id, alternativa_id: null });
        if (!_.isUndefined(respuestaFind)) {
            if (!this.fromStats) {
                pregunta.respuesta = respuestaFind.respuesta;
            } else {
                pregunta.respuesta = { data: null };
            }
            //_.remove(respuestasPorUnir, {id: respuestaFind.id});
        }
        else {
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
                    if (!this.fromStats) {
                        pregunta.respuesta.data = pregunta.respuesta.data.toLocaleString();
                    } else {
                        pregunta.respuesta.data = {};
                    }
                }
            }
        }
        if (pregunta.codigo_tipo == "porcentual") {
            if (!_.isNull(pregunta.respuesta)) {
                if (!_.isNull(pregunta.respuesta.data)) {
                    if (!this.fromStats) {
                        if (pregunta.respuesta.data == 0) pregunta.hasChanges = false;
                        else pregunta.hasChanges = true;
                    } else {
                        pregunta.respuesta.data = {};
                    }
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

                    if (!this.fromStats) {
                        alternativa.respuesta = respuestaFind2.respuesta;
                    } else {
                        alternativa.respuesta = {};
                    }
                    _.remove(respuestasPorUnir, { id: respuestaFind2.id });
                }
                if (alternativa.subPregunta) {
                    this.joinQuestion(alternativa.subPregunta, respuestasPorUnir);
                }
                var resp = JSON.parse(JSON.stringify(alternativa.respuesta))
                if (pregunta.tipo_id == 2 && (!_.isUndefined(resp) && !_.isNull(resp))) {
                    if (
                        (!_.isUndefined(alternativa.respuesta.data) && !_.isNull(alternativa.respuesta.data) && !_.isUndefined(alternativa.respuesta.alternativa_id) && !_.isNull(alternativa.respuesta.alternativa_id))
                        || (alternativa.respuesta && alternativa.respuesta.foto && alternativa.respuesta.foto.length && alternativa.respuesta.alternativa_id)
                    ) {
                        if (!this.fromStats) {
                            alternativa.respuesta.checked = true;
                        } else {
                            alternativa.respuesta.checked = false;
                        }
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

    /**
     * Limpia respuestas de radio para que solo sea valida la última seleccionada
     * @param alternativas
     * @param alternativa
     * @param from
     * @param subPregunta
     */
    limpiarAlternativasRadio(alternativas, alternativa, from, subPregunta) {
        if (from == "checklist") {
            subPregunta = subPregunta || null;
            if (!_.isUndefined(alternativas) && !_.isNull(alternativas)) {
                for (let alternativaValor of alternativas) {
                    if (alternativaValor.id != alternativa.respuesta.alternativa_id) {
                        alternativaValor.respuesta = {
                            alternativa_id: null,
                            checked: false
                        };
                        if (!_.isUndefined(alternativaValor.subPregunta) && !_.isNull(alternativaValor.subPregunta)) {
                            this.limpiarAlternativasRadio(alternativaValor.subPregunta.alternativas, alternativa, from, null);
                        }
                    }
                    if (!_.isUndefined(alternativaValor.respuesta) && !_.isUndefined(alternativaValor.subPregunta) && !_.isNull(alternativaValor.respuesta) && !_.isNull(alternativaValor.subPregunta)) {
                        this.limpiarAlternativasRadio(alternativaValor.subPregunta.alternativas, alternativa, from, alternativaValor.subPregunta);
                    }
                }
            } else {
                if (!_.isUndefined(subPregunta) && !_.isNull(subPregunta)) {
                    subPregunta.respuesta = {
                        alternativa_id: null,
                        checked: false
                    };
                    if (!_.isUndefined(subPregunta.subPregunta) && !_.isNull(subPregunta.subPregunta)) {
                        this.limpiarAlternativasRadio(subPregunta.alternativas, alternativa, from, subPregunta.subPregunta);
                    }
                }
            }
        } else if (from == "visita") {
            _.forEach(alternativas, function (alt) {
                if (alt.id == alternativa.id) {
                    alt.checked = true;
                } else {
                    alt.checked = false;
                }
            });
        }

    };

    /**
     * Limpia alternativas de checkbox cuando una nueva es seleccionada
     * @param alternativas
     * @param alternativa
     * @param subNivel
     */
    limpiarAlternativasCheckbox(alternativas, alternativa, subNivel) {
        subNivel = subNivel || false;
        if (!_.isUndefined(alternativas) && !_.isNull(alternativas)) {
            for (let alternativaValor of alternativas) {
                if ((!alternativa.respuesta || !alternativa.respuesta.checked) && alternativa.id == alternativaValor.id) {
                    alternativaValor.respuesta = {
                        checked: false
                    };
                    if (!_.isUndefined(alternativaValor.subPregunta) && !_.isNull(alternativaValor.subPregunta)) {
                        this.limpiarAlternativasCheckbox(alternativaValor.subPregunta.alternativas, alternativa, true);
                    }
                } else if (subNivel) {
                    // En caso de entrar en esta condición, limpiará de forma recursiva todas las alternativas y subpreguntas que estén dentro de esta alternativa.
                    this.limpiarAlternativasOSubpreguntas(alternativaValor);
                }
            }
        } else {
            if (!_.isUndefined(alternativa) && !_.isNull(alternativa)) {
                if (!_.isUndefined(alternativa.subPregunta) && !_.isNull(alternativa.subPregunta)) {
                    alternativa.subPregunta.respuesta = {
                        checked: false
                    };
                    if (!_.isUndefined(alternativa.subPregunta.alternativas) && !_.isNull(alternativa.subPregunta.alternativas)) {
                        this.limpiarAlternativasCheckbox(alternativa.subPregunta.alternativas, alternativa, true);
                    }
                }
            }
        }
    };

    /**
     * Limpia de forma recursiva todas las alternativas y subpreguntas que estén dentro de esta alternativa.
     * @param data
     */
    limpiarAlternativasOSubpreguntas(data) {
        data.respuesta = null;
        if (data.subPregunta) {
            this.limpiarAlternativasOSubpreguntas(data.subPregunta);
        }
        if (data.alternativas && data.alternativas.length) {
            for (let alternativaValor of data.alternativas) {
                alternativaValor.respuesta = null;
                if (alternativaValor.subPregunta) {
                    this.limpiarAlternativasOSubpreguntas(alternativaValor.subPregunta);
                }
            }
        }
    }

    /**
     * Recibe foto obligatoria tomada para envio.
     * @param $pregunta -> pregunta del reporte a la que se le tomará la foto.
     * @return void
     **/
    tomarFotoObligatoria(image, pregunta) {
        if (!_.isNull(pregunta.respuesta)) {
            pregunta.respuesta.obligatorio = {
                foto: image
            }
        } else {
            pregunta.respuesta = {
                obligatorio: {
                    foto: image
                }
            }
        }
    };

    /**
     * Recibe foto tomada para envio.
     * @param $pregunta -> pregunta del reporte a la que se le tomará la foto.
     * @return void
     **/
    tomarFoto(image, pregunta) {
        if (!_.isNull(pregunta.respuesta)) {
            pregunta.respuesta.data = image;
        } else {
            pregunta.respuesta = {
                data: image
            }
        }
    };

    tomarFotoMultiple(image, pregunta) {
        if (pregunta.respuesta) {
            if (pregunta.respuesta.foto) {
                pregunta.respuesta.foto.push({
                    foto: image
                });
                return true;
            } else {
                pregunta.respuesta.foto = [];
                pregunta.respuesta.foto.push({
                    foto: image
                });
                return true;
            }
        } else {
            pregunta.respuesta = {};
            pregunta.respuesta.foto = [];
            pregunta.respuesta.foto.push({
                foto: image
            });
            return true;
        }
    }

    /**
     * Asigna nueva imagen a respuesta respectiva
     * @param image
     * @param pregunta
     */
    async saveVisitPhoto(image, pregunta) {
        if (!_.isNull(pregunta.respuesta)) {
            if (!_.isNull(pregunta.respuesta.foto)) {
                pregunta.respuesta.foto.push({
                    foto: image
                });
                return true;
            } else {
                pregunta.respuesta.foto = [];
                pregunta.respuesta.foto.push({
                    foto: image
                });
                return true;
            }
        } else {
            pregunta.respuesta = {};
            pregunta.respuesta.foto = [];
            pregunta.respuesta.foto.push({
                foto: image
            });
            return true;
        }
    };

    /**
     * En el caso de visitas, ordena formulario contestado con formato correcto para poder ser enviado a API.
     * En el caso de checklist, ordena formulario contestado y posteriormente es enviado a API.
     * @param preguntas
     * @returns {Promise<{}>}
     */

    reevaluarPreguntas() {

        this.ambitSaved = true;
        this.respuestas = [];
        if (!_.isUndefined(this.visita_id) && !_.isNull(this.visita_id)) {
            this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {
                this.visita_tienda = JSON.parse(val);

                let tempVisit = JSON.parse(JSON.stringify(this.visita_tienda));
                this.crearEstructuraRespuestas(this.preguntas).then(resps => {
                    let respuestas = resps;

                    let tempResp = JSON.parse(JSON.stringify(tempVisit['respuestas']));

                    let visitId = this.visita_id;
                    let toAdd = [];
                    let otherAnswers = _.filter(JSON.parse(JSON.stringify(tempVisit['respuestas'])), function (r) {
                        return (r && r.visita_id != visitId);
                    });

                    this.addAnswers(respuestas, toAdd).then(items => {
                        toAdd = items;


                        this.updateVisits(respuestas, toAdd, tempResp).then(items => {
                            tempResp = items;

                            tempVisit['respuestas'] = [];

                            let index = -1;

                            _.forEach(tempResp, (resp) => {
                                index = _.findIndex(tempVisit['respuestas'], resp)
                                if (index == -1) tempVisit['respuestas'].push(resp)
                            });

                            _.forEach(toAdd, (resp) => {
                                index = _.findIndex(tempVisit['respuestas'], resp)
                                if (index == -1) tempVisit['respuestas'].push(resp)
                            });

                            _.forEach(otherAnswers, (resp) => {
                                index = _.findIndex(tempVisit['respuestas'], resp)
                                if (index == -1) tempVisit['respuestas'].push(resp)
                            });

                            _.remove(tempVisit['respuestas'], (answer) => {
                                /*if (answer.tipo_id === 2) {
                                }*/
                                return answer.tipo_id === 2 && (!answer.checked && !answer.id);
                            });


                            this.answersByChecklist(JSON.parse(JSON.stringify(tempVisit)), this.preguntas).then(visit => {
                                let checklists = visit.checklist_visita;

                                //this.visita_tienda['checklist_visita'] = _.merge(this.visita_tienda['checklist_visita'], checklists);
                                this.visita_tienda['checklist_visita'] = checklists;
                                this.visita_tienda['respuestas'] = visit.respuestas;
                                let visita = _.find(this.visita_tienda['visitas'], { 'id': this.visita_id });
                                if (!_.isUndefined(visita) && !_.isNull(visita)) {
                                    let checkVisit = _.find(this.visita_tienda['checklist_visita'], { 'visita_id': visita.id });
                                    if (!_.isUndefined(checkVisit) && !_.isNull(checkVisit)) {
                                        visita.estado_id = checkVisit.estado_id;
                                        visita.nombre_estado = checkVisit.nombre_estado;
                                        let check = _.find(this.visita_tienda['checklists'], { 'visita_id': visita.id });
                                        if (!_.isUndefined(check) && !_.isNull(check)) {
                                            check.estado_id = checkVisit.estado_id;
                                            check.nombre_estado = checkVisit.nombre_estado;
                                        }
                                    }
                                }

                                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda))
                                    .then((rr) => {
                                        this.restantes = this.validateAnswers();
                                        this.applicationRef.tick();
                                    }).catch(error => { });

                            }).catch(error => { });
                        }).catch(error => { });
                    }).catch(error => { });
                }).catch(error => { });
            })
                .catch(error => { });
        }
    }



    async guardarPreguntas(preguntas, is_back) {

        this.ambitSaved = true;

        this.respuestas = [];

        if (!_.isUndefined(this.visita_id) && !_.isNull(this.visita_id)) {

            var isvalid = await this.checkTotal(preguntas);
            if (isvalid && this.validSend == true) {
                this.validSend = false;
                this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then(async (val) => {

                    this.visita_tienda = JSON.parse(val);

                    let tempVisit = JSON.parse(JSON.stringify(this.visita_tienda));
                    this.crearEstructuraRespuestas(preguntas).then(resps => {

                        var respuestas = resps;

                        var tempResp = JSON.parse(JSON.stringify(tempVisit['respuestas']));

                        var visitId = this.visita_id;
                        var toAdd = [];
                        var otherAnswers = _.filter(JSON.parse(JSON.stringify(tempVisit['respuestas'])), function (r) {
                            return (r && r.visita_id != visitId);
                        });

                        this.addAnswers(respuestas, toAdd).then(items1 => {

                            toAdd = items1;


                            this.updateVisits(respuestas, toAdd, tempResp).then(items => {
                                tempResp = items;

                                tempVisit['respuestas'] = [];

                                var index = -1;

                                _.forEach(tempResp, (resp) => {
                                    index = _.findIndex(tempVisit['respuestas'], resp)
                                    if (index == -1) tempVisit['respuestas'].push(resp)
                                });

                                _.forEach(toAdd, (resp) => {
                                    index = _.findIndex(tempVisit['respuestas'], resp)
                                    if (index == -1) tempVisit['respuestas'].push(resp)
                                });

                                _.forEach(otherAnswers, (resp) => {
                                    index = _.findIndex(tempVisit['respuestas'], resp)
                                    if (index == -1) tempVisit['respuestas'].push(resp)
                                });

                                _.remove(tempVisit['respuestas'], (answer) => {
                                    /*if (answer.tipo_id === 2) {
                                    }*/
                                    return answer.tipo_id === 2 && (!answer.checked && !answer.id);
                                });


                                this.answersByChecklist(JSON.parse(JSON.stringify(tempVisit)), preguntas).then(visit => {

                                    let checklists = visit.checklist_visita;

                                    //this.visita_tienda['checklist_visita'] = _.merge(this.visita_tienda['checklist_visita'], checklists);
                                    this.visita_tienda['checklist_visita'] = checklists;
                                    this.visita_tienda['respuestas'] = visit.respuestas;
                                    var visita = _.find(this.visita_tienda['visitas'], { 'id': this.visita_id });
                                    if (!_.isUndefined(visita) && !_.isNull(visita)) {
                                        var checkVisit = _.find(this.visita_tienda['checklist_visita'], { 'visita_id': visita.id });
                                        if (!_.isUndefined(checkVisit) && !_.isNull(checkVisit)) {
                                            visita.estado_id = checkVisit.estado_id;
                                            visita.nombre_estado = checkVisit.nombre_estado;
                                            var check = _.find(this.visita_tienda['checklists'], { 'visita_id': visita.id });
                                            if (!_.isUndefined(check) && !_.isNull(check)) {
                                                check.estado_id = checkVisit.estado_id;
                                                check.nombre_estado = checkVisit.nombre_estado;
                                            }
                                        }
                                    }

                                    this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda))
                                        .then(() => {
                                            this.validSend = true;
                                            if (!is_back) {
                                                this.changeAmbito(null);
                                            }
                                        })
                                        .catch((error) => {
                                            this.validSend = true;
                                            this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH06.');
                                            this.util.logError(JSON.stringify(error), 'DTCH06', globalConfig.version);
                                        });
                                })
                                    .catch((error) => {
                                        this.validSend = true;
                                        this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH05.');
                                        this.util.logError(JSON.stringify(error), 'DTCH05', globalConfig.version);
                                    });
                            })
                                .catch((error) => {
                                    this.validSend = true;
                                    this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH04.');
                                    this.util.logError(JSON.stringify(error), 'DTCH04', globalConfig.version)
                                });;
                        })
                            .catch((error) => {
                                this.validSend = true;
                                this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH03.');
                                this.util.logError(JSON.stringify(error), 'DTCH03', globalConfig.version)
                            });;
                    })
                        .catch((error) => {
                            this.validSend = true;
                            this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH02.');
                            this.util.logError(JSON.stringify(error), 'DTCH02', globalConfig.version)
                        });
                })
                    .catch((error) => {
                        this.validSend = true;
                        this.util.showAlert('Error', 'No ha sido posible guardar el checklist, contacte a soporte con el código DTCH01.');
                        this.util.logError(JSON.stringify(error), 'DTCH01', globalConfig.version);
                    });
            }
        } else {
            if (this.validSend == true) {
                //this.validSend = false;

                const loading = this.loading.create({ content: 'Guardando' });
                loading.present();
                let toSend = {};
                let toSendArray = [];
                let emptyAnswers = false;


                for (let pregunta of preguntas) {
                    this.buildAnswer(pregunta);

                    toSend = {
                        respuestas: this.respuestas,
                        checklist_id: this.navParams.data.checklist_id,
                        ambito_id: this.ambito
                    };
                    toSendArray.push(toSend);
                    //const loading = this.loading.create({content: 'Guardando'});
                    //loading.present();

                    //let data = {};
                    let orderResps = await this.reOrderResps(this.respuestas);

                    //Se evalua que cada pregunta haya sido respondida, de lo contrario se envia un aviso
                    if (orderResps.length > 0) {
                        let thisResps = _.filter(orderResps, { pregunta_id: pregunta.id })

                        if (thisResps.length > 0) {
                            _.forEach(thisResps, function (resp) {

                                //Tipo radio
                                if (resp.pregunta_tipo_id == 1) {
                                    if (_.isNull(resp.respuesta.alternativa_id) || _.isUndefined(resp.respuesta.alternativa_id)) {
                                        emptyAnswers = true;
                                    }

                                    if (pregunta.obligatorio && pregunta.obligatorio.foto == true) {
                                        if (resp.respuesta && resp.respuesta.obligatorio && resp.respuesta.obligatorio.foto && resp.respuesta.obligatorio.foto != true) { }
                                        else {
                                            emptyAnswers = true;
                                        }
                                    }
                                }
                                //Tipo checkbox
                                if (resp.pregunta_tipo_id == 2) {
                                    if (_.isNull(resp.respuesta.checked) || _.isUndefined(resp.respuesta.checked) || resp.respuesta.checked == false) {
                                        emptyAnswers = true;
                                    }
                                    if (pregunta.obligatorio && pregunta.obligatorio.foto == true) {
                                        if (resp.respuesta && resp.respuesta.obligatorio && resp.respuesta.obligatorio.foto && resp.respuesta.obligatorio.foto != true) { }
                                        else {
                                            emptyAnswers = true;
                                        }
                                    }
                                }
                                //Tipo texto
                                if (resp.pregunta_tipo_id == 3) {
                                    if (_.isNull(resp.respuesta.data) || _.isUndefined(resp.respuesta.data)) {
                                        emptyAnswers = true;
                                    }
                                    if (pregunta.obligatorio && pregunta.obligatorio.foto == true) {
                                        if ((resp.respuesta || resp.respuesta == 0) && resp.respuesta.obligatorio && resp.respuesta.obligatorio.foto && resp.respuesta.obligatorio.foto != true) { }
                                        else emptyAnswers = true;
                                    }
                                }
                                //Tipo foto
                                if (resp.pregunta_tipo_id == 4) {
                                    if (
                                        (pregunta.multi_foto === 0 && (_.isNull(resp.respuesta.data) || _.isUndefined(resp.respuesta.data)))
                                        || (pregunta.multi_foto === 1 && (!resp.respuesta.foto || !resp.respuesta.foto.length))
                                    ) {
                                        emptyAnswers = true;
                                    }
                                    if (pregunta.obligatorio && pregunta.obligatorio.foto == true) {
                                        if (resp.respuesta && resp.respuesta.obligatorio && resp.respuesta.obligatorio.foto && resp.respuesta.obligatorio.foto != true) { }
                                        else {
                                            emptyAnswers = true;
                                        }
                                    }
                                }
                            });
                        } else {
                            emptyAnswers = true;
                        }
                    } else {
                        emptyAnswers = true;
                    }
                }
                if (emptyAnswers == true) {
                    let alert = this.alert.create({
                        title: 'Atención',
                        subTitle: 'Tiene preguntas sin responder, puedes enviar el contenido y continuar mas tarde. ¿Desea guardar el formulario?',
                        buttons: [{
                            text: 'Aceptar',
                            handler: async data => {
                                await this.sendAnswersToService(toSend, is_back);
                                try { this.firebaseAnalyticsProvider.trackButtonEvent("GuardarAmbito"); } catch (e) { }
                                loading.dismiss();
                            }
                        }, {
                            text: 'Cancelar',
                            handler: data => {
                                loading.dismiss();
                            }
                        }],
                    });
                    alert.present();
                } else {
                    await this.sendAnswersToService(toSend, is_back);
                    loading.dismiss();
                }
            }
        }
    }

    /**
     * Envio de respuestas hacia API
     */
    async sendAnswersToService(toSend, is_back) {

        console.log('toSend', toSend)

        await this.request
            .post(config.endpoints.post.respuestas, toSend, true)

            .then((response: any) => {

                try {
                    if (response.code == 200) {
                        if (!is_back) this.changeAmbito(null);
                    } else if (!_.isUndefined(response.message)) {
                        let alert = this.alert.create({
                            title: 'Atención',
                            subTitle: '' + response.message,
                            buttons: [{
                                text: 'Aceptar',
                                handler: data => {

                                }
                            }],
                        });
                        alert.present();
                    } else {
                        let alert = this.alert.create({
                            title: 'Atención',
                            subTitle: 'El formulario no pudo ser enviado, intente nuevamente',
                            buttons: [{
                                text: 'Aceptar',
                                handler: data => {
                                    //this.navCtrl.pop();
                                }
                            }],
                        });
                        alert.present();
                    }
                    this.validSend = true;
                }
                catch (e) {
                    this.validSend = true;
                }
            })
            .catch((error: any) => {

                console.log('error', error)


                this.validSend = true;
                if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
            });
    }

    /**
     * Agrupa casos en que existe mas de una respuesta para una pregunta en una sola para realizar validaciones
     */
    async reOrderResps(respuestas) {
        let tempResps = [];
        _.forEach(respuestas, function (res) {

            let foundRes = _.find(tempResps, { 'pregunta_id': res.pregunta_id });
            if (!_.isNull(foundRes) && !_.isUndefined(foundRes)) {
                let index = _.indexOf(tempResps, foundRes);
                if (index != -1) {
                    if (!_.isNull(res.respuesta.alternativa_id) && !_.isUndefined(res.respuesta.alternativa_id)) {
                        tempResps[index].respuesta.alternativa_id = res.respuesta.alternativa_id;
                        tempResps[index].respuesta.checked = true;
                    }

                    if (!_.isNull(res.respuesta.checked) && !_.isUndefined(res.respuesta.checked)) tempResps[index].respuesta.checked = true;

                    if (!_.isNull(res.respuesta.obligatorio) && !_.isUndefined(res.respuesta.obligatorio)) tempResps[index].respuesta.obligatorio = res.respuesta.obligatorio;
                }
            } else {
                tempResps.push(res)
            }
        });
        if (tempResps.length > 0) return tempResps;
        else return [];
    }

    /**
     * En caso de ser preguntas numericas se debe calcular que los resultados coincidan con los valores ingresados
     * y cumpla con las reglas de envío
     * @param preguntas
     * @returns {Promise<boolean>}
     */
    async checkTotal(preguntas) {

        var participacionTotalExiste = _.find(preguntas, { participacion: 3 });
        var preguntasDeParticipacion = _.filter(preguntas, function (o) {
            return o.participacion;
        });
        var sum = 0;
        var total = 0;
        var negativo: boolean = false;

        if (!_.isUndefined(participacionTotalExiste) && !_.isNull(participacionTotalExiste)) {
            _.forEach(preguntasDeParticipacion, function (preg) {
                if (preg.id != participacionTotalExiste.id) {
                    sum += preg.respuesta
                } else {
                    total = preg.respuesta;
                }
                if (preg.respuesta < 0) {
                    negativo = true;
                }
            });
        }
        // De existir un número negativo, mostrará un mensaje de aviso
        if (negativo) {
            this.util.showAlert('Atención', 'No puede ingresar una participación negativa');
            return false;
        }

        // De no existir preguntas de participación 3, puede seguir al siguiente ambito.
        if ((_.isUndefined(participacionTotalExiste) || _.isNull(participacionTotalExiste)) || (total >= sum)) {
            return true;
        } else {
            if (!total && total !== 0) return true;
            this.util.showAlert('Atención', 'El total debe ser mayor o igual a la suma de los valores ingresados. <br><b>Sumatoria:</b> ' + sum + ', <br><b>Total</b>: ' + total + '.');
            return false;
        }
    }

    /**
     * Agrega respuestas en arreglo
     * @param respuestas
     * @param toAdd
     * @returns {Promise<any>}
     */
    async addAnswers(respuestas, toAdd) {
        _.forEach(respuestas, (resp) => {
            toAdd.push(resp);
        });
        return toAdd;
    }

    /**
     * Elimina respuestas repetidas en visitas
     * @param respuestas
     * @param toAdd
     * @param tempResp
     * @returns {Promise<any>}
     */
    async updateVisits(respuestas, toAdd, tempResp) {
        _.forEach(toAdd, (resp) => {
            var repetidas = _.filter(tempResp, { pregunta_id: resp.pregunta_id });

            if (repetidas.length > 0) {
                tempResp = _.remove(tempResp, function (r) {
                    return r.pregunta_id != resp.pregunta_id;
                });
            }

        });
        return tempResp;
    }

    /**
     * Calcula respuestas contestadas y cambia estado según la cantidad
     * @param visita
     * @returns {Promise<any | Array>}
     */
    async answersByChecklist(visita, preguntas) {

        let tempVisit = JSON.parse(JSON.stringify(visita));

        let context = this;

        let checklists = tempVisit.checklist_visita;

        if (_.isUndefined(checklists) || _.isNull(checklists)) {
            checklists = tempVisit.checklists;
        }

        let foundCheck = _.find(checklists, { 'visita_id': this.visita_id })
        if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {

            var contestadas = 0;
            let noComents = false;
            _.forEach(foundCheck.ambitos, function (ambito, key) {
                //Buscamos si existen preguntas con 'no aplica'
                _.forEach(preguntas, function (pregunta) {
                    let foundPreg = _.find(ambito.preguntas, { id: pregunta.id });
                    if (!_.isUndefined(foundPreg) && !_.isNull(foundPreg)) {
                        if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                            foundPreg['hasApply'] = pregunta.hasApply;
                            foundPreg = JSON.parse(JSON.stringify(foundPreg))

                            if (pregunta.hasApply == false) {
                                count++;
                                let foundResp = _.find(context.visita_tienda['respuestas'], {
                                    ambito_id: ambito.id,
                                    visita_id: (context ? context.visita_id : null),
                                    pregunta_id: pregunta.id
                                });
                                if (!_.isUndefined(foundResp) && !_.isNull(foundResp)) {
                                    foundResp.hasApply = false;
                                    let index = _.indexOf(context.visita_tienda['respuestas'], foundResp);
                                    if (index != -1) {
                                        context.visita_tienda['respuestas'].splice(index, 1);
                                    }
                                } else {
                                    let foundResp = _.find(context.visita_tienda['respuestas'], {
                                        ambito_id: ambito.id + '',
                                        visita_id: (context ? context.visita_id : null) + '',
                                        pregunta_id: pregunta.id + ''
                                    });

                                    if (!_.isUndefined(foundResp) && !_.isNull(foundResp)) {
                                        foundResp.hasApply = false;
                                        let index = _.indexOf(context.visita_tienda['respuestas'], foundResp);
                                        if (index != -1) {
                                            context.visita_tienda['respuestas'].splice(index, 1);
                                        }
                                    }
                                }
                            }
                        } else if (_.isUndefined(pregunta.hasApply)) {
                            let foundPreg = _.find(ambito.preguntas, { id: pregunta.id });
                            if (!_.isUndefined(foundPreg) && !_.isNull(foundPreg)) {
                                foundPreg['hasApply'] = pregunta.hasApply;
                                foundPreg = JSON.parse(JSON.stringify(foundPreg));
                                let foundResp = _.find(context.visita_tienda['respuestas'], {
                                    ambito_id: ambito.id,
                                    visita_id: (context ? context.visita_id : null),
                                    pregunta_id: pregunta.id
                                });
                                if (!_.isUndefined(foundResp) && !_.isNull(foundResp)) {
                                    let index = _.indexOf(context.visita_tienda['respuestas'], foundResp);
                                    if (index != -1) {
                                        context.visita_tienda['respuestas'].splice(index, 1);
                                    }
                                }

                            }
                        }
                    }
                });

                var respuestas = _.filter(tempVisit['respuestas'], {
                    ambito_id: ambito.id,
                    visita_id: (context ? context.visita_id : null)
                });

                var count = 0;
                var preguntaExiste = [];
                _.forEach(respuestas, function (respuesta) {
                    if (respuesta.tipo_id == "1" || respuesta.tipo_id == 1) { // Radio
                        if (respuesta.pregunta_alternativa_id == 0 || respuesta.pregunta_alternativa_id == null) {
                            count++;
                        }
                        if (respuesta.comentario && respuesta.comentario !== 0 && (_.isNull(respuesta.comentarios) || _.isUndefined(respuesta.comentarios)) || respuesta.comentarios == "") {
                            noComents = true;
                        }
                    } else if (respuesta.tipo_id == "2" || respuesta.tipo_id == 2) { // Checkbox
                        if (preguntaExiste.indexOf(respuesta.pregunta_id) == -1 && respuesta.checked) {
                            preguntaExiste.push(respuesta.pregunta_id);
                        }
                        if (respuesta.comentario && respuesta.comentario !== 0 && (_.isNull(respuesta.comentarios) || _.isUndefined(respuesta.comentarios)) || respuesta.comentarios == "") {
                            noComents = true;
                        }
                    } else if (respuesta.tipo_id == "3" || respuesta.tipo_id == 3 && (respuesta.texto_respuesta || respuesta.texto_respuesta == 0)) { // Texto
                        count++;
                    } else if (respuesta.tipo_id == "4" || respuesta.tipo_id == 4) { // Foto
                        if (respuesta.foto && respuesta.foto.length > 0) {
                            count++;
                        }
                    }
                });
                contestadas += count + preguntaExiste.length;

                /*if (contestadas == checklist.total) {
                    if(noComents) checklist.estado_id = 2;
                    else checklist.estado_id = 3; // Completo
                } else if (contestadas == 0) {
                    checklist.estado_id = 1; // Sin contestar
                } else {
                    checklist.estado_id = 2; // Incompleto
                }

                var state = _.find(visita.estados_visita, {'estado_id': checklist.estado_id + ""});
                if (!_.isUndefined(state) && !_.isNull(state)) {
                    checklist.nombre_estado = state.nombre;
                } else {
                    state = _.find(visita.estados_visita, {'estado_id': checklist.estado_id * 1});
                    if (!_.isUndefined(state) && !_.isNull(state)) {
                        checklist.nombre_estado = state.nombre;
                    }
                }*/


            });
            if (contestadas == foundCheck.total) {
                if (noComents) foundCheck.estado_id = 2;
                else foundCheck.estado_id = 3; // Completo
            } else if (contestadas == 0) {
                foundCheck.estado_id = 1; // Sin contestar
            } else {
                foundCheck.estado_id = 2; // Incompleto
            }

            var state = _.find(tempVisit.estados_visita, { 'estado_id': foundCheck.estado_id + "" });
            if (!_.isUndefined(state) && !_.isNull(state)) {
                foundCheck.nombre_estado = state.nombre;
            } else {
                state = _.find(tempVisit.estados_visita, { 'estado_id': foundCheck.estado_id * 1 });
                if (!_.isUndefined(state) && !_.isNull(state)) {
                    foundCheck.nombre_estado = state.nombre;
                }
            }
        }
        return tempVisit;
    }

    /**
     * Ordena preguntas y respuestas segun su tipo para formato aceptado por servicio
     * @param preguntas
     * @returns {Promise<any[]>}
     */
    async crearEstructuraRespuestas(preguntas) {
        let context = this;
        var respuestas = [];
        _.forEach(preguntas, function (pregunta, preguntaKey) {
            var respuestaObject = {
                visita_id: (context ? context.visita_id : null),
                ambito_id: context.ambito,
                pregunta_id: pregunta.id,
                pregunta_alternativa_id: 0,
                tipo_id: pregunta.tipo_id,
                nombre_pregunta: pregunta.nombre,
                texto_respuesta: '',
                modified: true,
            };

            if (pregunta.tipo_id == "1" || pregunta.tipo_id == 1) {
                if (pregunta.alternativas || pregunta.alternativas === 0) {
                    var resp = _.find(pregunta.alternativas, { checked: true })
                    if (!_.isUndefined(resp) && !_.isNull(resp)) {
                        respuestaObject['respuesta_alternativa_id'] = resp.id;
                        respuestaObject['nombre_alternativa'] = resp.nombre;
                        respuestaObject['alternativa_peso'] = resp.peso;
                        respuestaObject['texto_adicional'] = resp.texto_adicional ? resp.texto_adicional : '';
                        respuestaObject['comentario'] = resp.comentario ? resp.comentario : 0;
                        respuestaObject['comentarios'] = resp.comentarios != "" ? resp.comentarios : null;

                        if (resp.tipo_id == 4 && resp.foto) {
                            respuestaObject['foto'] = resp.foto;
                        } else if (resp.tipo_id == 3) {
                            respuestaObject['texto_adicional'] = resp.texto_adicional;
                        }
                        respuestas.push(respuestaObject);
                        if (pregunta.subpregunta) {
                            var preguntaAlternativaId = Object.keys(pregunta.subpregunta)[0];
                            //preguntaAlternativaId = preguntaAlternativaId;
                            var respuestaSubPregunta = pregunta.subpregunta[preguntaAlternativaId].respuesta;
                            var subPreguntaId = ((pregunta.alternativas && pregunta.alternativas[preguntaAlternativaId] && pregunta.alternativas[preguntaAlternativaId].subpregunta) ? pregunta.alternativas[preguntaAlternativaId].subpregunta.id : null);
                            if (pregunta.alternativas[preguntaAlternativaId]) {
                                var subpreguntaInfo = pregunta.alternativas[preguntaAlternativaId].subpregunta;
                                var newResp = {
                                    visita_id: (context ? context.visita_id : null),
                                    ambito_id: context.ambito,
                                    pregunta_id: pregunta.id,
                                    pregunta_alternativa_id: preguntaAlternativaId,
                                    sub_pregunta_id: subPreguntaId,
                                    nombre_pregunta: subpreguntaInfo.nombre,
                                    nombre_alternativa: subpreguntaInfo.alternativas[respuestaSubPregunta].nombre,
                                    alternativa_peso: subpreguntaInfo.alternativas[respuestaSubPregunta].peso,
                                    tipo_id: subpreguntaInfo.tipo_id,
                                    respuesta_alternativa_id: respuestaSubPregunta,
                                    modified: true
                                };
                                respuestaSubPregunta = newResp;
                                respuestas.push(respuestaSubPregunta);
                            }
                        }
                    }
                }
            } else if (pregunta.tipo_id == "2" || pregunta.tipo_id == 2) {
                _.forEach(pregunta.alternativas, function (checkbox, checkboxKey) {
                    // if (checkbox.checked) {
                    var alternativa = {
                        visita_id: (context ? context.visita_id : null),
                        checkbox_id: checkbox.id,
                        ambito_id: context.ambito,
                        pregunta_id: pregunta.id,
                        pregunta_alternativa_id: 0,
                        tipo_id: pregunta.tipo_id,
                        nombre_pregunta: pregunta.nombre,
                        respuesta_alternativa_id: pregunta.alternativas[checkboxKey].id,
                        nombre_alternativa: pregunta.alternativas[checkboxKey].nombre,
                        alternativa_peso: pregunta.alternativas[checkboxKey].peso,
                        comentario: pregunta.alternativas[checkboxKey].comentario ? pregunta.alternativas[checkboxKey].comentario : 0,
                        comentarios: pregunta.alternativas[checkboxKey].comentarios != "" ? pregunta.alternativas[checkboxKey].comentarios : null,
                        modified: true,
                        peso: pregunta.alternativas[checkboxKey].peso ? pregunta.alternativas[checkboxKey].peso : null,
                        checked: checkbox.checked
                    };
                    switch (checkbox.tipo_id) {
                        case 3:
                            alternativa['texto_adicional'] = pregunta.alternativas[checkboxKey].texto_adicional;
                            break;

                        case 4:
                            alternativa['foto'] = pregunta.alternativas[checkboxKey].foto;
                            break;
                    }
                    respuestas.push(alternativa);
                    // }
                });
            } else if (pregunta.tipo_id == "3" || pregunta.tipo_id == 3) {
                var alternativaTexto = _.toArray(pregunta.alternativas);
                respuestaObject['nombre_alternativa'] = alternativaTexto[0].nombre;
                respuestaObject['alternativa_peso'] = alternativaTexto[0].peso;
                respuestaObject.texto_respuesta = (pregunta.respuesta || pregunta.respuesta == 0) ? pregunta.respuesta : '';
                respuestaObject['respuesta_alternativa_id'] = 0;

                respuestas.push(respuestaObject);

            } else if (pregunta.tipo_id == "4" || pregunta.tipo_id == 4) {

                if (!_.isUndefined(pregunta.respuesta.foto) && !_.isNull(pregunta.respuesta.foto)) {
                    var alternativaTexto = _.toArray(pregunta.alternativas);
                    respuestaObject['nombre_alternativa'] = alternativaTexto[0].nombre;
                    respuestaObject['alternativa_peso'] = alternativaTexto[0].peso;
                    respuestaObject['respuesta_alternativa_id'] = 0;
                    respuestaObject['foto'] = pregunta.respuesta.foto;
                    respuestas.push(respuestaObject);
                }
                /*else {
                                   respuestaObject['foto'] = [];
                               }*/

            } else if (pregunta.tipo_id == "5" || pregunta.tipo_id == 5) {

            }
        });

        return respuestas;
    }

    /**
     * Limpia y arma respuestas para ser enviada
     * @param pregunta
     */
    buildAnswer(pregunta) {
        //Para checkbox y radio, selecciona solo las respuestas en True
        if ((pregunta.codigo_tipo == "radio") || (pregunta.codigo_tipo == "check")) {
            if (!_.isNull(pregunta.respuesta) && !_.isNull(pregunta.respuesta.obligatorio)) {

                this.jsonFormat(pregunta, null);
            }
            if (!_.isUndefined(pregunta.alternativas) && !_.isNull(pregunta.alternativas)) {
                for (let alternativa of pregunta.alternativas) {
                    if (!_.isUndefined(alternativa.respuesta) && !_.isNull(alternativa.respuesta)) {
                        if (alternativa.respuesta.data) alternativa.respuesta.checked = true;
                        if (alternativa.respuesta.checked) this.jsonFormat(pregunta, alternativa);
                    }
                    if (!_.isUndefined(alternativa.subPregunta) && !_.isNull(alternativa.subPregunta)) this.buildAnswer(alternativa.subPregunta);
                }
            }
            return;
        } else if ((pregunta.codigo_tipo == "text") || (pregunta.codigo_tipo == "porcentual") || (pregunta.codigo_tipo == "num") || (pregunta.codigo_tipo == "fecha")) {
            //Para texto y porcentajes la respuesta se encuentra en el campo pregunta.respuesta.data
            if (!_.isUndefined(pregunta.respuesta) && !_.isNull(pregunta.respuesta)) {
                if (!_.isUndefined(pregunta.respuesta.checked) && !_.isNull(pregunta.respuesta.checked)) {
                    delete pregunta.respuesta.checked;
                }
                if (pregunta.codigo_tipo == "fecha") {
                    if (!_.isNull(pregunta.respuesta.data)) {
                        var respdate = new Date(pregunta.respuesta.data);
                        pregunta.respuesta.data = respdate.getFullYear();
                        if ((respdate.getMonth() + 1) < 10) {
                            pregunta.respuesta.data = pregunta.respuesta.data + "-0" + (respdate.getMonth() + 1);
                        } else {
                            pregunta.respuesta.data = pregunta.respuesta.data + "-" + (respdate.getMonth() + 1);
                        }
                        var dayNumber = respdate.getDate();
                        dayNumber += 1;
                        if (dayNumber < 10) {
                            pregunta.respuesta.data = pregunta.respuesta.data + "-0" + dayNumber;
                        } else {
                            pregunta.respuesta.data = pregunta.respuesta.data + "-" + dayNumber;
                        }
                    }
                }
                if (!_.isUndefined(pregunta.respuesta.data) && (!_.isNull(pregunta.respuesta.data) || (_.isNull(pregunta.respuesta.data) && !_.isNull(pregunta.respuesta.obligatorio)))) {
                    this.jsonFormat(pregunta, null);
                }
            }
            return;
        } else if (pregunta.codigo_tipo == "cam") {
            if (
                !_.isUndefined(pregunta.respuesta) && !_.isNull(pregunta.respuesta)
                && (
                    (pregunta.multi_foto === 0 && !_.isUndefined(pregunta.respuesta.data) && !_.isNull(pregunta.respuesta.data))
                    || (pregunta.multi_foto === 1 && !_.isUndefined(pregunta.respuesta.foto) && !_.isNull(pregunta.respuesta.foto))
                )
            ) {
                this.jsonFormat(pregunta, null);
            }
            return;
        }
    }

    /**
     * Genera formato de respuestas soportados en api
     * @param pregunta
     * @param alternativa
     */
    jsonFormat(pregunta, alternativa) {
        if (pregunta && pregunta.codigo_tipo === 'radio') {
            if (alternativa && alternativa.codigo_tipo === 'correo' && alternativa.respuesta && alternativa.adicional) {
                alternativa.respuesta.adicional = alternativa.adicional;
            }
        }

        let alternativa_tipo_id = null;
        let alternativa_id = null;

        if (pregunta.codigo_tipo === 'check') {
            if (alternativa && alternativa.respuesta && alternativa.respuesta.checked === true) {
                alternativa_id = alternativa.id;
                alternativa_tipo_id = alternativa.tipo_id;
            }
        } else if (pregunta.codigo_tipo === 'radio') {
            if (alternativa && alternativa.tipo_id) {
                alternativa_tipo_id = alternativa.tipo_id;
                alternativa_id = alternativa.id;
            } else if (pregunta.alternativas && pregunta.respuesta && pregunta.respuesta.alternativa_id) {
                let alt = _.find(pregunta.alternativas, { id: pregunta.respuesta.alternativa_id });
                if (alt && alt.tipo_id) {
                    alternativa_tipo_id = alt.tipo_id;
                    alternativa_id = alt.id;
                }
            }
        }

        var formatToSend = {
            cuestionario_id: pregunta.cuestionario_id,
            cuestionario_sucursal_id: pregunta.cuestionario_sucursal_id,
            pregunta_tipo_id: pregunta.tipo_id,
            alternativa_tipo_id: alternativa_tipo_id,
            pregunta_id: pregunta.id,
            alternativa_id: alternativa_id,
            incidencia_id: null,
            alternativa_nombre: alternativa ? alternativa.texto : null,
            pregunta_nombre: pregunta ? pregunta.pregunta : null,
            peso: alternativa && alternativa.peso ? alternativa.peso : null,
            checklist_nombre: null,
            ambito_nombre: null,
            ambito_id: this.ambito,
            respuesta: alternativa ? alternativa.respuesta : pregunta.respuesta,
            multi_foto: alternativa ? alternativa.multi_foto : pregunta.multi_foto
        };

        this.respuestas.push(formatToSend)
    }

    // Obtiene el detalle de una tarea
    async getTaskDetail() {
        let detail = null;
        await this.request
            .get((config.endpoints.get.taskDetail + this.task_id), false)
            .then((response: any) => {
                if (response && response.data) {
                    detail = response.data;
                    this.task = detail.tarea;
                    this.checklistEnviado = this.task['estado'] >= 2 ? true : false;
                    this.preguntas = Object.keys(detail.preguntas).map(function (preguntasIndex) {
                        let obj = detail.preguntas[preguntasIndex];
                        return obj;
                    });
                    this.preguntas = this.updateType(this.preguntas);
                    this.ready = true;
                } else this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la tarea');
            })
            .catch((error: any) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener el detalle de la tarea');
            });
        return detail;
    }

    updateType(preguntas) {
        _.forEach(preguntas, function (question) {
            if (question.tipo_id == 1) question.codigo_tipo = 'radio';
            else if (question.tipo_id == 2) question.codigo_tipo = 'check';
            else if (question.tipo_id == 3) question.codigo_tipo = 'text';
            else if (question.tipo_id == 4) question.codigo_tipo = 'cam';

            question.alternativas = Object.keys(question.alternativas).map(function (alternativasIndex) {
                let obj = question.alternativas[alternativasIndex];
                if (question.tipo_id == 1) {
                    if (question.respuesta.alternativa_id != null && question.respuesta.alternativa_id === obj.id) obj.checked = true;
                    else obj.checked = false;
                } else if (question.tipo_id == 2) {
                    if (question.respuesta.alternativa_id != null) {
                        var isChecked = question.respuesta.alternativa_id.find(function (el) {
                            return el === obj.id;
                        });
                        if (isChecked) obj.checked = true;
                        else obj.checked = false;
                    } else obj.checked = false;

                }
                return obj;
            });
        });
        return preguntas;
    }

    /**
     * Envio de tarea rechazada
     */
    doNotAnswer() {
        let alert = this.alert.create({
            title: 'Escriba el motivo por el cual no pudo realizar la tarea',
            subTitle: '*Este campo es obligatorio para informar la no realización de la tarea.',
            buttons: [{
                text: 'Cancelar',
                handler: () => {
                }
            },
            {
                text: 'Comentar',
                handler: data => {
                    var params = {
                        tarea_id: this.task_id,
                        comentario: data[0]
                    };
                    this.request
                        .post(config.endpoints.post.rejectTask, params, false)
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
            }],
        });
        alert.addInput({
            type: 'test',
            label: 'comentario',
            value: ""
        });
        alert.present();
    }

    /**
     * Envio de formulario completo de tareas
     */
    answer() {
        var form = {};
        var total = this.preguntas.length;
        var count = 0;
        _.forEach(this.preguntas, function (question) {
            if (question.tipo_id == 1) {
                var checkAns = _.find(question.alternativas, { checked: true });
                if (!_.isNull(checkAns) && !_.isUndefined(checkAns)) {
                    count++;
                    form[question.id] = {
                        id: question.id,
                        alternativa: checkAns.id
                    };
                }
            }
            else if (question.tipo_id == 2) {
                var checkAns = _.filter(question.alternativas, { checked: true });

                //TODO: Si se quere dejar como correcto un checkbox sin respuestas, se debe quitar la evaluación checkAns.length > 0
                if (!_.isUndefined(checkAns) && !_.isNull(checkAns) && checkAns.length > 0) {
                    count++;
                    var ids = _.map(checkAns, 'id');
                    form[question.id] = {
                        id: question.id,
                        alternativa: ids
                    };
                }
            }
            else if (question.tipo_id == 3) {
                if (!_.isUndefined(question.respuesta.texto) && !_.isNull(question.respuesta.texto)) {
                    count++;
                }
                form[question.id] = {
                    id: question.id,
                    alternativa: null,
                    texto: question.respuesta.texto
                };
            }
            else if (question.tipo_id == 4) {
                if (!_.isUndefined(question.respuesta.foto) && !_.isNull(question.respuesta.foto)) {
                    count++;
                }

                form[question.id] = {
                    id: question.id,
                    alternativa: null,
                    texto: question.respuesta.texto,
                    foto: question.respuesta.foto
                };
            }
        });
        if (count < total) {
            this.util.showAlert('Atención', 'Debe completar todas las preguntas para enviar el formulario. ');
        } else {
            var toSend = {
                formulario: form,
                respondido: true,
                tarea_id: this.task_id
            };
            this.request
                .post(config.endpoints.post.approveTask, toSend, false)
                .then((response: any) => {
                    if (response.code == 200) {
                        let alert = this.alert.create({
                            title: 'Éxito',
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
                    this.util.showAlert('Alerta', 'No ha sido posible enviar los datos.');
                });
        }
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
                        this.navCtrl.push('NoEnviadasPage', { from_checklist: true });
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


    isEmpty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    showAmbitState() {
        this.mostrandoInfo = true;
        const modal = this.modalController.create(PreguntasIncompletasComponent, { preguntas: this.restantes, total: this.preguntas.length });
        modal.present();

        modal.onDidDismiss((data) => {
            this.mostrandoInfo = false;
            if (data && data.question && this.swiperElement && this.swiperElement.directiveRef) {
                let index = _.findIndex(this.preguntas, data.question);
                if (index > -1) {
                    this.swiperElement.directiveRef.setIndex(index);
                }
            }
        });
    }
}
