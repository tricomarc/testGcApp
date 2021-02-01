import {Component} from '@angular/core';
import {AlertController, LoadingController, NavParams, ViewController} from "ionic-angular";
import * as _ from 'lodash';
import {config} from "../../tienda/comunicados-tienda.config";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {UtilProvider} from "../../../../shared/providers/util/util";
import {DetailsModalPage} from "../../details-modal/details-modal";
import {global} from "../../../../shared/config/global";
import { globalConfig } from '../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the CuestionarioComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'cuestionario',
    templateUrl: 'cuestionario.html'
})
export class CuestionarioComponent {

    details = {};
    questions = [];
    validSend = true;
    onlyWatch: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        private params: NavParams,
        private request: RequestProvider,
        private loading: LoadingController,
        private util: UtilProvider,
        public viewCtrl: ViewController,
        public detailsModalPage: DetailsModalPage,
        private alert: AlertController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        this.details = params;
        if (!_.isUndefined(this.details['data'].watch) && !_.isNull(this.details['data'].watch)) {
            this.onlyWatch = this.details['data'].watch;
        }
        this.buildForm();
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'CuestionarioComponentComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'CuestionarioComponent', 'Comunicados' );
    }

    /**
     * Asigna alternativas a pregunta respectiva
     */
    buildForm() {
        if (!_.isUndefined(this.details["data"].cuestionario.preguntas)) {
            _.forEach(this.details["data"].cuestionario.preguntas, (question) => {
                var answers = [];
                _.forEach(question.alternativas, (answer) => {
                    answers.push(answer)
                });
                question.alternativas = answers;
                question.selected = null;
                this.questions.push(question);
            });
        }

    }

    /**
     * asigna respuesta seleccionada a pregunta
     * @param pregunta
     * @param alternativa
     */
    selectedOption(pregunta, alternativa) {
        pregunta.selected = alternativa;
    };

    /**
     * Activa o desactiva boton de envio (deben responderse todas las preguntas)
     * @param form
     * @returns {boolean}
     */
    valid(form) {
        var isComplete = true;
        _.forEach(form, (answer) => {
            if (_.isNull(answer.selected)) {
                isComplete = false;
            }
        });
        return isComplete;
    }

    /**
     * Obtiene y valida toda la información proveniente del cuestionario del comunicado,
     * en caso de que el formulario esté completo, se envian las respuestas al servicio
     * @param mixed $form // Respuestas seleccionadas por el usuario
     * @return mixed
     */
    sendQuestions(form) {
        this.validSend = false;
        const loading = this.loading.create({content: 'Obteniendo comunicados'});
        var isComplete = true;
        var sendForm = [];

        _.forEach(form, (answer) => {
            if (_.isNull(answer.selected)) {
                isComplete = false;
            }

            var temp = {
                'respuesta_id': answer.selected,
                'pregunta_id': answer.pregunta_id
            };
            sendForm.push(temp);
        });

        if (!isComplete) {
            this.util.showAlert('Atención', "Debe contestar todas las preguntas");
            this.validSend = true;
            loading.dismiss();
        } else {
            var params = {
                comunicado_id: this.details["data"].comunicado.comunicado_id,
                form: sendForm
            };

            this.request
                .post(config.endpoints.put.comunicados, JSON.stringify(params), false)
                .then((response: any) => {
                    try {
                        let alert = this.alert.create({
                            title: response.data.title,
                            subTitle: response.data.message,
                            buttons: [{
                                text: 'Aceptar',
                                handler: data => {
                                    this.detailsModalPage.closeModal();
                                }
                            }],
                        });
                        alert.present();
                        //this.util.showAlert(response.data.title, response.data.message);

                    }
                    catch (e) {
                    }
                    this.validSend = true;
                    loading.dismiss();
                    return response;
                })
                .catch((error: any) => {
                    try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                    loading.dismiss();
                    if (error && error.message) this.util.showAlert("Atención", error.message);
                    this.validSend = true;
                    return error;
                });
        }
    };
}
