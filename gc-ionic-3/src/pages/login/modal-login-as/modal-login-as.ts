import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-modal-login-as',
  templateUrl: 'modal-login-as.html',
})
export class ModalLoginAsPage {

  selectedItem: string = null;
  constructor(public navCtrl: NavController,
      private viewCtrl: ViewController,
      public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ModalLoginAsPage');
  }

  dismiss(item){
    this.viewCtrl.dismiss({selected: item});
  }

}
