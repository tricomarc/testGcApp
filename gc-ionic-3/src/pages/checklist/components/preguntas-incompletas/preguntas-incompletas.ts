import {Component, Input} from '@angular/core';
import * as _ from 'lodash';

import { NavParams, ViewController } from 'ionic-angular';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Generated class for the PorcentajeChecklistDirectiveComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'preguntas-incompletas',
  templateUrl: 'preguntas-incompletas.html'
})
export class PreguntasIncompletasComponent {

    private preguntas = [];
    private showListInstead: boolean = false;

    constructor(private navParams: NavParams, private viewController: ViewController) {}

    ngOnInit() {
    	this.preguntas = this.navParams.data.preguntas;
        this.showListInstead = this.navParams.data.showListInstead;
    }

    closeModal() {
    	this.viewController.dismiss();
    }

    showQuestion(question: any) {
        this.viewController.dismiss({ question: question });
    }
}
