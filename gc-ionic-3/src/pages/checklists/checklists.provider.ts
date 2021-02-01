import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UUID } from 'angular2-uuid';

import * as _ from 'lodash';
import * as moment from 'moment';
import { globalConfig } from '../../config';

import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';

import { checklistConfig } from './checklists.config';

@Injectable()

export class ChecklistsProvider {

	constructor(private storage: Storage, private requestProvider: RequestProvider, private utilProvider: UtilProvider) { }

	// Busca y retorna un ambito a partir de su id y el id de su checklist
	async getAmbitByIdAndChecklistId(checklistId: any, ambitId: any) {
		let ambits = await this.getAmbits();

		return _.find(ambits, (ambit: any) => {
			return ((ambit.checklistId === checklistId) && (ambit.ambitId === ambitId));
		});
	}

	// Retorna un arreglo de ámbitos guardados localmente
	async getAmbits(): Promise<any[]> {
		let ambits = [];
		await this.storage.get('SAVED_AMBITS')
			.then((result: any) => {
				let aux = JSON.parse(result);
				if (_.isArray(aux)) {
					ambits = aux;
				}
			})
			.catch(() => { });
		return ambits;
	}

	// Guarda las preguntas de un ámbito localmente
	async saveAnswers(questionnaire: any, checklistId: any, ambitId: null, checkInId: any, latitude: any, longitude: any) {
		let answers = {
			uuid: UUID.UUID(),
			questionnaire: questionnaire,
			checklistId: checklistId,
			ambitId: ambitId,
			checkInId: checkInId,
			latitud: latitude,
			longitud: longitude
		};
		let ambits = await this.getAmbits();

		// Borramos cualquier respuesta anterior de este ámbito en este checklist
		_.remove(ambits, (ambit: any) => {
			return ((ambit.ambitId === ambitId) && (ambit.checklistId === checklistId));
		});

		ambits.push(answers);
		this.storage.set('SAVED_AMBITS', JSON.stringify(ambits)).then(() => { }).catch(() => { });
	}

	// Genera y retorna el cuerpo del request que envía las respuestas a la API
	public static getRequestBody(questions: any, ambitId: any, checklistId: any, checkInId: any, latitude: any, longitude: any) {
		let body = {
			respuestas: [],
			ambito_id: ambitId,
			checklist_id: checklistId,
			latitud: latitude,
			longitud: longitude
		};
		_.forEach(questions, (question) => {
			this.addAnswerToBody(question, body.respuestas, null, ambitId);
		});
		return body;
	}

