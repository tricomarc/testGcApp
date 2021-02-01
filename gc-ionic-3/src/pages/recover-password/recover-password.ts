import { Component } from '@angular/core';
import { IonicPage, LoadingController, NavController, ViewController, AlertController } from 'ionic-angular';

import { config } from './recover-password.config'

import { UtilProvider } from "../../shared/providers/util/util";
import { RequestProvider } from "../../shared/providers/request/request";

import * as _ from 'lodash';

import { LoginPage } from "../login/login";

import { global } from '../../shared/config/global';
import { SecurityQuestionPage } from './security-question/security-question';

@IonicPage()
@Component({
    selector: 'page-recover-password',
    templateUrl: 'recover-password.html',
})
export class RecoverPasswordPage {

    private user: string = '';

    constructor(
        public navCtrl: NavController,
        private loading: LoadingController,
        private request: RequestProvider,
        public viewCtrl: ViewController,
        private alertCtrl: AlertController,
        private util: UtilProvider) {
    }

    /**
     * Envio de datos a servicio para cambio de clave
     * @returns {Promise<{}>}
     */
    async recoverPass() {

        if (!this.user) {
            this.util.showToast('Ingrese su usuario.', 5000);
            return;
        }

        const body = { "usuario": this.user };
        const loading = this.loading.create({ });
        loading.present();

        try {
            const response = await this.request.recoverPasswordMicroService('/auth/recover/password', body);
            console.log(response);
            if(!response['status'] ){
                this.util.showAlert('Atención', response['message']);
                loading.dismiss();
                return;
            }
            loading.dismiss();

            // Recuperación por email
            if(response['data']['action'] == 'email'){
               await this.sendEmail();
                loading.dismiss();
                this.navCtrl.setRoot(LoginPage);
                return;
            }

            // Seleccionar metodo
            if(response['data']['action'] == 'choose'){
                this.chooseRecovery(response['data']['id'], response['data']['alternatives']);
                return;
            }

            this.util.showAlert('Atención', 'La clave no pudo ser cambiada, por favor intente mas tarde');

        } catch (error) {
            console.log(error);
            loading.dismiss();
        }



    }


    chooseRecovery(userId: number, alternatives: any[]) {
        let alert = this.alertCtrl.create();

        console.log(alternatives);
        if(!alternatives.some((alternative) => { return alternative === 'email'})){
            this.navCtrl.push(SecurityQuestionPage,  { userId, alternatives });
        }else {
            alert.setTitle('Seleccione método de recuperación')
    
            alert.addInput({
              type: 'radio',
              label: 'Correo',
              value: 'email',
              checked: true
            });
        
            alert.addInput({
              type: 'radio',
              label: 'Pregunta de seguridad',
              value: 'question'
            });
            
            alert.addButton('Cancelar');
            alert.addButton({
              text: 'Aceptar',
              handler: (data) => {
                console.log('Checkbox data:', data);
                if(data === 'email'){
                    this.sendEmail(true);
                    this.navCtrl.setRoot(LoginPage);
                    return;
                }
    
                if(data === 'question'){
                    this.navCtrl.push(SecurityQuestionPage,  { userId, alternatives });
                }
              }
            });
            alert.present();
        }

      }

    async sendEmail(loading?: boolean) {
        const load = this.loading.create({});
        if(loading) { load.present(); }

        try {
            const response = await this.request
                .recoveryPassword(config.endpoints.post.recovery2, { usuario: this.user })
            if(loading) { load.dismiss(); }


            this.util.showAlert("Atención", response['message']);
            this.user = '';

            return true;
        } catch (error) {
            if(loading) { load.dismiss(); }
            this.util.showAlert("Atención", "Error al recuperar la clave, por favor intente nuevamente.");
            return false
        }

    }

    /**
     * Cierra Modal Actual
     */
    public returnToLogin() {
        this.navCtrl.setRoot(LoginPage);
    }
}
