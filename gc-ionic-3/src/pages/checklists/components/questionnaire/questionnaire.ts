import { Component, ViewChild, EventEmitter, Output } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, ModalController, Content, ActionSheetController, VirtualScroll, Events, Platform } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';

import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { ChecklistsProvider } from '../../checklists.provider';

import { IncompleteQuestionsComponent } from '../incomplete-questions/incomplete-questions';
import { ChecklistHistoricalComponent } from '../checklist-historical/checklist-historical';

import { checklistConfig } from '../../checklists.config';
import { globalConfig } from '../../../../config';
import { UUID } from 'angular2-uuid';
import { PermissionRequestComponent } from '../../../../components/permissions-request/permissions-request';

import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { AlertsComponent } from '../../../map-visit/components/alerts/alerts';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

declare var PhoneCallTrap: any;

@Component({
	selector: 'questionnaire',
	templateUrl: 'questionnaire.html'
})
export class QuestionnaireComponent {

	@ViewChild(Content) content: Content;
	@ViewChild(VirtualScroll) listView: VirtualScroll;
	@ViewChild("swiperElement") swiperElement;

	private questionnaire = {
		rawQuestions: [],
		rawAnswers: [],
		questions: []
	};

	private isNextAmbit: boolean = false;
	private isPreviousAmbit: boolean = false;

	private checklist: any = null;
	private ambits: any = [];
	private selectedAmbitId: any = null;
	private auxAmbitId: any = null;
	private selectedAmbitName: string = null;
	private requesting: boolean = false;
	private branchOfficeId: number = null;

	private verificationValues: { use: boolean, total: number, current: number } = {
		use: false,
		total: null,
		current: 0
	};

	private totalValue: number;
	private valueError: boolean = false;

	private totalValues: any = [];
	private totalError: boolean = false;

	private noValor: boolean = false;

	private isQuestionnaireComplete: boolean = true;
	private incompleteQuestions: any[] = [];

	private ambitState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	private checklistState: BehaviorSubject<boolean>;

	// Arreglo con tipos de preguntas que sólo se validan por el campo data
	private onlyDataQuestionTypes: string[] = ['text', 'num', 'correo', 'fecha', 'porcentual'];

	private settings: any = {
		questionAsSlides: false
	};

	private currentSlideIndex: number = 0;
	private isFirstLoad: boolean = true;

	private moduleName: string = UtilProvider.actualModule;

	// De geolocalización
	private ubiRequire: any;
	private fromQ: any = 1;
	private currentUbi = {
		latitude: null,
		longitude: null,
	};
	private loading: any;
	private gpsModal: any;
	private gpsEnabled: boolean;
	private timeOut: any;

	private session: any;
	// diccionario
	private ambito: string;