	// Formatea y agrega cada respuesta del ámbito al cuerpo del request
	public static addAnswerToBody(question: any, answers: any[], parentQuestion: any, ambitId: any) {
		let answer = {
			cuestionario_id: ((parentQuestion && question.isAlternative) ? parentQuestion.cuestionario_id : question.cuestionario_id),
			cuestionario_sucursal_id: ((parentQuestion && question.isAlternative) ? parentQuestion.cuestionario_sucursal_id : question.cuestionario_sucursal_id),
			pregunta_tipo_id: ((parentQuestion && question.isAlternative) ? parentQuestion.tipo_id : question.tipo_id),
			alternativa_tipo_id: (question.isAlternative ? question.tipo_id : null),
			pregunta_id: ((question.isAlternative && parentQuestion) ? parentQuestion.id : question.id),
			alternativa_id: (question.isAlternative ? question.id : null),
			incidencia_id: null,
			alternativa_nombre: (question.isAlternative ? question.texto : null),
			pregunta_nombre: ((parentQuestion && question.isAlternative) ? parentQuestion.pregunta : question.pregunta),
			peso: (question.isAlternative && question.peso) ? question.peso : null,
			checklist_nombre: null,
			ambito_nombre: null,
			ambito_id: ambitId,
			respuesta: { data: null, obligatorio: null },
			multi_foto: (question.multi_foto == 1 ? 1 : 0)
		};

		if (question.respuesta) {
			// Si la pregunta no usa aplica y no es alternativa ni sub pregunta, por defecto enviamos no_aplica = 0
			if (!question.useApplies && !(question.isAlternative || question.isSubQuestion)) {
				question.respuesta.no_aplica = 0;
			}

			// Antes de enviar una respuesta de fecha debemos cambiar su formato
			if (question.codigo_tipo === 'fecha' && question.respuesta.data) {
				if (question.respuesta.no_aplica === 1) {
					question.respuesta.data = 'no_aplica';
				} else {
					question.respuesta.data = moment(question.respuesta.data, 'YYYY-MM-DD').format("DD-MM-YYYY");
				}

				if (question.respuesta.data === 'Invalid date') {
					question.respuesta.data = null;
				}
			}

			if (question.codigo_tipo === 'porcentual' && question.respuesta.data > 100) {
				question.respuesta.data = "";
			}
			/* // *NO: Si la respuesta no cuenta con data, asignamos null para evitar errores en la API
			if ( !question.respuesta.data && question.respuesta.data !== 0  ) {
				question.respuesta.data = "";
			} */

			// cuando no hay data, pero esta respuesta este asociada a un mueble_id y tenga un valor esperado
			// respondemos con vacio, para que la api no la cuente como respondida


			if (!_.isNull(question.pregunta_mueble_id) && _.isNull(question.mueble_id) && _.isNull(question.valor_esperado)) {
				question.respuesta.data = null;
			} else if (!question.respuesta.data && question.respuesta.data !== 0) {
				question.respuesta.data = "";
			}

			answer.respuesta = question.respuesta;

			// Para considerar respuesta válida para preguntas porcentual y fecha, data no debe ser nulo
			/*&& !(_.includes(['porcentual', 'fecha'], question.codigo_tipo) && !answer.respuesta.data)*/
			// Para considerar respuesta válida para preguntas check y radio, la respuesta debe contar con su alternativa_id
			if (
				// Para considerar respuesta válida para preguntas check y radio, la respuesta debe contar con su alternativa_id
				!_.includes(['check', 'radio'], question.codigo_tipo) && !question.alternativa_id
				// Para considerar respuesta válida para preguntas porcentual y fecha, data no debe ser nulo
				/*&& !(_.includes(['porcentual', 'fecha'], question.codigo_tipo) && !answer.respuesta.data)*/
			) {
				answers.push(answer);
			}
		}

		// Si la pregunta, tiene una sub pregunta, del mismo modo asignamos su respuesta
		if (question.subPregunta && question.subPregunta.id) {
			ChecklistsProvider.addAnswerToBody(question.subPregunta, answers, question, ambitId);
		}

		// Si la pregunta es de tipo check o radio y tiene alternativas, asignamos sus respuestas
		if (_.includes(['check', 'radio'], question.codigo_tipo) && question.alternativas && question.alternativas.length) {
			_.forEach(question.alternativas, (alternative: any) => {
				if (alternative.respuesta && alternative.respuesta.checked === true) {
					ChecklistsProvider.addAnswerToBody(alternative, answers, question, ambitId);
				}
			});

		}
	}

	// Envía las respuestas de los ámbitos guardados localmente
	async sendPendingAmbits() {
		let ambits = await this.getAmbits();

		if (ambits.length) {
			let promises: any[] = [];

			// Para cada ámbito obtenemos el cuerpo para el request
			_.forEach(ambits, (ambit: any) => {
				let body = ChecklistsProvider.getRequestBody(ambit.questionnaire.questions, ambit.ambitId, ambit.checklistId, null, ambit.latitud, ambit.longitud);
				// Creamos el request con cada cuerpo y lo agregamos al arreglo de promesas
				promises.push(this.createRequest(body));
			});

			// Cuando todos los requests finalicen, evaluamos si el envío fue exitoso
			// En caso de éxito, borramos las respuestas guardadas localmente
			Promise.all(promises)
				.then(async (results: any) => {
					for (let result of results) {
						if (result.success === true) {
							await this.removeAnswersByAmbitAndChecklistId(result.extraData.ambitId, result.extraData.checklistId);
						}
					}
				})
				.catch(() => { });
		}
	}

	// Elimina las respuestas almacenadas de un ámbito de un checklist en particular
	async removeAnswersByAmbitAndChecklistId(ambitId: any, checklistId: any) {
		try {
			let ambits = await this.getAmbits();
			_.remove(ambits, (ambit: any) => {
				return ((ambit.ambitId === ambitId) && (ambit.checklistId === checklistId));
			});
			await this.storage.set('SAVED_AMBITS', JSON.stringify(ambits)).then(() => { }).catch((e) => {
				this.utilProvider.logError(e, 'RMP210', globalConfig.version);
			});
			return true;
		} catch (e) {
			this.utilProvider.logError(e, 'RMP214', globalConfig.version);
			return false;
		}
	}

	// Crea y retorna un request para guardar las respuestas del ámbito que entran por parámetro
	createRequest(body: any) {
		return new Promise((resolve) => {
			this.requestProvider.post(checklistConfig.endpoints.newApi.post.sendAnswers, body, true)
				.then((response: any) => {
					resolve({
						result: response,
						success: (response.status === true ? true : false),
						extraData: {
							ambitId: body.ambito_id,
							checklistId: body.checklist_id
						}
					});
				})
				.catch((error: any) => {
					resolve({
						result: error,
						success: false,
						extraData: {
							ambitId: body.ambito_id,
							checklistId: body.checklist_id
						}
					});
				});
		});
	}
}

// 10613930-k