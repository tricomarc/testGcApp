import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, NavParams } from 'ionic-angular';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { InAppBrowserOptions, InAppBrowser } from '@ionic-native/in-app-browser';
import { config } from '../../files.config';

@Component({
    selector: 'mecanic-folder',
    templateUrl: 'mecanic-folder.html',
})

export class MecanicFolderComponent {

    private requesting: boolean = false;
    private view: string = 'awards';
    private awards: any[] = [];
    private files: any[] = [];
    private session: any = null;
    private from: string = null;
    private to: string = null;

    // Constructor
    constructor(private navCtrl: NavController,
        private loading: LoadingController,
        private navParams: NavParams,
        private browser: InAppBrowser,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider) {
    }

    async ionViewDidLoad() {

        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);

        this.from = this.util.getFormatedDate(from);
        this.to = this.util.getFormatedDate(to);

        this.session = await this.sessionProvider.getSession();
        const response = await this.getAwards(null);
        this.awards = response.awards;
        this.files = response.files;
    }

    async refreshFolders(event: any) {
        const response = await this.getAwards(event);
        this.awards = response.awards;
        this.files = response.files;
    }

    async getAwards(event: any): Promise<any> {
        if (!event) this.requesting = true;
        const response = await this.request.post('/comunicados/comunicados', this.getBodyAwardsRequest(), true)
            .then((result: any) => {
                if (result.data && result.data.comunicados) {
                    return {
                        awards: result.data.comunicados,
                        files: result.data.archivos ? result.data.archivos : []
                    };
                }
                return [];
            })
            .catch((error) => {
                this.util.showToast('No ha sido posible cargar los premios.', 3000);
                return { awards: [], files: [] };
            });
        if (event) event.complete();
        this.requesting = false;
        return response;
    }

    showAward(award: any) {
        this.navCtrl.push('DetailsModalPage', {
            comunicado: award
        });
    }

    getBodyAwardsRequest() {
        return {
            usuario_id: this.session.usuario.id,
            session_id: this.session.sessionid,
            uuid: null,
            tipo_id: [13],
            fecha_inicio: this.from,
            fecha_fin: this.to
        }
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
                result = false;
				this.util.showAlert('Atención', 'No ha sido posible dercargar el archivo, intente nuevamente.');
			});
		return result;
	}
}