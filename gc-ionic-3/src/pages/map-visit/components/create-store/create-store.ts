import { Component } from '@angular/core';
import { NativeGeocoder, NativeGeocoderReverseResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder';
import { ViewController, NavParams, LoadingController } from 'ionic-angular';
import {Validators, FormBuilder, FormGroup } from '@angular/forms';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { SessionProvider } from '../../../../shared/providers/session/session';

@Component({
  selector: 'create-store',
  templateUrl: 'create-store.html'
})
export class CreateStoreComponent {

  text: string;

  formStore: FormGroup;
  geoReverse: any = {
    name: '',
    code: '',
    street: '',
    number: '',
    country: '',
    region: '',
    commune: '', 
    city: '',
    latitude: '',
    longitude: ''
  }
  update_stores: boolean = false;
  constructor(
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder ,
    private navParams: NavParams,
    private request: RequestProvider,
    private utilProvider: UtilProvider,
    private session: SessionProvider,
    private loading: LoadingController,
    private nativeGeocoder: NativeGeocoder) {
      this.formStore = this.formBuilder.group({
        name:   ['', Validators.required],
        code:   [''],
        street: ['', Validators.required],
        number: ['', Validators.required]
      })
  }



  ionViewDidEnter(){
    const coords: any = this.navParams.get('position');
    this.getReverse(coords.latitude, coords.longitude);
  }

  create(){
    const form = this.formStore.value;

    this.geoReverse.name   = form.name.toString();
    this.geoReverse.code   = form.code && form.code.toString() || null;
    this.geoReverse.street = form.street.toString();
    this.geoReverse.number = form.number.toString();


    this.createStore(this.geoReverse);

  }

  async createStore(store: any){
    const session: any = await this.session.getSession();
    const zonaId = session.usuario.zona_id;
    store['zona_id'] = zonaId;

    const loading = this.loading.create({ content: 'Creando sucursal' });
    loading.present();

    this.request.postMicroService('/checkstore/create/store', store)
      .then((result: any) => {
        loading.dismiss();
        this.utilProvider.showToast(result.message, 3000);
        if(result.status){
          this.update_stores = true;
          this.formStore.reset();
          return;
        }

      })
      .catch((error) => {
        console.log(error);
        loading.dismiss();
      });
  }

  async getReverse(lat: any, lng: any){

    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    this.nativeGeocoder.reverseGeocode(lat, lng, options)
    .then((result: NativeGeocoderReverseResult[]) => { this.setParamater(result[0]) })
    .catch((error: any) => console.log(error));
    
  }


  setParamater(reverse: any){
    this.geoReverse.country = reverse.countryName;
    this.geoReverse.region  = reverse.administrativeArea
    this.geoReverse.commune = reverse.locality;
    this.geoReverse.city    = reverse.subAdministrativeArea;
    this.geoReverse.latitude = reverse.latitude.toString();
    this.geoReverse.longitude= reverse.longitude.toString();
  }
  
  closeModal(){
    this.viewCtrl.dismiss({ update: this.update_stores });
  }

}
