import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, Events, ModalController } from 'ionic-angular';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

import * as moment from 'moment';
import { globalConfig } from '../../../../config';
import { CameraProvider } from '../../../../shared/providers/camera/camera';
import * as _ from 'lodash';

import { Storage } from '@ionic/storage';
import { ImageViewerController } from 'ionic-img-viewer';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';
/**
 * Generated class for the TaskManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'task-resolution',
  templateUrl: 'task-resolution.html',
})
export class TaskResolutionComponent {

  private task: any = null;
  private detail: any = {};
  private timeLeft: any = null;
  private percentage: number = null;

  private img: string = null;

  private readOnly: boolean = true;

  private numeric: boolean = false;
  private answerBody: any = {};
  private answers: any = [];
  private numericAnswer: number;
  private complete: boolean = false;
  private view: string;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private loadingController: LoadingController,
    private events: Events,
    private utilProvider: UtilProvider,
    private requestProvider: RequestProvider,
    private cameraProvider: CameraProvider,
    private storage: Storage,
    private modal: ModalController,
    private imgViewer: ImageViewerController) {
  }
  
  async ionViewDidLoad() {
    this.task = this.navParams.data;

    
    if (!this.task || !this.task.asignacionId) {
      this.utilProvider.showToast('Falta información de la tarea.', 3000);
      this.navCtrl.pop();
      return;
    }


    this.readOnly = this.task.readOnly === true ? true : false;

    const loading = this.loadingController.create({
      content: 'Cargando tarea...'
    });

    loading.present();

    if( this.task.alias == 'en_proceso' ){
      // buscamos la tarea guardada
      await this.storage.get(`task-${ this.task.asignacionId }`).then( async ( response: string ) => {
        let detail: any = response;
  
        // si no encontramos traemos los detalles
        if ( detail === null ){
          await this.getTaskDetail();
          
          return;
        }else{
          let aux = JSON.parse( detail )
          
          this.detail = aux;
  
          if( this.detail.tipoTarea === "NUMERICA" ) this.numeric = true;
          else this.numeric = false;
  
          // basta con encontrar solo 1
          if( _.find( this.detail.preguntas, [ 'respuesta', null ] ) ) this.complete = false;
          else this.complete = true;
  
          return;
        }
      })
      .catch(error => { });;
    }else await this.getTaskDetail();
    
    loading.dismiss();
  }

  async getTaskDetail() {
    await this.requestProvider.getMicroService(`/task/detail?asignacionId=${this.task.asignacionId}`)
      .then((response: any) => {
        if (response.data && response.data.tarea) {
          console.log( 'RESPONSE DETAILS', response )
          this.detail = response.data.tarea;

          if (this.detail && this.detail.evidencia) {
            this.img = this.detail.evidencia;
          }

          if( this.detail.tipoTarea === "NUMERICA" ) this.numeric = true;
          else this.numeric = false;

          // basta con encontrar solo 1
          if( _.find( this.detail.preguntas, [ 'respuesta', null ] ) ) this.complete = false;
          else this.complete = true;
      
          const start = moment(response.data.tarea.inicioTarea);
          const end = moment(response.data.tarea.finTarea);
          // const actual = new Date(response.data.tarea.zonaHoraria).toString();

          const totalDuration = moment.duration(end.diff(start));
          console.log(totalDuration);
          const leftDuration = moment.duration(end.diff(moment().subtract('minutes', 4)));

          const total = totalDuration.asMinutes();
          const current = leftDuration.asMinutes();

          const diff = moment(end.diff(moment())).utc();
          let hours: number | string    = diff.hours();
          let minutes: number | string  = diff.minutes();

          hours   = hours < 10 ? '0'+hours.toString() : hours.toString();
          minutes = minutes  < 10 ? '0'+minutes.toString() : minutes.toString();

          this.timeLeft = { hours, minutes };

          if (current >= 0) {
            this.percentage = (100 - Math.round(((current * 100) / total)));
          } else {
            this.percentage = 100;
          }
        }
      })
      .catch((error: any) => {
        this.utilProvider.showToast('No fue posible obtener el detalle de la tarea.', 3000);
      });
  }

  async changeStatus(alias: string) {
    const loading = this.loadingController.create({
      content: 'Actualizando tarea...'
    });

    loading.present();

    this.answerBody = { 
      assignmentId: this.task.asignacionId,
      alias: alias,
      comentario: ''
    }
   
    if( this.numeric && ( alias == 'realizado' ) ){
      _.forEach( this.detail.preguntas, ( pregunta: any ) => {
        let answer = {
          id: pregunta.id,
          name: pregunta.nombre,
          image: pregunta.fotoAdjunta,
          answer: pregunta.respuesta 
        }
        this.answers.push( answer )
      } );

      this.answerBody.tipo = "NUMERICA"
      this.answerBody.preguntas = this.answers;
    }

    console.log( 'BODY REQUEST', this.answerBody );

    await this.requestProvider.postMicroService('/task/assigment/status', this.answerBody )
      .then(async (response: any) => {
        this.utilProvider.showToast(response.message, 3000);

        await this.getTaskDetail();

        this.events.publish('ASSIGNMENT_UPDATED');
      })
      .catch((data: any) => {
        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible responder la tarea, intente nuevamente.');
        this.utilProvider.logError(data, 'TM04', globalConfig.version);
      });

    loading.dismiss();
  }

  async getImageCamera(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.view = 'CAMERA';
        const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full' });
        modal.present();
        modal.onDidDismiss((data) => {
          this.view = 'CONTENT';
          const image = data && data.image || null;
          return resolve(image);
        });

      } catch (error) {
        return resolve(null);
      }
    })
  }

  async addImg() {

    const imageBase64 = await this.getImageCamera();
    if(!imageBase64) return;

    const loading = this.loadingController.create({
      content: 'Actualizando imagen...'
    });

    loading.present();

    this.requestProvider.postMicroService('/task/upload_image', {
      asignacionId: this.task.asignacionId,
      nombre: `evidence-${this.task.asignacionId}${moment().format('YYYY-MM-DD_HH:mm')}`,
      base64: imageBase64
    })
      .then((response: any) => {

        loading.dismiss();

        if (response && response.data && response.data.url) {
          this.img = response.data.url;

          this.utilProvider.showToast(response.message, 3000);
          return;
        }
        this.utilProvider.showToast('No fue posible subir la fotografía, intente nuevamente.', 3000);
      })
      .catch((data: any) => {

        loading.dismiss();

        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible subir la imagen, intente nuevamente.');
        this.utilProvider.logError(JSON.stringify(data), 'TM05', globalConfig.version);
      });

    // this.cameraProvider.getPhoto({}, globalConfig.isBrowser, globalConfig.version)
    //   .then((response: string) => {
        
    //   })
    //   .catch((error) => { });
  }

  rmvImg() {
    const loading = this.loadingController.create({
      content: 'Eliminando imagen...'
    });

    loading.present();

    this.requestProvider.postMicroService('/task/upload_image', {
      asignacionId: this.task.asignacionId,
      nombre: `evidence-${this.task.asignacionId}${moment().format('YYYY-MM-DD_HH:mm')}`,
      base64: null
    })
      .then((response: any) => {

        loading.dismiss();

        this.img = null;
        this.utilProvider.showToast(response.message, 3000);
      })
      .catch((data: any) => {

        loading.dismiss();

        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible eliminar la imagen, intente nuevamente.');
        this.utilProvider.logError(JSON.stringify(data), 'TM06', globalConfig.version);
      });
  }

  async addNumericImg(question: any) {

    const imageBase64 = await this.getImageCamera();
    if(!imageBase64) return;
    const loading = this.loadingController.create({
      content: 'Actualizando imagen...'
    });

    loading.present();

    let body = {
      nombre: `evidence-${this.task.asignacionId}${moment().format('YYYY-MM-DD_HH:mm')}`,
      base64: imageBase64
    }

    await this.requestProvider.postMicroService('/task/upload/image', body)
      .then((response: any) => {
        if (response && response.data && response.data.url) {
          question.fotoAdjunta = response.data.url;
          this.utilProvider.showToast(response.message, 3000);

          return;
        }
        this.utilProvider.showToast('No fue posible subir la fotografía, intente nuevamente.', 3000);
      })
      .catch((data: any) => {
        this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible subir la imagen, intente nuevamente.');
        this.utilProvider.logError(JSON.stringify(data), 'TM05', globalConfig.version);
      });

    loading.dismiss();
	}

  removeNumericImg( question: any ){
		const loading = this.loadingController.create({
			content: 'Eliminando imagen...'
		});
	  
		loading.present();
		
		let body ={
			nombre: `evidence-${ this.task.asignacionId}${moment().format( 'YYYY-MM-DD_HH:mm' ) }`,
			base64: null
		}

		this.requestProvider.postMicroService('/task/upload/image', body )
			.then( ( response: any ) => {
	  
				loading.dismiss();
		
				question.fotoAdjunta = null;
				
				this.utilProvider.showToast( response.message, 3000 );
			})
			.catch( ( data: any ) => {
				loading.dismiss();
		
				this.utilProvider.showAlert('Atención', (data && data.error && data.error.message) ? data.error.message : 'No ha sido posible eliminar la imagen, intente nuevamente.');
				
				this.utilProvider.logError( JSON.stringify( data ), 'TM06', globalConfig.version );
			} );
		
  }
  
  saveTask(){
    // salvamos en el storage del telefono
    return new Promise<void>(async (resolve, reject) => {
      if ( !this.detail ) reject();
      
			await this.storage
				.set(`task-${ this.task.asignacionId }`, JSON.stringify( this.detail ) )
				.then(async () => {
					this.utilProvider.showToast( 'Tarea guardada con éxito.', 3000);
					resolve();
				})
				.catch((error: any) => {
					reject(error);
				});
		});
  }

  numericChange( question: any){
    console.log( 'CANTIDAD', question.respuesta, this.detail, _.round( question.respuesta ) );
    
    _.round( question.respuesta )

    if( question.respuesta < 0 ) question.respuesta = 0;

    else if( question.respuesta == "-0" ) question.respuesta = 0;

    else if( question.respuesta == "" ) question.respuesta = null;

    else if( question.respuesta > 0 ) question.respuesta = _.round( question.respuesta );

    // basta con encontrar solo 1
    if( _.find( this.detail.preguntas, [ 'respuesta', null ] ) ) this.complete = false;
    else this.complete = true;
  }

  openImage(image: any) {
		const imageViewer = this.imgViewer.create( image );
		imageViewer.present();
	}
}