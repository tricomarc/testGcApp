import { Component } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams, ViewController } from 'ionic-angular';
import { RequestProvider } from "../../shared/providers/request/request";
import { UtilProvider } from '../../shared/providers/util/util';
import { SessionProvider } from '../../shared/providers/session/session';
import { config } from './change-password.config'
import { global } from '../../shared/config/global';
import * as _ from 'lodash';
import { globalConfig } from '../../config';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-change-password',
    templateUrl: 'change-password.html',
})
export class ChangePasswordPage {

    private form: any = {
        clave: '',
        confirmacion: '',
        clave_actual: ''
    };

    private title: string = global.title;

    private password_rules: string = '';

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private session: SessionProvider,
        private menu: MenuController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    ionViewWillEnter() {
        this.menu.enable(true, "menu");
    }

    ionViewDidLoad() {
        // TRACK DE VISTA
        this.firebaseAnalyticsProvider.trackView( 'ChangePassword' );

        this.session
            .getSession()
            .then((session: any) => {
                if (session) this.password_rules = session.usuario.reglas_password;
            })
            .catch((error: any) => { });
    }

    /**
     * Envio a API para cambio de contraseña
     * @returns {Promise<{}>}
     */
    changePassword() {
        if (!this.form.clave_actual || !this.form.clave || !this.form.confirmacion) {
            this.util.showToast('Complete todos los campos', 5000);
            return;
        }

        if (this.form.clave !== this.form.confirmacion) {
            this.util.showToast('La nueva contraseña no coincide con la confirmación', 5000);
            return;
        }

        const loading = this.loading.create({ content: 'Actualizando contraseña' });
        loading.present();

        let data: any = {};

        this.request
            .post(config.endpoints.post.changePassword, this.form, true)
            .then((response: any) => {
                loading.dismiss();
                try {
                    data = (this.util.isJson(response) ? JSON.parse(response) : response);

                    if (data && data.message === 'Clave actualizada correctamente!.') {
                        this.util.showAlert("Éxito", data.message);
                        this.form.clave = '';
                        this.form.confirmacion = '';
                        this.form.clave_actual = '';
                    } else {
                        this.util.showAlert("Atención", (data.message ? data.message : "La clave no pudo ser cambiada, por favor intente mas tarde"));
                    }
                } catch (e) {
                    this.util.showAlert("Atención", (data.message ? data.message : "La clave no pudo ser cambiada, por favor intente mas tarde"));
                }
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                loading.dismiss();
                this.util.showAlert("Atención", (data.message ? data.message : "La clave no pudo ser cambiada, por favor intente mas tarde"));
            });
    }

    /**
     * Cierra vista actual
     */
    public closeModal() {
        this.viewCtrl.dismiss();
    }
}
