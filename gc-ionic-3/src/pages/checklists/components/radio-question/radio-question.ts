import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';

@Component({
	selector: 'radio-question',
	templateUrl: 'radio-question.html'
})
export class RadioQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;
	private comentario: string = "";

	constructor() { }

	ngOnInit() {
		let respuesta = this.question.respuesta;

		this.comentario = respuesta.comentario;
	}

	// Asigna el valor true al atributo checked de la alternativa
	onSelect( alternative: any ) {
		this.ambitState.next( true );

		alternative.respuesta.checked = true;
		
		alternative.respuesta.alternativa_id = alternative.id;

		if( alternative.respuesta.comentario ){
			this.comentario = alternative.respuesta.comentario;
		}else{
			this.comentario = "";
		}

		// Para todas las otras alternativas, reiniciamos sus respuestas
		_.forEach( this.question.alternativas, ( alt: any ) => {
			if ( alt.id !== alternative.id ) {
				alt.respuesta = { checked: false, data: null, foto: [], alternativa_id: null, no_aplica: 2, comentario: alt.respuesta.comentario };
			}
		});

		if ( this.question.useApplies === true ) {
			// Debemos conservar la selección de aplica / no aplica que tiene la respuesta de la pregunta
			alternative.respuesta.no_aplica = ( ( this.question.respuesta.no_aplica > -1 && this.question.respuesta.no_aplica < 3 ) ? this.question.respuesta.no_aplica : 2 );
		}

		this.question.respuesta = alternative.respuesta;

		if ( this.question.validate ) {
			this.question.validations = this.question.validate( this.question );
		}
	}

	onChange( alternative: any ){
		this.ambitState.next( true );
		
		alternative.respuesta.comentario = this.comentario;
		
		this.question.respuesta = alternative.respuesta;
	}
}



