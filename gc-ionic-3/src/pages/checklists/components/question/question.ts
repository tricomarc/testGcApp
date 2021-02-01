import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ImageViewerController } from 'ionic-img-viewer';

import { dummyImage } from '../../../../shared/providers/util/util';

import * as _ from 'lodash';

@Component({
	selector: 'question',
	templateUrl: 'question.html'
})
export class QuestionComponent implements OnInit {

	@Input() question;
	@Input() isSubQuestion;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;


	constructor(private imgViewer: ImageViewerController) { }

	ngOnInit() { }

	/* Asigna el valor para 'no_aplica'
	Sin selección: 2 / Aplica: 0 / No aplica: 1 */
	setApplies(value: number) {
		// Si se reinicia el aplica / no aplica, borramos la respuesta de la pregunta y sus alternativas y sub preguntas en caso de que existan
		if (value === 2) {
			this.clearAnswers(this.question);
		}
		// Si se elige no aplica, asignamos las respuestas por defecto para cada caso 
		else if (value === 1) {
			this.setNotAppliesAnswer(this.question);
		}
		this.question.respuesta.no_aplica = value;
		this.ambitState.next(true);
	}

	// Borra recursivamente las respuestas que pueda tener una pregunta, sus alternativas y sus sub preguntas
	clearAnswers(question: any) {
		question.respuesta = { checked: false, data: null, foto: [], alternativa_id: null, no_aplica: 2 };
		if (question.alternativas && question.alternativas.length) {
			_.forEach(question.alternativas, (alternative: any) => {
				this.clearAnswers(alternative);
			});
		}
		if (question.subPregunta) {
			this.clearAnswers(question.subPregunta);
		}
	}

	// Asigna una respuesta por defecto para 'no aplica' según el tipo de pregunta
	setNotAppliesAnswer(question: any) {

		// Si la pregunta requiere una foto obligatoria, ponemos la por defecto
		if (question.foto && question.foto.obligatorio) {
			question.respuesta.obligatorio = {
				foto: dummyImage
			};
		}

		// Para estos tipos de preguntas, la respuesta por defecto es 'no_aplica'
		if (_.includes(['text', 'num', 'correo', 'fecha', 'porcentual'], question.codigo_tipo)) {
			question.respuesta.data = 'no_aplica';
		}
		// Para radio y check, debemos buscar la alternartiva oculta que tiene no_aplica: 1 y asignarla como respuesta 
		else if (question.codigo_tipo === 'radio' || question.codigo_tipo === 'check') {
			let notAppliesAlternative = _.find(question.alternativas, { no_aplica: 1 });
			if (notAppliesAlternative) {
				notAppliesAlternative.respuesta.checked = true;
				notAppliesAlternative.respuesta.alternativa_id = notAppliesAlternative.id;
				notAppliesAlternative.respuesta.no_aplica = 1;

				// Para todas las otras alternativas, reiniciamos sus respuestas
				_.forEach(this.question.alternativas, (alt: any) => {
					if (alt.id !== notAppliesAlternative.id) {
						alt.respuesta = { checked: false, data: null, foto: [], alternativa_id: null, no_aplica: 2 };
					}
				});
			}
		}
		// Para preguntas de foto asignamos una foto por defecto 
		else if (question.codigo_tipo === 'cam') {
			question.respuesta.data = dummyImage;
		}
	}

	/**
	 * Muestra la imagen de referencia de esta pregunta en el visor de fotos
	 * @param image 
	 */
	showReferenceImage(image: any) {
		const imageViewer = this.imgViewer.create(image);
		imageViewer.present();
	}
}

