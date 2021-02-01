import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, NavParams, ViewController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../../shared/providers/util/util';

// Configuración
import { config } from './evaluate-incident.config';

// Páginas
import { LogsIncidentPage } from '../logs-incident/logs-incident';
import { global } from "../../../../../shared/config/global";
import { globalConfig } from '../../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-evaluate-incident',
	templateUrl: 'evaluate-incident.html',
})

export class EvaluateIncidentPage {

	// Atributos
	private incident: any = {};
	private requesting: boolean = false;

	private form: any = {
		jefe_conforme: null,
		incidencia_id: null
	};

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private viewCtrl: ViewController,
		private navParams: NavParams,
		private request: RequestProvider,
		private util: UtilProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'EvaluateIncidentIncidents' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'EvaluateIncident', 'Incidents' );

		// Si no viene la incidencia, cerramos la vista
		if (!this.navParams.data.incident) {
			this.util.showAlert('Alerta', 'Falta información de la incidencia');
			this.navCtrl.pop();
			return;
		}

		// En caso contrario, asignamos la incidencia
		this.incident = this.navParams.data.incident;
		// También agregamos el id de la incidencia al formulario
		this.form.incidencia_id = this.incident.datos.id;
	}

	// Cierra la vista actual
	closeModal() {
		this.viewCtrl.dismiss({ evaluated: false });
	}

	// Evalua una resolución de una incidencia
	evaluate() {
		// Si no se responde la conformidad del jefe, paramos la ejecución del método
		if (this.form.jefe_conforme === null) {
			// Informamos al usuario
			this.util.showAlert('Alerta', 'Indique si está conforme con la resolución');
			return;
		}

		// Si responde el formulario, enviamos la solicitud
		let loading = this.loading.create({ content: 'Enviando evaluación.' });
		loading.present();

		// Enviamos el formulario a la API
		this.request
			.post(config.endpoints.oldApi.post.evaluate, this.form, false)
			.then((response: any) => {
				loading.dismiss();
				// Si tenemos respuesta
				if (response) {
					// Y obtenemos código 200, consideramos que la solicitud fue exitosa
					if (response.code === 200) {
						// Informamos al usuario
						this.util.showAlert('Éxito', (response.message ? response.message : 'Evaluación enviada correctamente.'));
						// Cerramos la vista, Indicando que la solicitud fue exitosa
						this.viewCtrl.dismiss({ evaluated: true });
						return;
					}
					this.util.showAlert('Error', (response.message ? response.message : 'Evaluación no enviada, intente nuevamente.'));
					return;
				}
				this.util.showAlert('Error', 'Evaluación no enviada, intente nuevamente.');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				this.util.showAlert('Error', 'Evaluación no enviada, intente nuevamente.');
			});
	}
}