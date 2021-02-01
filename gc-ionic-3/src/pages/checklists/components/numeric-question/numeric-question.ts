import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject, Subscription } from 'rxjs';
import { Events } from 'ionic-angular';

import * as _ from 'lodash';

@Component({
	selector: 'numeric-question',
	templateUrl: 'numeric-question.html'
})
export class NumericQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;

	public keyUp = new Subject<number>();
	public keyUpSubscription: Subscription;

	private error: boolean = false;

	constructor(private events: Events) { }

	ngOnInit() {
		if (this.question.valor_esperado === '0') {
			this.question.respuesta.data = 0;
		}

		if (!_.isNull(this.question.pregunta_mueble_id) && _.isNull(this.question.mueble_id) && _.isNull(this.question.valor_esperado)) {
			this.question.respuesta.data = null;
		}

		this.keyUpSubscription = this.keyUp
			.map(value => (<HTMLInputElement>event.target).value)
			.debounceTime(300)
			.subscribe((input: string) => {
				this.question.respuesta.data = parseFloat(input);
				this.onChange();
			});
	}

	ngOnDestroy() {
		try {
			this.keyUpSubscription.unsubscribe();
		} catch (e) { }
	}

	onChange() {

		this.events.publish('VALIDATE_REFERENCE', { question: this.question });

		this.question.respuesta.data = _.round( this.question.respuesta.data );

		// Los valores numéricos solo deben ser mayores a 0
		try {
			if (isNaN(this.question.respuesta.data)) {
				this.question.respuesta.data = null;

			} else if (this.question.respuesta.data < 0) {
				this.question.respuesta.data = 0;
			}

			if (this.question.pregunta_mueble_id) {
				// si la respuesta es mayor al total
				// validacion unitaria
				if ((parseInt(this.question.respuesta.data) > parseInt(this.question.valor_esperado))) {
					// mostramos un error
					this.error = true;

					// sacamos el error si borra la respuesta
				} else if (this.question.respuesta.data === "") {
					this.error = false;

					// el error no se muestra si la respuesta es menor o igual al valor esperado
				} else if ((parseInt(this.question.respuesta.data) <= parseInt(this.question.valor_esperado))) {
					this.error = false;
				};
			}
		} catch (e) {
			this.question.respuesta.data = 0;
		}

		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}

		this.ambitState.next(true);
	}

	// resta
	decreaseAnswer() {
		this.question.respuesta.data = this.question.respuesta.data - 1;

		this.events.publish('VALIDATE_REFERENCE', { question: this.question });

		// Los valores numéricos solo deben ser mayores a 0
		try {
			if (isNaN(this.question.respuesta.data)) {
				this.question.respuesta.data = 0;

			} else if (this.question.respuesta.data < 0) {
				this.question.respuesta.data = 0;
			}

			if (this.question.pregunta_mueble_id) {
				// si la respuesta es mayor al total
				// validacion unitaria
				if ((parseInt(this.question.respuesta.data) > parseInt(this.question.valor_esperado))) {
					// mostramos un error
					this.error = true;

					// sacamos el error si borra la respuesta
				} else if (this.question.respuesta.data === "") {
					this.error = false;

					// el error no se muestra si la respuesta es menor o igual al valor esperado
				} else if ((parseInt(this.question.respuesta.data) <= parseInt(this.question.valor_esperado))) {
					this.error = false;
				};
			}
		} catch (e) {
			this.question.respuesta.data = 0;
		}

		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}

		this.ambitState.next(true);
	}

	// suma
	increaseAnswer() {
		this.question.respuesta.data = ((this.question.respuesta.data || this.question.respuesta.data == '0') ? (parseInt(this.question.respuesta.data) + 1) : 0);

		this.events.publish('VALIDATE_REFERENCE', { question: this.question });

		// Los valores numéricos solo deben ser mayores a 0
		try {
			if (isNaN(this.question.respuesta.data)) {
				this.question.respuesta.data = 0;

			} else if (this.question.respuesta.data < 0) {
				this.question.respuesta.data = 0;
			}

			if (this.question.pregunta_mueble_id) {
				// si la respuesta es mayor al total
				// validacion unitaria
				if ((parseInt(this.question.respuesta.data) > parseInt(this.question.valor_esperado))) {
					// mostramos un error
					this.error = true;

					// sacamos el error si borra la respuesta
				} else if (this.question.respuesta.data === "") {
					this.error = false;

					// el error no se muestra si la respuesta es menor o igual al valor esperado
				} else if ((parseInt(this.question.respuesta.data) <= parseInt(this.question.valor_esperado))) {
					this.error = false;
				};
			}
		} catch (e) {
			this.question.respuesta.data = 0;
		}

		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}

		this.ambitState.next(true);

	}
}