	public static ambitId: number = null;
	public static position: any = null;
	private view: string = null;
	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private alertController: AlertController,
		private loadingController: LoadingController,
		private modalController: ModalController,
		private actionSheetController: ActionSheetController,
		private events: Events,
		private requestProvider: RequestProvider,
		private utilProvider: UtilProvider,
		private checklistsProvider: ChecklistsProvider,
		private sessionProvider: SessionProvider,
		private geolocation: Geolocation,
		private diagnostic: Diagnostic,
		private modal: ModalController,
		private dictionary: DictionaryProvider,
		private platform: Platform,
		private locationAccuracy: LocationAccuracy
	) { }


	ionViewDidEnter() {
		this.events.subscribe('CAMERA-BACKGROUND', (data: any) => {
			this.view = data.view || null;
		});
	}

	ngOnDestroy(){
		this.events.unsubscribe('CAMERA-BACKGROUND');
	}


	// Al cargar la vista, verificamos que venga el checklist y el ámbito
	// Luego obtenemos el detalle de este cuestionario
	async ionViewDidLoad() {

		if (this.platform.is('android')) {
			try {
				PhoneCallTrap.onCall((obj) => {
					if (obj === 'RINGING') {
						this.checklistsProvider.saveAnswers(this.questionnaire, this.checklist.id, (
							QuestionnaireComponent.ambitId ? QuestionnaireComponent.ambitId : this.auxAmbitId
						), null, this.currentUbi.latitude, this.currentUbi.longitude);
					}
				});
			} catch (e) { }
		}

		try {

			if (!this.navParams.data.checklist || !this.navParams.data.ambit) {
				this.utilProvider.showToast('Falta información del ámbito.', 3000);
				this.navCtrl.pop();
				return;
			}

			await this.dictionary.getDictionary().then((dictionary: any) => {
				this.ambito = dictionary['Ambito']
			});

			this.currentPoss();

			this.branchOfficeId = (_.isNumber(this.navParams.data.checklist) ? this.navParams.data.checklist : null);

			this.checklistState = this.navParams.data.checklistState;

			this.checklist = this.navParams.data.checklist;
			this.ambits = this.checklist.ambitos;
			this.selectedAmbitId = this.navParams.data.ambit.id;
			this.auxAmbitId = _.cloneDeep(this.selectedAmbitId);

			this.publishDataAmbit();

			this.setIsNextAmbit();
			this.setIsPreviousAmbit();

			/**
			 * Cuando una pregunta numérica tiene referencia, debemos validar que
			 * la respuesta de dicha pregunta respete la respuesta de la pregunta principal
			 * en base al operador especificado
			 */
			this.events.subscribe('VALIDATE_REFERENCE', (data: any) => {
				this.validateReference(data);
			});

			// Escucha los cambios en las preguntas
			this.ambitState.subscribe(() => {

				setTimeout(() => {
					// Reiniciamos el arreglo de preguntas incompletas
					this.incompleteQuestions = [];

					for (let question of this.questionnaire.questions) {
						this.validateQuestion(question);
					}
					this.content.resize();
				}, 300);

				// VALOR ESPERADO POR AMBITO
				if (this.verificationValues.use) {
					for (let total of this.totalValues) {
						// asignamos cada total al valor total de los valores de verificacion
						this.verificationValues.total = total.valor_esperado;

						// calculamos el valor actual en funcion de la repuesta
						// hacemos la suma dinámica:
						this.verificationValues.current = _.sumBy(this.questionnaire.questions
							.filter(question => {
								return (
									// si la pregunta viene asociada a un mueble
									question.codigo_tipo === 'num' && question.mueble_id == total.mueble_id
								)
							}), (question) => {
								// sacamos la respuesta
								const answer: number = parseInt(question.respuesta.data);

								return (_.isNumber(answer) ? answer : 0);
							});

						// si excede el valor total mostramos un error
						if (this.verificationValues.current > this.verificationValues.total) {
							// en lugar de mostrar un toast, mostramos un mensaje de error en ambas preguntas
							this.totalError = true;
						} else {
							this.totalError = false;
						}
					}
				}
			});

			await this.getQuestionnaire();

			// MAS DE UN VALOR TOTAL
			// Calculamos los totales para todos los mueble_id
			_.forEach(this.questionnaire.questions, (question: any) => {
				// vemos si esta pregunta ya se repite por campo mueble_id, es decir, que tenga mas de una asociacion
				if (_.some(this.questionnaire.questions, { mueble_id: question.mueble_id })) {
					// solo si el valor no esta, lo agrego 
					if (!_.some(this.totalValues, { mueble_id: question.mueble_id })) {
						this.totalValues.push({ mueble_id: question.mueble_id, valor_esperado: question.valor_esperado });
					}
				}
			});

			// validamos el arreglo de valores esperados !_.isEmpty( this.totalValues ) || !_.isUndefined( this.totalValues ) || !_.isNull(this.totalValues )
			if (!this.totalValues) {
				this.verificationValues.use = true;
			}
		} catch (e) {

		}
	}

	ionViewDidLeave() {
		this.questionnaire = {
			rawQuestions: [],
			rawAnswers: [],
			questions: []
		};
	}

	// Verifica y decide si hay o no un siguiente ámbito
	setIsNextAmbit() {
		let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
			return ambit.id === this.selectedAmbitId;
		});

		this.isNextAmbit = ((currentAmbitIndex > -1 && this.ambits[currentAmbitIndex + 1]) ? true : false);
	}

	// Verifica y decide si hay o no un ámbito anterior
	setIsPreviousAmbit() {
		let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
			return ambit.id === this.selectedAmbitId;
		});

		this.isPreviousAmbit = ((currentAmbitIndex > -1 && this.ambits[currentAmbitIndex - 1]) ? true : false);
	}

	ionViewWillUnload() {
		try {
			this.events.unsubscribe('VALIDATE_REFERENCE');
			this.ambitState.unsubscribe();
		} catch (e) { }
	}

	// Antes de que la vista se destruya, verifica si el usuario ha hecho cambios en el checklist
	// Si hay cambios, levanta una alerta para dar la opción de enviar los cambios antes de salir
	async ionViewCanLeave() {
		// Si no hay cambios, cerramos la vista
		if (!this.ambitState.value) return true;

		let canLeave: boolean = false;

		let btnPressed: boolean = false;

		// Creamos una promesa la cual nos dirá si guardamos o descartamos los cambios antes de salir
		const canLeavePromise = new Promise<Boolean>(resolve => {
			// validamos segun las preguntas asociadas a muebles
			if (this.totalError === true) {
				// generamos la alerta
				const confirm = this.alertController.create({
					title: 'Atención',
					//subTitle: `La cantidad ingresada: ${this.verificationValues.current}, supera los muebles ingresados en el sistema: ${this.verificationValues.total}. Si sales, los valores no se guardarán.`,
					subTitle: `La cantidad ingresada supera los muebles ingresados en el sistema. Si sales, los valores no se guardarán.`,
					buttons: [{
						text: 'Descartar',
						handler: () => {
							btnPressed = true;

							this.totalError = false;
							resolve(true)
						}
					}, {
						text: 'Volver',
						handler: () => {
						}
					}]
				});
				confirm.present();

				confirm.onDidDismiss(() => {
					if (!btnPressed) resolve(false);
				});
			} else {
				// flujo normal
				const confirm = this.alertController.create({
					title: 'Atención',
					subTitle: 'Tienes cambios sin guardar, te recomendamos guardarlos antes de salir.',
					buttons: [{
						text: 'Descartar',
						handler: () => {
							btnPressed = true;
							resolve(true)
						}
					}, {
						text: 'Guardar',
						handler: async () => {
							btnPressed = true;
							if (this.verificationValues.use) {
								const question = this.findNumericQuestionInvalid();

								if (question) {
									this.utilProvider.showAlert(
										'Atención',
										//`La cantidad ingresada: ${question.respuesta.data}, supera los muebles ingresados en el sistema: ${question.valor_esperado}. Por favor verifique las respuestas.`
										`La cantidad ingresada supera los muebles ingresados en el sistema. Por favor verifique las respuestas.`
									);
									resolve(false);
									return;
								}
							} else {
								this.loading = this.loadingController.create({ content: 'Guardando respuestas...' });

								this.loading.present();

								await this.sendAnswers(true, false)

								resolve(true);

								return;
							}
						}
					}]
				});

				confirm.present();

				confirm.onDidDismiss(() => {
					if (!btnPressed) resolve(false);
				});
			}
		});

		await canLeavePromise.then((result: boolean) => {
			canLeave = result;
		});

		return canLeave;
	}

	// Vuelve a obtener el detalle de un cuestionario
	changeAmbit() {

		this.publishDataAmbit();


		// Antes de cambiar de ámbito, checkeamos si hay preguntas sin guardar
		// Si las hay, recomendamos al usuario guardarlas antes
		if (this.ambitState.value) {
			// validación para preguntas de tipo 'num' que tengan asociacion de algun mueble
			if (this.totalError === true) {
				// generamos la alerta
				const confirm = this.alertController.create({
					title: 'Atención',
					//subTitle: `La cantidad ingresada: ${this.verificationValues.current}, supera los muebles ingresados en el sistema: ${this.verificationValues.total}. Si sales, los valores no se guardarán.`,
					subTitle: `La cantidad ingresada supera los muebles ingresados en el sistema. Si sales, los valores no se guardarán.`,
					buttons: [{
						text: 'Descartar',
						handler: () => {
							this.setIsNextAmbit();
							this.setIsPreviousAmbit();
							this.getQuestionnaire();
						}
					}, {
						text: 'Volver',
						handler: () => {
						}
					}]
				});

				confirm.present();
				return;
			}

			// flujo normal
			const confirm = this.alertController.create({
				title: 'Atención',
				subTitle: 'Tienes cambios sin guardar, te recomendamos guardarlos antes de pasar al siguiente ámbito.',
				buttons: [{
					text: 'Descartar',
					handler: () => {
						this.setIsNextAmbit();
						this.setIsPreviousAmbit();
						this.getQuestionnaire();
					}
				}, {
					text: 'Guardar',
					handler: async () => {
						if (this.verificationValues.use) {
							const question = this.findNumericQuestionInvalid();

							if (question) {
								this.utilProvider.showAlert(
									'Atención',
									//`La cantidad ingresada: ${question.respuesta.data}, supera los muebles ingresados en el sistema: ${question.valor_esperado}. Por favor verifique las respuestas.`
									`La cantidad ingresada supera los muebles ingresados en el sistema. Por favor verifique las respuestas.`
								);
								return;
							}
						}
						this.loading = this.loadingController.create({ content: 'Guardando respuestas...' });

						this.loading.present();
						await this.sendAnswers(true, true);
						this.auxAmbitId = _.cloneDeep(this.selectedAmbitId);

						this.setIsNextAmbit();
						this.setIsPreviousAmbit();
						this.getQuestionnaire();
					}
				}]
			});
			confirm.present();
			return;
		}
		this.setIsNextAmbit();
		this.setIsPreviousAmbit();
		this.getQuestionnaire();
		if (this.settings.questionAsSlides) {
			this.updateSlides();
		}
	}

	// Actualiza las slides de la vista
	updateSlides() {
		setTimeout(() => {
			if (this.swiperElement && this.swiperElement.directiveRef) {
				this.swiperElement.directiveRef.update();
				this.slideToFirstIncomplete();
				this.content.resize();
				try {
					this.content.scrollToTop(500);
				} catch (e) { }
			}
		}, 300);
	}

	// Obtiene el cuestionario del ámbito y checklist actual
	// primero lo buscamos localmente, si no está, vamos al servicio
	async getQuestionnaire() {
		this.incompleteQuestions = [];

		this.setCurrentAmbitName();

		// Si encontramos respuestas guardadas localmente para este ámbito, le damos prioridad sobre la del servicio
		let aux = await this.checklistsProvider.getAmbitByIdAndChecklistId(this.checklist.id, this.selectedAmbitId);

		if (aux && aux.questionnaire) {
			this.setLocalAnswers(aux);
			return;
		}

		// Si no, solicitamos las respuestas de este ámbito a la API 
		this.requesting = true;
		await this.requestProvider.get(`${checklistConfig.endpoints.newApi.get.questions}?ambito_id=${this.selectedAmbitId}&checklist_id=${this.checklist.id}`, true)
			.then((response: any) => {
				if (response && response.data) {
					this.ambitState.next(false);
					this.questionnaire.rawQuestions = response.data.preguntas;
					this.questionnaire.rawAnswers = response.data.respuestas;
					this.questionnaire.questions = this.joinQuestionsAndAnswers();

					// para geolocalizacion
					this.ubiRequire = response.data.requiere_ubicacion;

					this.content.resize();
					try {
						this.content.scrollToTop(500);
					} catch (e) { }
					return;
				}

				this.utilProvider.showToast('No ha sido posible obtener las preguntas del ámbito, intente nuevamente.', 3000);
			})
			.catch((error: any) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.utilProvider.showToast('No ha sido posible obtener las preguntas del ámbito, intente nuevamente.', 3000);
			});

		// validacion
		this.totalError = false;

		this.requesting = false;
		if (this.settings.questionAsSlides) {
			this.updateSlides();
		}
	}

	// Asigna las preguntas y respuestas guardadas localmente al ámbito actual
	setLocalAnswers(ambit: any) {
		this.ambitState.next(false);
		this.questionnaire.rawQuestions = ambit.questionnaire.rawQuestions;
		this.questionnaire.rawAnswers = ambit.questionnaire.rawAnswers;
		this.questionnaire.questions = ambit.questionnaire.questions;
		this.setCurrentAmbitName();
		// Debemos volver a asignar la función de validación para cada pregunta
		_.forEach(this.questionnaire.questions, (question) => {
			question.validate = this.setQuestionValidationFunction(question);
		});
		this.incompleteQuestions = [];
		// Ejecutamos la validación de cada pregunta
		_.forEach(this.questionnaire.questions, (question) => {
			this.validateQuestion(question);
		});
		this.content.resize();
		try {
			this.content.scrollToTop(500);
		} catch (e) { }
		if (this.settings.questionAsSlides) {
			this.updateSlides();
		}
	}

	// Recorremos las preguntas en busca de sus respuestas
	joinQuestionsAndAnswers() {
		let questions = [];
		// Para cada pregunta del cuestionario, buscamos su respuesta
		_.forEach(this.questionnaire.rawQuestions, (question: any) => {
			this.findQuestionAnswer(question, false, false, null);
			questions.push(question);
		});
		return questions;
	}

	// Busca la respuesta de una pregunta en particular.
	// Si esta se compone por alternativas, busca sus respuestas recursivamente.
	findQuestionAnswer(question: any, isAlternative: boolean, isSubQuestion: boolean, parentQuestion: any) {
		// Si no viene pregunta, paramos la ejecución del método
		if (!question || !question.id) return;

		if (parentQuestion) {
			question.PQQuestionnaireId = parentQuestion.cuestionario_id;
			question.PQQuestionnaireStoreId = parentQuestion.cuestionario_sucursal_id;
			question.PQTypeId = parentQuestion.tipo_id;
			question.PQId = parentQuestion.id;
			question.PQName = parentQuestion.pregunta;
			question.PQNoAplica = parentQuestion.respuesta ? parentQuestion.respuesta.no_aplica : null;

			// question.parentQuestion = parentQuestion;
		}

		question.uuid = UUID.UUID();
		question.isAlternative = isAlternative;
		question.isSubQuestion = isSubQuestion;

		/* Una pregunta usa las opciones aplica / no aplica 
		si es una pregunta raíz, tiene el flag no_aplica en 1
		y si no pertenece a los tipos archivo e incidencia */
		question.useApplies = (
			(
				!isAlternative
				&& !isSubQuestion
				&& question.no_aplica === 1
				&& !_.includes(['file', 'incidencia'], question.codigo_tipo)
			) ? true : false
		);

		// Buscamos las respuestas, la condición dependerá si es alternativa o no
		/* Lamentablemente, hay casos donde una pregunta puede tener una respuesta dividida en varias respuestas. don't ask why */
		const answers = _.filter(this.questionnaire.rawAnswers, (ans: any) => {
			return (!isAlternative ? (ans.pregunta_id === question.id) : (ans.alternativa_id === question.id));
		});

		// para la respuesta unica (?)
		const answer = { respuesta: { checked: false, data: null, foto: [], alternativa_id: null, no_aplica: 2 } };

		if (answers.length) {
			// Recorremos las respuestas para cada pregunta y las juntamos en una sola
			_.forEach(answers, (ans: any) => {
				if (ans.respuesta) {
					answer.respuesta = _.merge(answer.respuesta, ans.respuesta)
				}
			});
		}

		// Asignamos la respuesta a la pregunta
		question.respuesta = answer.respuesta;

		// Si la pregunta usa aplica / no aplica y no tiene especificada su respuesta, la inicializamos en 2
		if (question.useApplies && (!question.respuesta.no_aplica && question.respuesta.no_aplica !== 0)) {
			question.respuesta.no_aplica = 2;
		}

		// Asignamos la función que valida cada pregunta
		question.validate = this.setQuestionValidationFunction(question);

		// Lamentablemente la API no devuelve el valor checked de una alternativa,
		// por lo cual debemos investigar si la alternativa fue seleccionada.
		// El flujo para comprobar esto dependerá del tipo de la pregunta (radio o checkbox)
		if (
			isAlternative
			// PARA RADIO: Si la pregunta padre tiene respuesta y la alternitva_id de la respuesta
			// es la misma que la alternativa (question) que entra por parámetro, decimos que la alternativa está seleccionada
			&& (
				(
					parentQuestion.codigo_tipo === 'radio'
					&& question.respuesta.alternativa_id
					&& parentQuestion.respuesta
					&& parentQuestion.respuesta.alternativa_id
					&& parentQuestion.respuesta.alternativa_id === question.respuesta.alternativa_id
				)
				// Si la pregunta padre es de tipo checkbox, y la alternativa (question) tiene respuesta y alternativa_id
				// asumimos que está seleccionada. Esto carece de elegancia y claridad, pero así están los servicios UwU.
				|| (parentQuestion.codigo_tipo === 'check' && question.respuesta && question.respuesta.alternativa_id)
			)
		) {
			question.respuesta.checked = true;
		}

		// Si la pregunta, tiene una sub pregunta, del mismo modo, buscamos su respuesta aplicando recursividad
		if (question.subPregunta && question.subPregunta.id) {
			this.findQuestionAnswer(question.subPregunta, false, true, question);
		}

		// Si la pregunta tiene alternativas, buscamos sus respuestas
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

	// Verifica si una pregunta es la primera incompleta del arreglo,
	// si no lo és, busca recursivamente entre sus alternativas, en busca de que
	// una de sus sub preguntas sea la primera incompleta 
	isFirstQuestionIncomplete(question: any, index: number) {
		if (this.incompleteQuestions.length) {
			if (this.incompleteQuestions[0].uuid === question.uuid) {
				return index;
			}

			if (question.subPregunta) {
				if (this.incompleteQuestions[0].uuid === question.subPregunta.uuid) {
					return index;
				}
				const aux = this.isFirstQuestionIncomplete(question.subPregunta, index);
				if (aux > -1) return aux;
			}

			if (question.alternativas) {
				for (let j = 0; j < question.alternativas.length; j++) {
					let aux = this.isFirstQuestionIncomplete(question.alternativas[j], index);
					if (aux > -1) return aux;
				}
			}
			return -1;
		}

		return -1;
	}

	findNumericQuestionInvalid() {
		// parseInt(question.respuesta.data)
		const questions = _.filter(this.questionnaire.questions, (question) => {
			return question.codigo_tipo === 'num'
				&& question.valor_esperado
				&&
				(
					(_.isNumber(question.valor_esperado) ? question.valor_esperado : parseInt(question.valor_esperado))
					< (_.isNumber(question.respuesta.data) ? question.respuesta.data : parseInt(question.respuesta.data))
				);
		});

		return questions.length ? questions[0] : null;
	}

	// Muestra un cuadro de dialogo en caso de falten preguntas por contestar
	// en caso contrario, envía las respuestas directamente
	async confirmSendAnswers() {
		this.isQuestionnaireComplete = true;

		this.incompleteQuestions = [];

		for (let question of this.questionnaire.questions) {
			this.validateQuestion(question);
		}
		this.content.resize();

		if (this.verificationValues.use) {
			// verificamos que las respuetas no excedan el valor total
			if (this.verificationValues.current > this.verificationValues.total) {
				this.utilProvider.showAlert(
					'Atención',
					//`La cantidad ingresada: ${this.verificationValues.current}, supera los muebles ingresados en el sistema: ${this.verificationValues.total}. Por favor verifique las respuestas.`
					`La cantidad ingresada supera los muebles ingresados en el sistema. Por favor verifique las respuestas.`
				);
				return;
			}

			const question = this.findNumericQuestionInvalid();

			if (question) {
				this.utilProvider.showAlert(
					'Atención',
					//`La cantidad ingresada: ${question.respuesta.data}, supera los muebles ingresados en el sistema: ${question.valor_esperado}. Por favor verifique las respuestas.`
					`La cantidad ingresada supera los muebles ingresados en el sistema. Por favor verifique las respuestas.`
				);
				return;
			}
		}

		//Si esta incompleto
		if (!this.isQuestionnaireComplete && this.incompleteQuestions.length) {
			// Si el cliente usa slides para las preguntas
			// buscamos la primera pregunta incompleta y la mostramos
			if (this.settings.questionAsSlides) {
				this.slideToFirstIncomplete();
			}

			const confirm = this.alertController.create({
				title: 'Atención',
				message: 'Tienes preguntas sin responder. ¿Deseas enviar el checklist incompleto?',
				buttons: [{
					text: 'Cancelar',
					handler: () => { }
				}, {
					text: 'Enviar',
					handler: () => {
						//enviamos asi, para evitar la demora en la respuesta por si no hay internet, gps o permisos.
						this.loading = this.loadingController.create({ content: 'Enviando respuestas...' });
						this.loading.present();

						this.sendAnswers(false, false);
					}
				}]
			});
			confirm.present();

			return;

			// SI esta COMPLETO
		} else {
			// ubicacion obligatoria chekiamos permisos y gps
			if (this.ubiRequire === 1) {
				await this.checkPermissions();

				return;

				// Sino, mandamos asi
			} else {
				//enviamos asi, para evitar la demora en la respuesta por si no hay internet, gps o permisos.
				this.loading = this.loadingController.create({ content: 'Enviando respuestas...' });

				this.loading.present();

				this.currentPoss();

				setTimeout(() => this.sendAnswers(false, false), 2000);

				return;
			};
		}
	}

	// Muestra la slide con la primera pregunta incompleta
	slideToFirstIncomplete() {
		if (this.swiperElement && this.swiperElement.directiveRef) {
			// Buscamos el índice de la primera pregunta incompleta
			let questionIndex = -1;

			for (let i = 0; i < this.questionnaire.questions.length; i++) {
				let aux = this.isFirstQuestionIncomplete(this.questionnaire.questions[i], i);
				if (aux > -1) {
					questionIndex = aux;
					break;
				}
			}

			if (questionIndex > -1) {
				this.swiperElement.directiveRef.setIndex(questionIndex);
			} else {
				this.swiperElement.directiveRef.setIndex(0);
			}
			try {
				this.content.scrollToTop(500);
			} catch (e) { }
		}
	}

	// Envía las respuestas al servidor :Promise<Boolean>
	async sendAnswers(leavingAmbit: boolean, useAuxAmbit: boolean) {
		let body = ChecklistsProvider.getRequestBody(this.questionnaire.questions, (
			!useAuxAmbit ? this.selectedAmbitId : this.auxAmbitId
		), this.checklist.id, null, this.currentUbi.latitude, this.currentUbi.longitude);

		await this.requestProvider.post(checklistConfig.endpoints.newApi.post.sendAnswers, body, true)
			.then(async (response: any) => {
				if (response && response.status === true) {
					this.events.publish('sent-answers');
					await this.checklistsProvider.removeAnswersByAmbitAndChecklistId((
						!useAuxAmbit ? this.selectedAmbitId : this.auxAmbitId
					), this.checklist.id);
					this.ambitState.next(false);
					this.utilProvider.showToast(response.message, 3000);
					if (this.checklistState) {
						this.checklistState.next(true);
					}
				} else {
					this.utilProvider.logError(JSON.stringify(response), 'CH01', globalConfig.version);
					this.utilProvider.showAlert('Ups!', 'No se han enviado tus respuestas. Pero descuida, están almacenadas y las enviaremos más tarde por tí.');
					this.checklistsProvider.saveAnswers(this.questionnaire, this.checklist.id, (
						!useAuxAmbit ? this.selectedAmbitId : this.auxAmbitId
					), null, this.currentUbi.latitude, this.currentUbi.longitude);
					this.ambitState.next(false);
				}
			})
			.catch((error: any) => {
				this.utilProvider.logError(JSON.stringify(error), 'CH02', globalConfig.version);
				this.utilProvider.showAlert('Ups!', 'No se han enviado tus respuestas. Pero descuida, están almacenadas y las enviaremos más tarde por tí.');
				this.checklistsProvider.saveAnswers(this.questionnaire, this.checklist.id, (
					!useAuxAmbit ? this.selectedAmbitId : this.auxAmbitId
				), null, this.currentUbi.latitude, this.currentUbi.longitude);
				this.ambitState.next(false);
			});
		if (!leavingAmbit) this.goToNextAmbit();

		this.loading.dismiss();
		return true;
	}

	// Viaja hasta el siguiente ámbito
	goToNextAmbit() {
		// Buscamos el índice del ámbito actual en el arreglo de ámbitos
		let currentAmbitIndex = _.findIndex(this.ambits, { id: this.selectedAmbitId });

		// Si lo encontramos, buscamos al siguiente ámbito incompleto
		if (currentAmbitIndex > -1) {
			let nextAmbit = null;
			// Nos aseguramos de no usar un índice que sobrepase el arreglo
			if ((currentAmbitIndex + 1) <= this.ambits.length) {
				for (let index = (currentAmbitIndex + 1); index < this.ambits.length; index++) {
					if (this.ambits[index].pendientes > 0) {
						nextAmbit = this.ambits[index];
						break;
					}
				}
				// Si lo encontramos, cargamos sus preguntas
				if (nextAmbit) {
					this.selectedAmbitId = nextAmbit.id;
					this.auxAmbitId = _.cloneDeep(this.selectedAmbitId);

					this.publishDataAmbit();

					this.changeAmbit();
					return;
				}
			}
		}
		this.navCtrl.pop();
	}

	// Efectua la validación de preguntas, alternativas y sub-preguntas
	validateQuestion(question) {
		if (this.checklist && (this.checklist.estado_id === 4 || this.checklist.fromStatistics)) return;

		// Verificamos que la pregunta tenga su función de validación
		if (!question.validate) {
			question.validate = this.setQuestionValidationFunction(question);
		}

		let validations = question.validate(question);
		question.validations = validations;

		if (validations.isIncomplete || validations.missingRequiredPhoto || validations.appliesUnspecified) {
			this.isQuestionnaireComplete = false;

			// Si la pregunta está incompleta, buscamos la información para mostrar al usuario
			if (question.isAlternative) {
				if (question.respuesta && question.respuesta.checked === true) {
					this.incompleteQuestions.push(this.getValidationInformation(question));
				}
			} else {
				this.incompleteQuestions.push(this.getValidationInformation(question));
			}
		}

		// Validamos cada alternativa seleccionada de la pregunta (si es que tiene)
		if (question.alternativas && question.alternativas.length) {
			for (let alternative of question.alternativas) {
				if (alternative.respuesta && alternative.respuesta.checked === true) {
					this.validateQuestion(alternative);
				}
			}
		}

		// Hacemos lo mismo para la sub-pregunta de la pregunta (si es que tiene)
		if (question.subPregunta && question.subPregunta.id) {
			this.validateQuestion(question.subPregunta);
		}
	}

	// Asigna a una pregunta su función de validación
	setQuestionValidationFunction(question: any) {
		let validate: Function = null;

		// Si la pregunta tiene alternativas, asignamos sus funciones de validación
		if ((_.includes(['check', 'radio'], question.codigo_tipo)) && question.alternativas && question.alternativas.length) {
			_.forEach(question.alternativas, (alternative: any) => {
				// Cada alternativa pasa a ser una pregunta
				alternative.validate = this.setQuestionValidationFunction(alternative);
			});
		}

		// Si la pregunta, tiene una sub pregunta, del mismo modo asignamos su función de validación
		if (question.subPregunta && question.subPregunta.id) {
			question.validate = this.setQuestionValidationFunction(question.subPregunta);
		}

		// TIPO NUMERICO
		/* Para preguntas de alguno de estos tipos ['text', 'num', 'correo', 'fecha', 'porcentual'] */
		if (_.includes(this.onlyDataQuestionTypes, question.codigo_tipo)) {
			validate = (qst) => {
				let response = { isIncomplete: false, missingRequiredPhoto: false, appliesUnspecified: false };

				// Si la pregunta es una alternativa (acción)
				if (qst.isAlternative === true && qst.obligatorio === false) {
					return response;
				}

				// Si la pregunta usa aplica / no aplica
				if (qst.useApplies === true) {
					// Si se selccionó no aplica ('1') decimos que está completa
					if (qst.respuesta.no_aplica === 1) {
						return response;
					}
					// Si no se ha seleccionado una opción ('2') decimos que está incompleta
					if (qst.respuesta.no_aplica === 2) {
						response.appliesUnspecified = true;
						return response;
					}
					/* A esta altura, sabemos que la pregunta aplica así que siguen las validaciones normales */
				}

				/* 				// Si la respuesta no existe o está vacía decimos que la pregunta está incompleta (0 se incluye como respuesta válida)
								if (!qst.respuesta || (!qst.respuesta.data && qst.respuesta.data !== 0)) {
									response.isIncomplete = true;
								}
				 */
				// si la pregunta viene asociado a un mueble que no existe en la sucursal las preguntas con null estan respondidas
				if (!_.isNull(qst.pregunta_mueble_id) && _.isNull(qst.mueble_id) && _.isNull(qst.valor_esperado) && _.isNull(qst.respuesta.data)) {
					response.isIncomplete = false;
				} else if (!qst.respuesta || (!qst.respuesta.data && qst.respuesta.data !== 0)) {
					response.isIncomplete = true;
				}

				// Si la pregunta requiere de una foto obligatoria y no se ha agregado
				// decimos que la acción de foto obligatoria está incompleta
				if (qst.obligatorio && qst.obligatorio.foto === true) {
					if (!qst.respuesta || !qst.respuesta.obligatorio || !qst.respuesta.obligatorio.foto) {
						response.missingRequiredPhoto = true;
					}
				}

				// Si la pregunta es de tipo porcentual su valor no puede exceder el 100%, para CVEcuador
				if (qst.codigo_tipo === 'porcentual') {
					if (qst.respuesta.data > 100) {
						response.isIncomplete = true;
					}
				}

				return response;
			};
			return validate;
		}

		/* Para preguntas de tipo radiobutton */
		if (question.codigo_tipo === 'radio') {
			validate = (qst) => {
				let response = { isIncomplete: false, missingRequiredPhoto: false, appliesUnspecified: false };

				// Si la pregunta usa aplica / no aplica
				if (qst.useApplies === true) {
					// Si se selccionó no aplica ('1') decimos que está completa
					if (qst.respuesta.no_aplica === 1) {
						return response;
					}
					// Si no se ha seleccionado una opción ('2') decimos que está incompleta
					if (qst.respuesta.no_aplica === 2) {
						response.appliesUnspecified = true;
						return response;
					}
					/* A esta altura, sabemos que la pregunta aplica así que siguen las validaciones normales */
				}

				// Si no tenemos respuesta o la respuesta no cuenta con una alternativa
				// decimos que la pregunta está incompleta
				if (!qst.respuesta || !qst.respuesta.alternativa_id) {
					response.isIncomplete = true;
				}
				// Si la pregunta requiere de una foto obligatoria y no se ha agregado
				// decimos que la acción de foto obligatoria está incompleta
				if (qst.obligatorio && qst.obligatorio.foto === true) {
					if (!qst.respuesta || !qst.respuesta.obligatorio || !qst.respuesta.obligatorio.foto) {
						response.missingRequiredPhoto = true;
					}
				}

				return response;
			};
			return validate;
		}

		/* Para preguntas de tipo checkbox */
		if (question.codigo_tipo === 'check') {
			validate = (qst) => {
				let response = { isIncomplete: false, missingRequiredPhoto: false, appliesUnspecified: false };
				let isAtLeastOneAlternativeChecked: boolean = false;

				// Si la pregunta usa aplica / no aplica
				if (qst.useApplies === true) {
					// Si se selccionó no aplica ('1') decimos que está completa
					if (qst.respuesta.no_aplica === 1) {
						return response;
					}
					// Si no se ha seleccionado una opción ('2') decimos que está incompleta
					if (qst.respuesta.no_aplica === 2) {
						response.appliesUnspecified = true;
						return response;
					}
					/* A esta altura, sabemos que la pregunta aplica así que siguen las validaciones normales */
				}

				// Recorremos las alternativas en busca de una que haya sido seleccionada
				for (let alt of qst.alternativas) {
					if (alt.respuesta && alt.respuesta.checked === true) {
						isAtLeastOneAlternativeChecked = true;
						break;
					}
				}
				// Si ninguna fue seleccionada, decimos que la pregunta está incompleta
				if (!isAtLeastOneAlternativeChecked) {
					response.isIncomplete = true;
				}
				// Si la pregunta requiere de una foto obligatoria y no se ha agregado
				// decimos que la acción de foto obligatoria está incompleta
				if (qst.obligatorio && qst.obligatorio.foto === true) {
					if (!qst.respuesta || !qst.respuesta.obligatorio || !qst.respuesta.obligatorio.foto) {
						response.missingRequiredPhoto = true;
					}
				}

				return response;
			};

			return validate;
		}

		/* Para preguntas de tipo foto */
		if (question.codigo_tipo === 'cam') {
			validate = (qst) => {
				let response = { isIncomplete: false, missingRequiredPhoto: false, appliesUnspecified: false };

				// Si la pregunta es una alternativa (acción)
				if (qst.isAlternative === true && qst.obligatorio === false) {
					return response;
				}

				// Si la pregunta usa aplica / no aplica
				if (qst.useApplies === true) {
					// Si se selccionó no aplica ('1') decimos que está completa
					if (qst.respuesta.no_aplica === 1) {
						return response;
					}
					// Si no se ha seleccionado una opción ('2') decimos que está incompleta
					if (qst.respuesta.no_aplica === 2) {
						response.appliesUnspecified = true;
						return response;
					}
					/* A esta altura, sabemos que la pregunta aplica así que siguen las validaciones normales */
				}

				if (qst.multi_foto === 1) {
					// Si el arrego de fotos está vacío, decimos que la pregunta está incompleta
					if (!qst.respuesta || !qst.respuesta.foto || !qst.respuesta.foto.length) {
						response.isIncomplete = true;
					}
				} else {
					// Si no se ha agregado una fotografía, decimos que la pregunta está incompleta
					if (!qst.respuesta || !question.respuesta.data) {
						response.isIncomplete = true;
					}
				}

				// Si la pregunta requiere de una foto obligatoria y no se ha agregado
				// decimos que la acción de foto obligatoria está incompleta
				if (qst.obligatorio && qst.obligatorio.foto === true) {
					if (!qst.respuesta || !qst.respuesta.obligatorio || !qst.respuesta.obligatorio.foto) {
						response.missingRequiredPhoto = true;
					}
				}

				return response;
			};
			return validate;
		}

		/* Para todos los otros casos */
		validate = (qst) => {
			let response = { isIncomplete: false, missingRequiredPhoto: false, appliesUnspecified: false };

			// Si la pregunta usa aplica / no aplica
			if (qst.useApplies === true) {
				// Si se selccionó no aplica ('1') decimos que está completa
				if (qst.respuesta.no_aplica === 1) {
					return response;
				}
				// Si no se ha seleccionado una opción ('2') decimos que está incompleta
				if (qst.respuesta.no_aplica === 2) {
					response.appliesUnspecified = true;
					return response;
				}
			}

			if (qst.comentario === 1 && !qst.respuesta.comentario) {
				response.isIncomplete = true;
			}

			return response;
		};
		return validate;
	}

	// Muestra un action sheet con dos opciones de navegación
	showVisitActionSheet() {
		const actionSheet = this.actionSheetController.create({
			buttons: [
				{
					text: 'Inicio',
					handler: () => {
						this.navCtrl.popToRoot();
					}
				}, {
					text: 'Históricos',
					handler: () => {
						this.navCtrl.push(ChecklistHistoricalComponent, { type: this.branchOfficeId ? 2 : 1 });
					}
				}
			]
		});
		actionSheet.present();
	}

	// Retorna la información de cada pregunta obligatoria pendiente
	getValidationInformation(question: any) {
		let result = {
			questionId: question.id,
			title: question.isAlternative ? question.texto : question.pregunta,
			messages: [],
			uuid: question.uuid
		};
		if (question.validations) {
			if (question.validations.appliesUnspecified === true) {
				result.messages.push('Debes indicar si esta preguna aplica o no.');
			} else {
				if (question.validations.missingRequiredPhoto === true) {
					result.messages.push('Debes adjuntar la fotografía obligatoria.');
				}
				if (question.validations.isIncomplete === true) {
					if (question.codigo_tipo === 'cam') {
						result.messages.push((question.multi_foto === 1 ? 'Debes adjuntar al menos una fotografía.' : 'Debes adjuntar una fotografía.'));
					}
					else if (_.includes(this.onlyDataQuestionTypes, question.codigo_tipo)) {
						result.messages.push('Debes completar el campo de esta pregunta.');
					}
					else if (question.codigo_tipo === 'check') {
						result.messages.push('Debes seleccionar al menos una alternativa.');
					}
					else if (question.codigo_tipo === 'radio') {
						result.messages.push('Debes seleccionar una alternativa.');
					}
				}
			}
		}
		return result;
	}

	// Muestra un modal con la información de las preguntas incompletas
	showIncompleteQuestions() {
		const modal = this.modalController.create(IncompleteQuestionsComponent, { questions: this.incompleteQuestions });
		modal.present();
		modal.onDidDismiss((data: any) => {
			// Si al cerrar el modal, viene el parámetro elementId
			// mostramos la slide que tiene ese elementId
			if (data && data.elementId) {
				this.slideOrScrollToQuestion(data.elementId);
			}
		});
	}

	// Viaja hasta el siguiente ámbito
	showNextAmbit() {
		if (this.isNextAmbit) {
			let currentAmbitIndex = _.findIndex(this.ambits, (ambit) => {
				return ambit.id === this.selectedAmbitId;
			});
			this.selectedAmbitId = this.ambits[currentAmbitIndex + 1].id;
			this.auxAmbitId = _.cloneDeep(this.selectedAmbitId);

			this.publishDataAmbit();

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
			this.auxAmbitId = _.cloneDeep(this.selectedAmbitId);

			this.publishDataAmbit();

			this.changeAmbit();
		}
	}

	// Busca recursivamente el índice de una pregunta a partir del uuid que entra por parámetro
	findQuestionIndexByUuid(question: any, uuid: string, index: number) {
		let response = -1;

		if (question.uuid === uuid) {
			return index;
		}

		if (_.includes(['check', 'radio'], question.codigo_tipo)) {
			for (let i = 0; i < question.alternativas.length; i++) {
				let aux = this.findQuestionIndexByUuid(question.alternativas[i], uuid, index);
				if (aux > -1) {
					response = index;
					break;
				}
			}
		}

		if (response < 0 && question.subPregunta) {
			let aux = this.findQuestionIndexByUuid(question.subPregunta, uuid, index);
			if (aux > -1) {
				response = index;
			}
		}

		return response;
	}

	toggleQuestionView() {
		this.settings.questionAsSlides = !this.settings.questionAsSlides;
	}

	async checkPermissions() {
		let permissions = await this.utilProvider.getPermissionsStatuses();
		let gps = await this.utilProvider.checkGpsEnabled();

		let permiso = permissions[0]

		// si no tengo permisos
		if (permiso.status == "DENIED") {
			this.currentPoss();

			setTimeout(() => this.checkPermissions(), 1000);
			//this.checkPermissions()
			return;

			// si ya tengo permisos
		} else if (gps == false) {
			this.turnOnGPS();
			return;

		} else {
			this.loading = this.loadingController.create({ content: 'Enviando respuestas...' });
			this.loading.present();

			await this.currentPoss();

			// this.sendAnswers( false, false );
			setTimeout(() => this.sendAnswers(false, false), 2000);
			return;
		}
	}

	async turnOnGPS() {
		try {
			await this.locationAccuracy.canRequest()
				.then(async (canRequest: boolean) => {
					if (canRequest) {
						await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
							async () => {
								return;
							}, error => {
								this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
								return;
							}
						);
						setTimeout(() => this.checkPermissions(), 1000);
					} else {
						this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
						return;
					}
				})
				.catch((error) => { try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} catch (e) {
			this.utilProvider.showAlert('Atención', 'No hemos podido encender tu GPS, por favor actívelo manualmente.');
			return;
		}
	}

	async currentPoss() {
		const options: GeolocationOptions = { timeout: 15000, enableHighAccuracy: false, maximumAge: 100 };

		/* El timeout del plugin geolocation no está funcionando correctamente,
		por lo cual, implementamos un timeout custom */
		const promise = new Promise((resolve, reject) => {

			// Timeout custom, si la ubicación no la obtenemos después de x segundos, rechazamos la promesa
			const timer = setTimeout(() => {
				clearTimeout(timer);
				reject({ error: 'Custom timeout error.', code: 3 });
			}, options.timeout)

			// Solicitamos la ubicación actual
			this.geolocation
				.getCurrentPosition(options)
				.then((response: any) => {
					clearTimeout(timer);
					try {
						resolve({
							latitude: response.coords.latitude,
							longitude: response.coords.longitude,
						});
					} catch (e) {
						reject(e);
					}
				})
				.catch((error: any) => {
					try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
					clearTimeout(timer);
					reject(error);
				});
		});

		await promise
			.then((response: any) => {
				this.currentUbi = response;

				this.publishDataAmbit();
			})
			.catch(async (error) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				if (error && error.code === 3) {
					return;
				}
			});

		return;
	}

	/**
	 * Scrollea o viaja al slide que contenga la pregunta
	 * con el uuid que entra por parámetro 
	 * @param uuid 
	 */
	slideOrScrollToQuestion(uuid: string) {
		if (this.settings.questionAsSlides) {

			// Índice del slide que contiene la pregunta incompleta
			let questionIndex = -1;

			for (let i = 0; i < this.questionnaire.questions.length; i++) {
				let aux = this.findQuestionIndexByUuid(this.questionnaire.questions[i], uuid, i);
				if (aux > -1) {
					questionIndex = aux;
					break;
				}
			}

			if (questionIndex > -1 && this.swiperElement && this.swiperElement.directiveRef) {
				this.swiperElement.directiveRef.setIndex(questionIndex);
				try {
					this.content.scrollToTop(500);
				} catch (e) { }
			}
			return;
		}

		let element = document.getElementById(uuid);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	/**
	 * Recibe una pregunta, si esta tiene referencia a una pregunta principal,
	 * valida q su respuesta cumpla con el operador de la referencia.
	 * 
	 * También busca las posibles preguntas que pueden tener a esta pregunta como referencia
	 * y valida que cada una de ellas cumpla con el operador
	 * @param data 
	 */
	validateReference(data: any) {
		if (data && data.question) {

			// Condición que indica si esta preguta tiene una referencia
			if (data.question.referencia && (data.question.respuesta.data || data.question.respuesta.data === 0)) {

				// Para continuar, debemos encontrar la pregunta principal
				const mainQuestion = _.find(this.questionnaire.questions, (qn: any) => {
					return qn.id === data.question.referencia.pregunta_id;
				});

				if (mainQuestion) {

					const alert = this.alertController.create({
						title: 'Atención!',
						buttons: [{
							text: 'Atrás'
						}]
					});

					// Si la pregunta principal aún no se responde, informamos al usuario y borramos la respuesta ingresada
					if (!mainQuestion.respuesta.data && mainQuestion.respuesta.data != '0') {
						data.question.respuesta.data = null;
						alert.setSubTitle(`Antes de responder esta pregunta, responde la pregunta "${mainQuestion.pregunta}".`);
						alert.addButton({
							text: 'Ver',
							handler: () => {
								this.slideOrScrollToQuestion(mainQuestion.uuid);
							}
						});
						alert.present();
						return;
					}

					/**
					 * En esta etapa debemos evaluar con el operador de la referencia
					 * 
					 * Los operadores son:
					 * 
					 * >, >=, <, <=, =
					 * 
					 * También nos aseguramos de que el operador que viene desde la API exista
					 */


					else if (
						operators[data.question.referencia.operador.simbolo] &&
						!operators[data.question.referencia.operador.simbolo](data.question.respuesta.data, mainQuestion.respuesta.data)
					) {

						const input = _.cloneDeep(data.question.respuesta.data);
						data.question.respuesta.data = null;

						alert.setSubTitle(`La cantidad ingresada (${input}) debe ser ${data.question.referencia.operador.mensaje} a la cantidad de la pregunta principal (${mainQuestion.respuesta.data}).`);
						alert.addButton({
							text: 'OK',
							handler: () => { }
						});
						alert.present();
					}
				}
			}

			// Ciclo que busca preguntas que tengan como referencia a esta pregunta
			const questionReferences: any[] = _.filter(this.questionnaire.questions, (qn: any) => {
				return qn.codigo_tipo === 'num'
					&& qn.respuesta
					&& qn.respuesta.data
					&& qn.referencia
					&& qn.referencia.pregunta_id === data.question.id;
			});

			if (questionReferences.length) {

				const alert = this.alertController.create({
					title: 'Atención!',
					buttons: [{
						text: 'OK'
					}]
				});

				// Si el usuario borró la respuesta de la referencia,
				// reiniciamos los valores de las preguntas q la usan como referencia
				if (!data.question.respuesta.data && data.question.respuesta.data != '0') {
					const referencesCount: number = questionReferences.length;

					questionReferences.forEach((qn: any) => {
						qn.respuesta.data = null;
					});

					alert.setSubTitle(`${referencesCount} pregunta(s) dependen de la respuesta que eliminaste y sus valores han sido reiniciados.`);
					alert.present();
					return;
				}

				// Si no, armamos un arreglo con las preguntas que no cumplen con el nuevo valor según el operador de la referencia
				const questionsOperatorFailed: any[] = [];

				questionReferences.forEach((qn: any) => {
					if (!operators[qn.referencia.operador.simbolo](qn.respuesta.data, data.question.respuesta.data)) {
						questionsOperatorFailed.push(qn);
					}
				});

				const failedReferencesCount: number = questionsOperatorFailed.length;

				if (failedReferencesCount) {
					alert.setSubTitle(`${failedReferencesCount} pregunta(s) no cumplen con la condición de su pregunta principal y sus valores han sido reiniciados.`);
					alert.present();

					questionsOperatorFailed.forEach((qn: any) => {
						qn.respuesta.data = null;
					});
				}
			}
		}
	}

	publishDataAmbit() {
		try {
			QuestionnaireComponent.ambitId = this.selectedAmbitId;
			QuestionnaireComponent.position = this.currentUbi;
		} catch (e) {

		}
	}
}

const operators = {
	'>': (a: any, b: any): boolean => { return parseFloat(a) > parseFloat(b) },
	'>=': (a: any, b: any): boolean => { return parseFloat(a) >= parseFloat(b) },
	'<': (a: any, b: any): boolean => { return parseFloat(a) < parseFloat(b) },
	'<=': (a: any, b: any): boolean => { return parseFloat(a) <= parseFloat(b) },
	'=': (a: any, b: any): boolean => { return parseFloat(a) === parseFloat(b) }
};