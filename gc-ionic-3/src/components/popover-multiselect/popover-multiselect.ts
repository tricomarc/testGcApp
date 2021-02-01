import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';


@Component({
  selector: 'popover-multiselect',
  templateUrl: 'popover-multiselect.html'
})
export class PopoverMultiselectComponent {


  items: Array<any> = [];

  constructor(private nav: NavParams, private viewCtrl: ViewController) {
    this.items = nav.get('items');
  }

  dismiss(){
    this.viewCtrl.dismiss({items: this.items});
  }

}
