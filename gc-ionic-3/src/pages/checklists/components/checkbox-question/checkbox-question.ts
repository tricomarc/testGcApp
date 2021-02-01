import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';

@Component({
	selector: 'checkbox-question',
	templateUrl: 'checkbox-question.html'
})
export class CheckboxQuestionComponent {

	@Input() question;
	@Input() checklist;
	@Input() ambitState: BehaviorSubject<boolean>;
	private coments: any = [];
	
	constructor() { }

	ngOnInit() { 
		_.forEach( this.question.alternativas, ( alt: any ) => {
			if( (alt.comentario === 1 || alt.comentario === 2) ){
				this.coments.push( { id: alt.id, comentario: alt.respuesta.comentario } );
			}
		} );
	}

	// Asigna el valor true al atributo checked de la alternativa
	onSelect( alternative: any ) {
		this.ambitState.next(true);
		
		alternative.respuesta.checked = !alternative.respuesta.checked;

		if (this.question.useApplies === true) {
			// Debemos conservar la selección de aplica / no aplica que tiene la respuesta de la pregunta
			alternative.respuesta.no_aplica = ((this.question.respuesta.no_aplica > -1 && this.question.respuesta.no_aplica < 3) ? this.question.respuesta.no_aplica : 2);
		}

		if (this.question.validate) {
			this.question.validations = this.question.validate(this.question);
		}
	}

	onChange( alternative: any, coment: any ){
		this.ambitState.next( true );
		
		alternative.respuesta.comentario = coment;
		
		this.question.respuesta = alternative.respuesta;
	}
}

