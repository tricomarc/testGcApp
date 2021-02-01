import { Component } from '@angular/core';
import { IonicPage, Content, NavController, NavParams } from 'ionic-angular';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';

// Configuración global
import { global } from '../../../shared/config/global';

// Configuración del componente
import { config } from './solutions.config';
import { globalConfig } from '../../../config';

@IonicPage()
@Component({
	selector: 'page-solutions',
	templateUrl: 'solutions.html',
})
export class SolutionsPage {

	private problem: any = null;
	private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(private navCtrl: NavController,
		private navParams: NavParams,
		private request: RequestProvider,
		private util: UtilProvider) {
	}

	// Método que se inicia al cargar la vista
	ionViewDidLoad() {
		if (!this.navParams.data.problem) {
			this.util.showAlert('Atención', 'Falta información sobre el problema, intente nuevamente.');
			this.navCtrl.pop();
			return;
		}

		this.problem = this.navParams.data.problem;

		// Asignamos a cada solución un atributo para controlar su estado (Abierto o cerrado)
		_.forEach(this.problem.soluciones, (solution) => {
			solution.show = false;
		});
	}

	// Alterna el estado de una solución (Abierto o cerrado)
	toggleSolution(solution: any) {
		solution.show = !solution.show;
	}

	// Agrega o quita un like para la solución
	setLike(solution: any) {
		this.request
			.post(config.endpoints.newApi.post.like, { solucion_id: solution.id }, true)
			.then((response: any) => {
				if (response && response.data === 'liked') {
					solution.like = 1;
					solution.total_likes++;
				} else if (response && response.data === 'disliked') {
					solution.like = 0;
					solution.total_likes--;
				} else {
                    this.util.showAlert('Atención', 'Error al enviar valoración, intente nuevamente');
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.util.showAlert('Atención', 'Error al enviar valoración, intente nuevamente');
			});
	}
}
