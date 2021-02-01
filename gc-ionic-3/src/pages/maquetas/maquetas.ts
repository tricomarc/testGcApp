import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { Page1Page } from './chat/page1/page1';
import { Page2Page } from './chat/page2/page2';
import { Page3Page } from './chat/page3/page3';
import { Page4Page } from './chat/page4/page4';
import { Page5Page } from './chat/page5/page5';
import { Page6Page } from './chat/page6/page6';
import { Page7Page } from './chat/page7/page7';
import { Page8Page } from './chat/page8/page8';
import { Page9Page } from './chat/page9/page9';
import { Page10Page } from './chat/page10/page10';

@IonicPage()
@Component({
	selector: 'page-maquetas',
	templateUrl: 'maquetas.html',
})
export class MaquetasPage {

	private pages: any = [];

	constructor(public navCtrl: NavController) { }

	ionViewDidLoad() {
		this.pages = [{
			title: 'Página 1',
			page: Page1Page
		}, {
			title: 'Página 2',
			page: Page2Page
		}, {
			title: 'Página 3',
			page: Page3Page
		}, {
			title: 'Página 4',
			page: Page4Page
		}, {
			title: 'Página 5',
			page: Page5Page
		}, {
			title: 'Página 6',
			page: Page6Page
		}, {
			title: 'Página 7',
			page: Page7Page
		}, {
			title: 'Página 8',
			page: Page8Page
		}, {
			title: 'Página 9',
			page: Page9Page
		}, {
			title: 'Página 10',
			page: Page10Page
		}];
	}

	navigate(page: any) {
		this.navCtrl.push(page);
	}
}
