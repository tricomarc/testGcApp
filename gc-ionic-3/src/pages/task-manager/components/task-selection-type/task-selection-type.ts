import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';


@Component({
  selector: 'task-selection-type',
  templateUrl: 'task-selection-type.html'
})
export class TaskSelectionTypeComponent {

  text: string;
  selection: string;
  constructor(private viewCtrl: ViewController) {

  }

  changeSelection(type: string){
    if(type === 'NUMERICA'){
      this.selection = 'NUMERICA';
    }else {
      this.selection = 'SIMPLE';
    }

    setTimeout(() => {
      this.viewCtrl.dismiss({type});
    }, 70)
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
