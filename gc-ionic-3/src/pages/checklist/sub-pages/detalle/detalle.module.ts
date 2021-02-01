import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetallePage } from './detalle';
import { PreguntasChecklistPageModule } from '../../components/preguntas-checklist-directive/preguntas-checklist.module';
import { PipesModule } from '../../../../pipes/pipes.module'
import { SwiperModule } from 'ngx-swiper-wrapper';

@NgModule({
    declarations: [
        DetallePage,
    ],
    imports: [
        PreguntasChecklistPageModule,
        IonicPageModule.forChild(DetallePage),
        PipesModule,
        SwiperModule
    ],
    exports: [
        PreguntasChecklistPageModule],
})
export class DetallePageModule {

}
