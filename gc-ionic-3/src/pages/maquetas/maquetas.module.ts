import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaquetasPage } from './maquetas';

import { Page1Page } from './chat/page1/page1';
import { Page2Page } from './chat/page2/page2';
import { Page3Page } from './chat/page3/page3';
import { Page4Page } from './chat/page4/page4';
import { Page5Page } from './chat/page5/page5';
import { Page6Page } from './chat/page6/page6';
import { Page7Page } from './chat/page7/page7';
import { Page8Page } from './chat/page8/page8';
import { Page9Page } from './chat/page9/page9';
import { Page10Page } from './chat/page10/page10';

@NgModule({
  declarations: [
    MaquetasPage,

    Page1Page,
    Page2Page,
    Page3Page,
    Page4Page,
   	Page5Page,
   	Page6Page,
   	Page7Page,
   	Page8Page,
   	Page9Page,
   	Page10Page
  ],
  imports: [
    IonicPageModule.forChild(MaquetasPage),
  ],
  exports: [
  	Page1Page,
    Page2Page,
    Page3Page,
    Page4Page,
   	Page5Page,
   	Page6Page,
   	Page7Page,
   	Page8Page,
   	Page9Page,
   	Page10Page
  ],
  entryComponents: [
  	Page1Page,
    Page2Page,
    Page3Page,
    Page4Page,
   	Page5Page,
   	Page6Page,
   	Page7Page,
   	Page8Page,
   	Page9Page,
   	Page10Page
  ]
})
export class MaquetasPageModule {}
