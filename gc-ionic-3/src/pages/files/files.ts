import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, NavParams } from 'ionic-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';
import { SessionProvider } from '../../shared/providers/session/session';

// Configuración del componente
import { config } from './files.config';

// Configuración global
import { global } from '../../shared/config/global';
import { globalConfig } from '../../config';
import { MecanicFolderComponent } from './components/mecanic-folder/mecanic-folder';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
	selector: 'page-files',
	templateUrl: 'files.html',
})

export class FilesPage {

	// Atributos
	private directory: any = null;
	private files: any = [];
	private sub_directory_id: any = null;

	private isCustom: boolean = false;
	private customFolder: any = null;
	private level: any = null;

	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    // Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private navParams: NavParams,
		private browser: InAppBrowser,
		private request: RequestProvider,
		private util: UtilProvider,
		private session: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {

		const session: any = await this.session.getSession();

		this.isCustom = ((global.title === '+FOCO' && (!session.usuario.jerarquia || session.usuario.jerarquia < 98)) ? true : false);

		if(this.isCustom) {
			if (this.navParams.data.customFolder) {
				this.customFolder = this.navParams.data.customFolder;
				this.level = this.navParams.data.level;
				if (this.level !== 'gestion') this.sub_directory_id = 1;
				if (this.level === 'files' && this.navParams.data.path) {
					this.files =  this.findCustomFiles(this.navParams.data.path);
				}
				return;
			}
			this.customFolder = await this.getCustomFolder(null);
			this.level = 'gestion';
			return;
		}

		// track de vista
		this.firebaseAnalyticsProvider.trackUserId( '123456' );
        this.firebaseAnalyticsProvider.trackView( 'Files' );

		this.sub_directory_id = this.navParams.data.directory_id;
		if (this.sub_directory_id) {
			this.files = await this.getDirectoryFiles();
			this.directory = await this.getSubDirectory(false);
		} else this.directory = await this.getRootDirectory(false);
	}

	async getCustomFolder(isRefresh) {
		let directory: any = null;
		if (!isRefresh) this.requesting = true;
		await this.request
			.get(config.endpoints.oldApi.get.customFiles, true)
			.then((response: any) => {
				if (response && response.data) directory = response.data;
				else this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			});
		this.requesting = false;
		if(isRefresh) isRefresh.complete();
		return directory;
	}

	// Trae la carpeta raíz
	async getRootDirectory(isRefresh: boolean) {
		let directory: any = null;
		if (!isRefresh) this.requesting = true;
		await this.request
			.get(config.endpoints.oldApi.get.folders, false)
			.then((response: any) => {
				if (response && response.data) directory = response.data;
				else this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			});
		this.requesting = false;
		return directory;
	}

	// Trae una sub carpeta
	async getSubDirectory(isRefresh: boolean) {
		let directory: any = null;
		if (!isRefresh) this.requesting = true;
		await this.request
			.get((config.endpoints.oldApi.get.folders + '/' + this.sub_directory_id + '/carpetas'), false)
			.then((response: any) => {
				if (response && response.data) directory = response.data;
				else this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la información del directorio');
			});
		this.requesting = false;
		return directory;
	}

	// Trae los archivos de un directorio
	async getDirectoryFiles() {
		let files = [];
		await this.request
			.get((config.endpoints.oldApi.get.files + this.sub_directory_id + '/archivos'), false)
			.then((response: any) => {
				if (response && response.data) files = response.data;
				else this.util.showAlert('Atención', 'No ha sido posible obtener la lista de archivos, intente nuevamente');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener la lista de archivos, intente nuevamente');
			});

		// Asignamos la imágen para cada archivo según su extensión
		if (files && files.length > 0) {
			_.forEach(files, (file) => {
				let type = _.find(config.file_types, { extension: file.extension });
				if (type) file.image = type.image;
				else file.image = 'assets/img/resources/default.png';
			});
		}
		return files;
	}

	// Actualiza el directorio
	async refreshDirectory(refresher: any) {

		if(this.isCustom) { 
			if (!this.customFolder) {
				this.customFolder = await this.getCustomFolder(refresher);
			}
			refresher.complete();
			return;
		}

		if (this.sub_directory_id) {
			this.files = await this.getDirectoryFiles();
			this.directory = await this.getSubDirectory(true);
		} else this.directory = await this.getRootDirectory(true);
		refresher.complete();
	}

	// Navega hasta el contenido de una sub carpeta
	navigateToSubFolder(directory_id: any) {
		this.navCtrl.push(FilesPage, { directory_id: directory_id });
	}

	// Abre un navegador interno el cual navega hasta la ruta del archivo
	async downloadFile(file: any) {
		let check_schedule = await this.checkSchedule();
		if (!check_schedule) return;
		let options: InAppBrowserOptions = { location: 'no', };
		let browser = this.browser.create(file.path, '_system', options);
	}

	// Revisa si el horario para descargar un archivo es válido
	async checkSchedule() {
		let result = true;
		await this.request
			.put(config.endpoints.oldApi.put.check_schedule, {}, false)
			.then((response: any) => {
				if (response && response.data && response.data.codigo === 0) {
					result = false;
					this.util.showAlert('Atención', response.data.mensaje);
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				result = false;
				this.util.showAlert('Atención', 'No ha sido posible dercargar el archivo, intente nuevamente.');
			});
		return result;
	}

	navigateToCustomFolder(level: string, path: string) {
		if (path === 'mecanica') {
			this.navCtrl.push(MecanicFolderComponent);
			return;
		};
		this.navCtrl.push(FilesPage, { level: level, customFolder: this.customFolder, path: path });
	}

	findCustomFiles(path: string) {
		if (path === 'comerciales') return this.customFolder.gestion.informes.comerciales;
		if (path === 'operacionales') return this.customFolder.gestion.informes.operacionales;
		if (path === 'trade') return this.customFolder.gestion.informes.trade;
		if (path === 'avances') return this.customFolder.gestion.premios.avances;
		if (path === 'cierres') return this.customFolder.gestion.premios.cierres;
		if (path === 'metas') return this.customFolder.gestion.premios.metas;
		return [];
	}
}
