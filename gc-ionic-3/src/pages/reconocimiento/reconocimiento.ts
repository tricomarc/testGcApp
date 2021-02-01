import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { DetalleReconocimientoPage } from './sub-pages/detalle-reconocimiento/detalle-reconocimiento';

/**
 * Generated class for the ReconocimientoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
	selector: 'page-reconocimiento',
	templateUrl: 'reconocimiento.html',
})
export class ReconocimientoPage {

	constructor(public navCtrl: NavController, public navParams: NavParams) {
	}

	ionViewDidLoad() {
	}

	navegarADetalleReconocimiento() {
		this.navCtrl.push(DetalleReconocimientoPage);
	}

}
