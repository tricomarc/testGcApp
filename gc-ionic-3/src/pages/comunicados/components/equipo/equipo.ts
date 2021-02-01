import {Component} from '@angular/core';
import {NavParams} from "ionic-angular";
import {global} from "../../../../shared/config/global";
import {UtilProvider} from "../../../../shared/providers/util/util";
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

/**
 * Generated class for the EquipoComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'equipo',
    templateUrl: 'equipo.html'
})
export class EquipoComponent {

    details = {};

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(params: NavParams, private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
        this.details = params;
    }

    ionViewDidLoad(){
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'EquipoComponentComunicados' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'EquipoComponent', 'Comunicados' );
    }

}
