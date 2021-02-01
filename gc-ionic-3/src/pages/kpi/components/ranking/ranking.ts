import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ViewController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

// Configuración del componente
import { config } from './ranking.config'
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@Component({
	selector: 'page-ranking',
	templateUrl: 'ranking.html',
	providers: []
})

export class RankingKpiPage {

	private categories: any = [];
	private ranking: any = null;
	private form: any = {
		request_id: null, // Filtro a consultar (categoría o indicador)
		type: null, // Categoría o indicador
		value: null
	};

	private selected_filter: any = null;

	private charge: any = null;
	private session: any = null;

	private requesting: boolean = false;

	// diccionario
	private sucursal: string;

	// Constructor
	constructor(private navCtrl: NavController,
		private navParams: NavParams,
		private modal: ModalController,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
		private dictionary: DictionaryProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	ionViewDidLoad() {
		this.getInitData(false);
	}

	// Obtiene los datos iniciales para el controlador
	async getInitData(refreshing) {
		if (!refreshing) this.requesting = true;

		// Obtenemos el cargo y sesión del usuario para filtrar el ranking

		let temp = await this.getChargeAndSession();

		if (!temp || !temp.charge || temp.session) {
			this.charge = temp.charge;
			this.session = temp.session;
			if (!this.charge || !this.session) {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información del ranking, falta información del usuario.');
				if (!refreshing) this.requesting = false;
				return;
			}
		}

		this.charge = temp.charge;
		this.session = temp.session;

		await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursal = dictionary['Sucursal']
		} );

		// Si el usuario es cargo sucursal, asignamos al request_id a la primera sucursal (NO DEBERÍA TENER MÁS DE 1)
		if (this.charge === 'sucursal') {
			if (!this.session.sucursales || !this.session.sucursales.length) {
				this.util.showAlert('Alerta', 'No tiene una sucursal asociada.');
				this.requesting = false;
				return;
			}
			this.form.request_id = this.session.sucursales[0];
		} else if (this.charge === 'zona') {
			// Si el zonal no tiene zona paramos la ejecución de este método
			if (!this.session.zona_id) {
				this.util.showAlert('Alerta', 'No tiene una zona asociada.');
				this.requesting = false;
				return;
			}
			// Si tiene zona, asignamos como primer request_id la id de su zona
			this.form.request_id = this.session.zona_id;
		}

		this.categories = await this.getCategories();

		// Si obtenemos categorías desde el servicio y venimos con filtros
		// Iniciamos la vista con el filtro correspondiente
		if (this.categories && this.categories.data && this.categories.data.length) {
			if (this.navParams.data.filters.type === 'indicador' && this.navParams.data.filters.value) {
				let indicator = null;
				// Recorremos las categorías, y luego buscamos el indicador filtrado
				for (let index = 0; index < this.categories.data.length; index++) {
					let temp_indicator = _.find(this.categories.data[index].indicadores, {
						nombre: this.navParams.data.filters.value
					});
					if (temp_indicator) {
						indicator = temp_indicator;
						break;
					}
				}
				if (indicator) {
					this.form.type = 'indicador';
					this.form.value = indicator.id;
					this.selected_filter = indicator;
				}
			} else if (this.navParams.data.filters.type === 'categoria' && this.navParams.data.filters.value) {
				let category = _.find(this.categories.data, {
					id: this.navParams.data.filters.value
				});
				if (category) {
					this.form.type = 'categoria';
					this.form.value = this.navParams.data.filters.value;

					this.selected_filter = category;
				}
			}
		}

		this.ranking = await this.getRanking();

		if (!refreshing) this.requesting = false;
		return true;
	}

	// Retorna los parámetros para filtrar el ranking
	getQueryParams() {
		let params: string = '?tipo=' + this.charge;

		if (this.charge !== 'pais') {
			params += '&dataId=' + this.form.request_id;
		}

		if (this.form.value) {
			params += '&flag=' + this.form.type;
			params += '&flagId=' + this.form.value;
		}

		return params;
	}

	// Retorna el cargo del usuario actual y obtiene la sesión
	async getChargeAndSession() {
		let result = {
			charge: null,
			session: null
		};
		await this.sessionProvider
			.getSession()
			.then((response: any) => {
				result.session = response.usuario;
				result.charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'sucursal' : (response.usuario.jerarquia < 100 ? 'zona' : 'pais'));
			})
			.catch((error: any) => {
				this.util.showAlert('Alerta', 'No ha sido posible verificar su cargo, intente nuevamente.');
			});
		return result;
	}

	// Retorna la lista de categorías
	async getCategories() {
		let categories = null;

		await this.request
			.get(config.endpoints.newApi.get.categories, true)
			.then((response: any) => {
				if (response && response.data) {
					categories = response.data;
				} else {
					this.util.showAlert('Alerta', 'No ha sido posible obtener la lista de categorías.');
				}
			})
			.catch((error) => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la lista de categorías.');
			});
		return categories;
	}

	// Retorna el ranking actual
	async getRanking() {
		let ranking = null;

		await this.request
			.get(config.endpoints.newApi.get.ranking + this.getQueryParams(), true)
			.then((response: any) => {
				if (response && response.data && response.data.data && response.data.data.rankingSucursales.data) {
					for(let index = 0; index < response.data.data.rankingSucursales.data.length; index++) {
						if(response.data.data.rankingSucursales.data[index].desviacion < 0) {
							response.data.data.rankingSucursales.data[index].show_line = true;
							break;
						}
					}
					ranking = response.data;
				}
			})
			.catch((error) => {
				this.util.showAlert('Alerta', 'No ha sido posible obtener la información del ranking.');
			});
		return ranking;
	}

	// Actualiza los datos de la vista
	async refreshRanking(refresher) {
		await this.getInitData(true);
		refresher.complete();
	}

	// Filtra el ranking por un indicador o categoría
	filterRanking = async (filter, type) => {
		this.requesting = true;

		if (filter.nombre === 'General') {
			this.selected_filter = null;
			this.form.type = null;
			this.form.value = null;
		} else {
			this.selected_filter = filter;
			this.form.type = type;
			this.form.value = filter.id;
		}

		this.ranking = await this.getRanking();

		this.requesting = false;
	}

	// Muestra un modal con los filtros
	showFilters() {
		let modal = this.modal.create(Filter, { categories: this.categories });
		modal.present();
		modal.onDidDismiss((data) => {
			if (data.type && data.filter) {
				this.filterRanking(data.filter, data.type);
			}
		});
	}
}


// Clase para llamar a los filtros
@Component({
	selector: 'page-ranking',
	templateUrl: 'filter-ranking.html'
})
export class Filter {
	private categories: any = [];

	constructor(private navParams: NavParams,
		private viewCtrl: ViewController) { }

	// Método que se ejecuta cuando carga la vista
	ionViewDidLoad() {
		this.categories = this.navParams.data.categories;
	}

	// Selecciona un filtro y lo devuelve a la vista principal
	selectFilter(type, filter) {
		this.viewCtrl.dismiss({ type: type, filter: filter });
	}

	// Cierra el modal
	dismissModal() {
		this.viewCtrl.dismiss({ type: null, filter: null });
	}
}
