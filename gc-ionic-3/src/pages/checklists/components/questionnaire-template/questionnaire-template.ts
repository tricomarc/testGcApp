import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, Content } from 'ionic-angular';

import * as _ from 'lodash';

import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';

import { checklistConfig } from '../../checklists.config';
import { globalConfig } from '../../../../config';

@Component({
	selector: 'questionnaire-template',
	templateUrl: 'questionnaire-template.html'
})
export class QuestionnaireTemplateComponent {

	@ViewChild(Content) content;

	private questionnaire = {
		rawQuestions: [],
		questions: []
	};

	private checklist: any = null;
	private ambits: any = [];
	private selectedAmbitId: any = null;
	private selectedAmbitName: string = null;
	private requesting: boolean = true;
	
	private isNextAmbit: boolean = false;
	private isPreviousAmbit: boolean = false;

	// Arreglo con tipos de preguntas que sólo se validan por el campo data
	private onlyDataQuestionTypes: string[] = ['text', 'num', 'correo', 'fecha', 'porcentual'];

	private moduleName: string = UtilProvider.actualModule;

	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private alertController: AlertController,
		private loadingController: LoadingController,
		private requestProvider: RequestProvider,
		private utilProvider: UtilProvider
	) { }

	// Al cargar la vista, verificamos que venga el checklist y el ámbito
	// Luego obtenemos el detalle de este cuestionario
	ionViewDidLoad() {
		if (!this.navParams.data.checklist || !this.navParams.data.ambit) {
			this.utilProvider.showToast('Falta información del ámbito.', 3000);
			this.navCtrl.pop();
			return;
		}

		this.checklist = this.navParams.data.checklist;
		this.ambits = this.checklist.ambitos;
		this.selectedAmbitId = this.navParams.data.ambit.id;

		this.setIsNextAmbit();
		this.setIsPreviousAmbit();

		this.getQuestionnaire();
	}

	// Verifica si hay o no un siguiente ámbito
	setIsNextAmbit() {
		let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
			return ambit.id === this.selectedAmbitId;
		});

		this.isNextAmbit = ((currentAmbitIndex > -1 && this.ambits[currentAmbitIndex + 1]) ? true : false);
	}

	// Verifica si hay o no un ámbito anterior
	setIsPreviousAmbit() {
		let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
			return ambit.id === this.selectedAmbitId;
		});

		this.isPreviousAmbit = ((currentAmbitIndex > -1 && this.ambits[currentAmbitIndex - 1]) ? true : false);
	}

	// Vuelve a obtener el detalle de un cuestionario
	changeAmbit() {
		this.setIsNextAmbit();
		this.setIsPreviousAmbit();
		this.getQuestionnaire();
	}

	// Obtiene el cuestionario del ámbito y checklist actual
	// primero lo buscamos localmente, si no está, vamos al servicio
	async getQuestionnaire() {

		this.questionnaire.rawQuestions = [];
		this.questionnaire.questions = [];

		this.setCurrentAmbitName();

		// Si no, solicitamos las respuestas de este ámbito a la API 
		this.requesting = true;
		await this.requestProvider.get(`${checklistConfig.endpoints.newApi.get.questions}?ambito_id=${this.selectedAmbitId}&checklist_id=${this.checklist.id}`, true)
			.then((response: any) => {
				if (response && response.data) {
					this.questionnaire.rawQuestions = response.data.preguntas;
					this.questionnaire.questions = this.setQuestions();
					return;
				}
				this.utilProvider.showToast('No ha sido posible obtener las preguntas del ámbito, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.utilProvider.showToast('No ha sido posible obtener las preguntas del ámbito, intente nuevamente.', 3000);
			});
		this.requesting = false;
		this.content.resize();
	}

	// Recorremos las preguntas en busca de sus respuestas
	setQuestions() {
		let questions = [];
		// Para cada pregunta del cuestionario, buscamos su respuesta
		_.forEach(this.questionnaire.rawQuestions, (question: any) => {
			this.findQuestionAnswer(question, false, false, null);
			questions.push(question);
		});
		return questions;
	}

	// Para cada pregunta, alternativa y sub pregunta asignamos la respuesta por defecto
	findQuestionAnswer(question: any, isAlternative: boolean, isSubQuestion: boolean, parentQuestion: any) {
		question.isAlternative = isAlternative;
		question.isSubQuestion = isSubQuestion;
		// Si no viene pregunta, paramos la ejecución del método
		if (!question || !question.id) return;

		// Asignamos la respuesta por defecto a la pregunta
		question.respuesta = { checked: false, data: null, foto: [], alternativa_id: null };

		if (question.subPregunta && question.subPregunta.id) {
			this.findQuestionAnswer(question.subPregunta, false, true, question);
		}

		if (question.alternativas && question.alternativas.length) {
			_.forEach(question.alternativas, (alternative: any) => {
				// Cada alternativa pasa a ser una pregunta
				this.findQuestionAnswer(alternative, true, false, question);
			});
		}
	}

	// Asigna el nombre del ámbito actual
	setCurrentAmbitName() {
		let ambit = _.find(this.ambits, { id: this.selectedAmbitId });
		if (ambit) {
			this.selectedAmbitName = ambit.nombre;
			return;
		}
		this.selectedAmbitName = null;
	}

	// Viaja hasta el siguiente ámbito
	showNextAmbit() {
		if (this.isNextAmbit) {
			let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
				return ambit.id === this.selectedAmbitId;
			});
			this.selectedAmbitId = this.ambits[currentAmbitIndex + 1].id;
			this.changeAmbit();
		}
	}

	// Viaja hasta el ámbito anterior
	showPreviousAmbit() {
		if (this.isPreviousAmbit) {
			let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
				return ambit.id === this.selectedAmbitId;
			});
			this.selectedAmbitId = this.ambits[currentAmbitIndex - 1].id;
			this.changeAmbit();
		}
	}
}