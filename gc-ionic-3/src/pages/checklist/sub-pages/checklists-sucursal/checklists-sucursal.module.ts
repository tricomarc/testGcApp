import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ChecklistsSucursalPage } from './checklists-sucursal';

@NgModule({
  declarations: [
    ChecklistsSucursalPage,
  ],
  imports: [
    IonicPageModule.forChild(ChecklistsSucursalPage),
  ],
})
export class ChecklistsSucursalPageModule {}
