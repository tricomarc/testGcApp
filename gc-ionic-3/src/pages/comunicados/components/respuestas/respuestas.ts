import {Component} from '@angular/core';
import {NavParams} from "ionic-angular";
import * as _ from 'lodash';
import {global} from "../../../../shared/config/global";
import {UtilProvider} from "../../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the RespuestasComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'respuestas',
    templateUrl: 'respuestas.html'
})
export class RespuestasComponent {

    details = {};
    questions = [];

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(params: NavParams, private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
        this.details = params;
        this.buildAnswers()
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'RespuestasComponentComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'RespuestasComponent', 'Comunicados' );
    }

    /**
     * Se asocian las respuestas enviadas a su pregunta respectiva
     */
    buildAnswers() {
        if (!_.isUndefined(this.details["data"].cuestionario.respuestas)) {
            _.forEach(this.details["data"].cuestionario.respuestas, (question) => {
                this.questions.push(question);
            });
        }
    }

}
