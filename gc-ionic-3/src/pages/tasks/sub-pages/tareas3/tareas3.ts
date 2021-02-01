import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    Slides
} from 'ionic-angular';
import {global} from '../../../../shared/config/global'
import {UtilProvider} from "../../../../shared/providers/util/util";

/**
 * Generated class for the FinalizadasPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'tareas3',
    templateUrl: 'tareas3.html',
})
export class Tareas3Page {

    @ViewChild(Content) content: Content;

    visita_id = null;
    checklist: {};
    ready:boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams) {
    }

}
