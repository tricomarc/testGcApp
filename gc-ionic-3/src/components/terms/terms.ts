import { Component } from '@angular/core';

import { find, findIndex } from 'lodash';
import { Events, LoadingController, NavController } from 'ionic-angular';
import { UtilProvider } from '../../shared/providers/util/util';
import { RequestProvider } from '../../shared/providers/request/request';
import { SessionProvider } from '../../shared/providers/session/session';
import { Item } from '../../shared/models/item.class';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { LoginPage } from '../../pages/login/login';

@Component({
	selector: 'terms',
	templateUrl: 'terms.html'
})
export class TermsComponent {

	private currentItem: Item = null;
	private currentItemId: number = null;
	private zoomValue: number = 1;

	private items: Item[] = [];

	constructor(
		private loadingController: LoadingController,
		private events: Events,
		private inAppBrowser: InAppBrowser,
		private navController: NavController,
		private utilProvider: UtilProvider,
		private requestProvider: RequestProvider,
		private sessionProvider: SessionProvider
	) { }

	ionViewDidLoad() {
		try {
			this.items = SessionProvider.state.value.terms;

			if (this.items.length) {
				this.currentItem = this.items[0];
				this.currentItemId = this.items[0].id;
			}

		} catch (e) { }
	}

	openFile() {
		const options: InAppBrowserOptions = { location: 'no', };
		const browser = this.inAppBrowser.create(this.currentItem.src, '_system', options);
	}

	onItemChange(itemId: number) {
		if (itemId === this.currentItemId) return;
		const currentItem = find(this.items, { id: itemId });
		if (currentItem) {
			this.currentItem = currentItem;
			this.currentItemId = itemId;
		}
	}

	async setItemValue(accepted: boolean) {
		const body = {
			legales: [{
				legal_id: this.currentItemId,
				estado: accepted
			}]
		};

		const loading = this.loadingController.create({
			content: `Aceptando ${this.currentItem.title}`
		});

		loading.present();

		this.requestProvider.post('/usuarios/legal', body, true)
			.then(async (response: any) => {
				if (response.status) {
					this.currentItem.accepted = true;
					await this.sessionProvider.resetSessionWithTermUpdate({
						id: this.currentItemId,
						accepted: accepted
					});
					this.setNextItem();
					loading.dismiss();
					return;
				}
				loading.dismiss();
				this.utilProvider.showAlert('Atención', response.message ? response.message : `No ha sido posible aceptar el ítem "${this.currentItem.title}". Intente nuevamente.`)
			})
			.catch((error: any) => {
				loading.dismiss();
				this.utilProvider.showAlert('Atención', `No ha sido posible aceptar el ítem "${this.currentItem.title}". Intente nuevamente.`)
			});

	}

	setNextItem() {
		const nextItem: Item = find(this.items, (item: Item) => {
			return !item.accepted && item.required && item.id !== this.currentItemId;
		});

		if (nextItem) {
			this.currentItem = nextItem;
			this.currentItemId = nextItem.id;
			return;
		}

		this.events.publish('TERMS_FINISHED');
	}

	close() {
		this.navController.setRoot(LoginPage);
		UtilProvider.menuIntent = 0;
		this.sessionProvider.removeSession();
		this.navController.setRoot(LoginPage);
	}

	showInfo() {
		this.utilProvider.showAlert('Atención', 'Es necesario que acepte todos los términos y condiciones para usar la aplicación.');
	}

	zoomIn() {
		this.zoomValue += 0.25;
	}

	zoomOut() {
		this.zoomValue -= 0.25;
	}
}

/**
 * Manejar el ancho
 * Opción cerrar
 * Info texto
 */