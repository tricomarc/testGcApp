import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

import { UtilProvider } from '../../../../../shared/providers/util/util';
import {global} from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-providers-incident',
	templateUrl: 'providers-incident.html',
})

export class ProvidersIncidentPage {

	// Atributos
	private incident: any = {};

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    // Constructor
	constructor(private viewCtrl: ViewController,
		private navParams: NavParams,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) { }

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'ProvidersIncidentIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ProvidersIncident', 'Incidents' );

		if (!this.navParams.data.incident) {
			this.util.showAlert('Atención', 'No ha sido posible obtener la información de la incidencia.');
			this.viewCtrl.dismiss();
			return;
		}
		this.incident = this.navParams.data.incident;
	}

	// Cierra el modal
	closeModal() {
		this.viewCtrl.dismiss();
	}
}
