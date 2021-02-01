import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Proveedores
import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

// Componentes
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';

// Configuración
import { config } from './visual-zonal-detail.config';

// Configuración global
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-visual-zonal-detail',
    templateUrl: 'visual-zonal-detail.html',
})

export class VisualZonalDetailPage {

    private visual: any = null;
    private visual_id: any = null;
    private optionalImplementations: any = [];
    private locked_buttons: boolean = false;
    private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(private navCtrl: NavController,
        private navParams: NavParams,
        private modal: ModalController,
        private browser: InAppBrowser,
        private util: UtilProvider,
        private request: RequestProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'VisualZonalDetailVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualZonalDetail', 'Visual' );

        if (!this.navParams.data.visual_id) {
            this.util.showAlert("Atención", "Reporte inválido, falta información");
            this.navCtrl.pop();
            return;
        }
        this.visual_id = this.navParams.data.visual_id;
        this.visual = await this.getVisualDetail(false);
    }

    // Abre un modal el cual muestra la foto que entra por parámetro
    openPhotoViewer(photo: any, type: string, is_video: boolean, reference: any, evaluated: boolean) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let modal = this.modal.create(PhotoViewerComponent, { photo: photo, type: type, is_video: is_video, reference: reference, evaluated: evaluated });
        modal.present();
    }

    // Muestra una alerta con el motivo de no implementación
    showNoImplementationReason(reason: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let template = ('<p><b>' + reason.nombre + '</b><br>' + (reason.comentario ? reason.comentario : '') + '</p>');
        this.util.showAlert('Motivo', template);
    }

    // Bloqueamos los botones por 1.5 segundos
    blockButtons() {
        this.locked_buttons = true;
        setTimeout(() => {
            this.locked_buttons = false;
        }, 1500);
    }

    // Trae el detalle de un visual
    async getVisualDetail(isRefresh: boolean) {
        let visual = null;
        if (!isRefresh) this.requesting = true;
        await this.request
            .get((config.endpoints.newApi.get.detail + '?visual_id=' + this.visual_id), true)
            .then((response: any) => {
                if (!response || !response.data || response.data.length < 1) this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la campaña');
                else visual = response.data;
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No ha sido posible obtener el detalle de la campaña');
            });
        this.requesting = false;
        return visual;
    }

    // Actualiza el detalle del visual
    async refreshVisualDetail(refresher: any) {
        this.visual = await this.getVisualDetail(true);
        refresher.complete();
    }

    // Descarga un archivo
    downloadFile(file: any) {
        let options: InAppBrowserOptions = { location: 'no', };
        let browser = this.browser.create(file.url, '_system', options);
    }
}