import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { LoginPage } from '../../login/login';
import * as _ from 'lodash';

@IonicPage()
@Component({
  selector: 'page-security-question',
  templateUrl: 'security-question.html',
})
export class SecurityQuestionPage {

  birthdate: string = null;
  dni: string = null;
  userId: string = '';
  alternatives: any[] = [];

  showPassword: boolean = false;
  password_rules: string = null;
  form = {
    clave: '',
    confirmacion: ''
  };

  constructor(public navCtrl: NavController, 
    private request: RequestProvider,
    private loading: LoadingController,
    private util: UtilProvider,
    public navParams: NavParams) {
  }

  ionViewWillEnter() {
    this.showPassword = false;
    this.userId = this.navParams.get('userId');
    this.alternatives = this.navParams.get('alternatives');

  }


  async recoverPass(){
    // Validar campos
    if(_.isArray(this.alternatives) && this.alternatives.indexOf('birthdate') !== -1){
      if(!this.birthdate){
        this.util.showAlert('Atención','Debe ingresar fecha de nacimiento.');
        return;
      }
    }

    if(_.isArray(this.alternatives) && this.alternatives.indexOf('dni') !== -1){
      if(!this.dni){
        this.util.showAlert('Atención','Debe ingresar DNI.');
        return;
      }
    }

    const loading = this.loading.create({});
    loading.present();
    try {
      
      const body = {
        "usuarioId": this.userId,
        "type": "verification",
        "dni": this.dni,
        "fecha_nacimiento": this.birthdate
      };

      const response: any = await this.request.recoverPasswordMicroService('/auth/recover/password', body);
      loading.dismiss();

      if(!response['status']){
        this.util.showAlert('Atención', response['message']);
        return;
      }


      if(response['data']['isValid'] === true){
        this.showPassword = true;
        this.password_rules = response['data']['message'];
        return;
      }


      this.util.showAlert('Atención', response.message);

    } catch (error) {
      loading.dismiss();

    }
  }


  async changePassword(){
    
    if(this.form.clave !== this.form.confirmacion){
      this.util.showAlert('Atención', 'Las claves ingresadas no coinciden.');
      this.form.clave = '';
      this.form.confirmacion = '';
      return;
    }

    const loading = this.loading.create({ content: 'Actualizando contraseña'});
    loading.present();

    try {
      const body = {
        "usuarioId": this.userId,
        "type": "recover",
        "nueva_contrasena": this.form.clave,
        "confirma_contrasena": this.form.confirmacion
      }
      const response: any = await this.request.recoverPasswordMicroService('/auth/recover/password', body);
      loading.dismiss();

      if(!response['status']){
        this.util.showAlert('Atención', response.message);
        return;
      }

      const message = response['message'] || 'Clave actualizada correctamente!.';

      this.util.showAlert('Atención', message);
      this.navCtrl.setRoot(LoginPage);
      
    } catch (error) {
      console.log(error);
      loading.dismiss();
    }




  }


}
