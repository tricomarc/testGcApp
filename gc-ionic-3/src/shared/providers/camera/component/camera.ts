import { Component } from '@angular/core';
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions
} from '@ionic-native/camera-preview';
import { Events, NavController, NavParams, Platform, ViewController } from 'ionic-angular';
import { UtilProvider } from '../../util/util';

@Component({
  selector: 'camera',
  templateUrl: 'camera.html'
})
export class CameraComponent {

  private cameraConfig = {
    flash: false,
    zoom: {
      on: false,
      max: 10,
      min: 0,
      set: 0
    },
    image: {
      width: 700,
      height: 700,
      quality: 70
    }
  }

  private cameraOpts: CameraPreviewOptions = {
    x: 0,
    y: 0,
    camera: 'rear',
    width: window.innerWidth,
    height: 700,
    toBack: true
  };

  public picture: string = null;
  public callback: any;
  constructor(
    private cameraPreview: CameraPreview,
    private navParams: NavParams,
    private events: Events,
    private platform: Platform,
    private util: UtilProvider,
    private viewCtrl: ViewController) {
    const image       = this.navParams.get('image');
    const default_img = this.cameraConfig.image;
    if(image){
      this.cameraConfig.image = {
        width:   image.width && parseInt(image.width) || default_img.width,
        height:  image.height && parseInt(image.height) || default_img.height,
        quality: image.quality && parseInt(image.quality) || default_img.quality
      }

      console.log(this.cameraConfig);
    }
  }

  ionViewWillEnter() {
    this.events.publish('CAMERA-BACKGROUND', { view: 'CAMERA' });
  }

  ionViewDidEnter() {
    this.callback = this.navParams.get('callback');
  }

  ngOnDestroy(){
    this.events.publish('CAMERA-BACKGROUND', { view: 'CONTENT' });
    if(this.platform.is('cordova')){
      this.cameraPreview.stopCamera();
    }
  }

  async ionViewDidLoad() {
    if(this.platform.is('cordova')){
      this.startCamera();
    }else {
      this.picture = 'data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==';
      this.util.showToast('Aplicacion ejecutandose en browser.', 2000);
    }
  }

  async startCamera() {
    this.picture = null;
    await this.cameraPreview.startCamera(this.cameraOpts);
  }


  /**
   * Captura la imagen
   */
  async takePicture() {
    const cameraPictureOpts: CameraPreviewPictureOptions = {
      width: this.cameraConfig.image.width,
      height: this.cameraConfig.image.height,
      quality: this.cameraConfig.image.quality
    };

    // this.picture = 'https://picsum.photos/375/812';
    await this.cameraPreview
      .takePicture(cameraPictureOpts)
      .then((image_data) => { this.picture = `data:image/jpeg;base64,${image_data}`; this.setParams() })
      .catch((err) => {
        console.log(err);

      })
    await this.cameraPreview.stopCamera();
  }

  /**
   * activa/desactiva el flash
   */
  async onFlash() {
    const torch_state = this.cameraConfig.flash ? 'off' : 'torch';
    try {
      this.cameraPreview.setFlashMode(torch_state);
      this.cameraConfig.flash = !this.cameraConfig.flash;
    } catch (error) { }
  }

  /**
   * Cambia el nivel del zoom
   */
  onChangeZoom() {
    try {
      this.cameraPreview.setZoom(this.cameraConfig.zoom.set);
    } catch (error) { };
  }

  /**
   * Muestra/Oculta la barra de zoom
   */
  zoomBar() {
    this.cameraConfig.zoom.on = !this.cameraConfig.zoom.on;
  }

  /**
   * aprueba la imagen
   */
  ok() {
    // this.callback({ image: this.picture }).then(() => {
    //   this.navCtrl.pop();
    // })
    this.viewCtrl.dismiss({ image: this.picture });

  }

  cancel(){
    if(this.platform.is('cordova')){ this.startCamera(); }
    else{ this.back(); }
  }

  /**
   * Regresa a la pagina
   */
  back() {
    this.viewCtrl.dismiss({ foo: 'bar' });
    // this.navCtrl.pop();

  }

  setParams(){
    this.cameraPreview.setFlashMode('off');
    this.cameraConfig.zoom.set = this.cameraConfig.zoom.min;
  }


}
