import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

import { UtilProvider } from '../../../../../shared/providers/util/util';
import {global} from "../../../../../shared/config/global";
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-logs-incident',
	templateUrl: 'logs-incident.html',
})

export class LogsIncidentPage {

	// Atributos
	private logs: any = [];

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
		this.firebaseAnalyticsProvider.trackView( 'LogsIncidentIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'LogsIncident', 'Incidents' );

		// Si el arreglo de logs no viene o está vacío, cerramos esta vista
		if (!this.navParams.data.logs || this.navParams.data.logs.length < 1) {
			this.util.showAlert('Atención', 'Esta incidencia no tiene logs');
			this.viewCtrl.dismiss();
			return;
		}
		// En caso contrario, los asignamos
		this.logs = this.navParams.data.logs;
	}

	// Cierra el modal
	closeModal() {
		this.viewCtrl.dismiss();
	}
}
