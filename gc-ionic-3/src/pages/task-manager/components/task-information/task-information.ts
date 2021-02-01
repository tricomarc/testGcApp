import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Events, ModalController } from 'ionic-angular';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { IInfoForm } from '../../models/info-form.interface';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { Periodicity } from '../../models/periodicity.class';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { globalConfig } from '../../../../config';
import { Camera, CameraOptions } from "@ionic-native/camera";

import * as _ from 'lodash';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-information',
  templateUrl: 'task-information.html',
})
export class TaskInformationComponent {

  private periodicities: Periodicity[] = [];

  private form: IInfoForm = {
    descripcion: null,
    dias: '',
    evidencia: false,
    nombre: null,
    periodicidad_id: null,
    usuario_id: null,
    comentario: ''
  };

  private loading: boolean = false;
  private typeTask: string;
  private questions: any[] = [];
  private view = null;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private utilProvider: UtilProvider,
    private modal: ModalController,
    private requestProvider: RequestProvider,
    private camera: Camera,
    private camaraProvider: CameraProvider,
    private loadingController: LoadingController,
    private cameraProvider: CameraProvider,
    private events: Events) {
  }

  ionViewWillEnter() {
    this.typeTask = this.navParams.get('type');
  }

  async ionViewDidLoad() {
    if (SessionProvider.state.value && SessionProvider.state.value.userId) {
      this.form.usuario_id = parseInt(SessionProvider.state.value.userId);
    }

    // this.loading = true;
    // this.periodicities = await this.getPeriodicities();
    // this.loading = false;
  }

  async getPeriodicities(): Promise<Periodicity[]> {
    const periodicities: Periodicity[] = await this.requestProvider.
      getMicroService('/task/periodicities')
      .then((response: any) => {
        if (response && response.code == 200 && _.isArray(response.data)) {
          return response.data.map((p: any) => Periodicity.parse(p));
        }
        this.utilProvider.showToast('No ha sido posible obtener la lista de periodicidades.', 3000);
        this.utilProvider.logError(JSON.stringify(response), 'TM01', globalConfig.version);
        return [];
      })
      .catch((error) => {
        this.utilProvider.showToast('No ha sido posible obtener la lista de periodicidades.', 3000);
        this.utilProvider.logError(JSON.stringify(error), 'TM02', globalConfig.version);
        return [];
      })
    return periodicities;
  }

  async create() {

    let body: any;

    if (!this.form.nombre) {
      this.utilProvider.showToast('Ingrese un nombre para la tarea', 3000);
      return;
    }
    

    if (this.typeTask === 'NUMERICA') {

      if (!this.questions || this.questions.length === 0) {
        this.utilProvider.showToast('Debes ingresar al menos una pregunta.', 3000);
        return;
      }

      let canContinue = true;
      for (let question of this.questions) {
        if (question.isDisabled || !question.text || question.text.length < 3) canContinue = false;
      }
      if (!canContinue) {
        this.utilProvider.showToast('Una o mas preguntas no se encuentran completas.', 3000);
        return;
      }

      // Continue
      body = this.form;
      body['tipo'] = "NUMERICA";
      
      console.log(this.questions);
      let questions = this.questions.reduce((acc, question) => { 
        acc.push({ nombre: question.text, imagenReferencia: question.image }); return acc; }, []);

      body['preguntas'] = questions;
 
    } else {
      // SIMPLE
      body = this.form;
      body['tipo'] = "SIMPLE";
    }
    
    // if (!this.form.periodicidad_id) {
    //   this.utilProvider.showToast('Debes seleccionar una periodicidad.', 3000);
    //   return;
    // }


    const loading = this.loadingController.create({ content: 'Creando tarea' });
    loading.present();

    await this.requestProvider.postMicroService('/task/create_task', this.form)
      .then((response: any) => {
        this.utilProvider.showToast(response.message, 3000);
        this.navCtrl.popToRoot();
        this.events.publish('TASK_CREATED');
      })
      .catch((data: any) => {
        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible crear la tarea, intente nuevamente.');
        this.utilProvider.logError(JSON.stringify(data), 'TM03', globalConfig.version);
      });

    loading.dismiss();

  }

  async addImage(id: number){
    const index = _.findIndex(this.questions, { id });

    const photoOptions: CameraOptions = {
      targetHeight: 700,
      targetWidth: 700,
      quality: 90,
      sourceType: 0,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: false
    }; 
    const imageBase64 = await this.cameraProvider.getPhoto(photoOptions, globalConfig.isBrowser, globalConfig.version)

    if(!imageBase64){
      this.utilProvider.showToast('No se logro abrir la imagen.', 3000);
      return;
    }

    this.questions[index].isDisabled = true;
    const imageUrl = await this.uploadImage(imageBase64);
    if(!imageUrl){
      this.utilProvider.showToast('No se logro subir la imagen.', 3000);
      this.questions[index].isDisabled = false;
      return;
    }


    this.questions[index].image = imageUrl;
    this.questions[index].isDisabled = false;

  }

  async getImageCamera(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // this.view = 'CAMERA';
        const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full' });
        modal.present();
        modal.onDidDismiss((data) => {
          // this.view = 'CONTENT';
          const image = data && data.image || null;
          return resolve(image);
        });

      } catch (error) {
        return resolve(null);
      }
    })
  }


  async uploadImage(base64: any){
    return new Promise((resolve, reject) => {
      const body = {
        name: 'TM_createTask_imagenReferencia',
        base64: base64.toString()
      }
      console.log(body);
      this.requestProvider.postMicroService('/task/upload/image', body)
        .then((response: any) => { 
          if(response.code == 200){
            return resolve(response.data.url)
          }else 
            return resolve(null);
        })
        .catch((err) => {
          console.log(err);
          return resolve(null);
        })
    })
  }


  removeImage(id: number){
    const index = _.findIndex(this.questions, { id });
    this.questions[index].image = null;
  }


  addQuestion(){
    let canContinue = true;
    for(let question of this.questions){
      if(!question.text || question.text.length < 3) canContinue = false;
    }
    if(!canContinue){
      this.utilProvider.showAlert('Atención', 'Debes completar el campo de pregunta.');
      return;
    }
    this.questions.push({ id: this.randomNumber(), text: null, image: null, isDisabled: false });
  }

  remove(id: number) {
    const alert = this.utilProvider
      .showConfirmAlert('Atención', '¿Estas seguro de eliminar la pregunta?');

    alert.onDidDismiss((confirm) => {
      if (confirm) {
        _.remove(this.questions, { id });
      }
    });
    alert.present();

  }

  randomNumber(){
    return Math.floor(Math.random() * 10000);
  }



}
