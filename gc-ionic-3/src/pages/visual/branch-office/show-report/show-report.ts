import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Events } from 'ionic-angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import * as _ from 'lodash';

// Proveedores
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';
// Componentes
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';

// Configuración global
import { global } from '../../../../shared/config/global';
import { globalConfig } from '../../../../config';
import { config } from '../show-report/show-report.config'
import { transition } from '@angular/core/src/animation/dsl';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';
import { CameraComponent } from '../../../../shared/providers/camera/component/camera';

@IonicPage()
@Component({
    selector: 'page-show-report',
    templateUrl: 'show-report.html',
})
export class ShowReportPage {

    private visual: any = null;
    private report_id: any = null;
    private optionalImplementations: any = [];
    private locked_buttons: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private cliente: string = global.bundle_id;
    private session: any;
    private puede_corregir: boolean;
    private visual_puede_corregir: boolean;
    private view: string = null;
    constructor(private navCtrl: NavController,
        private navParams: NavParams,
        private modal: ModalController,
        private file: File,
        private fileTransfer: FileTransfer,
        private events: Events,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ShowReportVisual' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ShowReport', 'Visual' );

        if (!this.navParams.data.visual || !this.navParams.data.report_id) {
            this.util.showToast('Reporte inválido, falta información.', 3000);
            this.navCtrl.pop();
            return;
        }
        this.visual = this.navParams.data.visual;
        this.report_id = this.navParams.data.report_id;
        this.optionalImplementations = this.visual.classified_photos.optional;
        this.sessionProvider.getSession().then((response: any) => {
            this.session = response;
        });

        if( this.navParams.data.puede_corregir ) this.puede_corregir = this.navParams.data.puede_corregir;
        if( this.navParams.data.visual_puede_corregir ) this.visual_puede_corregir = this.navParams.data.visual_puede_corregir;
    }

    // Abre un modal el cual muestra la foto que entra por parámetro
    openPhotoViewer( photo: any, type: string, is_video: boolean, reference: any, evaluated: boolean ) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        const modal = this.modal.create(PhotoViewerComponent, { photo: photo, type: type, is_video: is_video, reference: reference, evaluated: evaluated });
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

    // Aumenta en 15 el scroll de un textarea
    scrollTextArea(textarea: any) {
        textarea.scrollTop = textarea.scrollTop + 15;
    }

    // Para tomar foto correctiva
    async takeCorectivePhoto( photo ){
        if(photo.implementation) {
            // tomamos foto
            let image = await this.getImage();

            const transfer: FileTransferObject = this.fileTransfer.create();
            
            // preparo opciones para foto para envío
            const options: FileUploadOptions = {
                fileKey: 'nueva_foto',
                fileName: '4.jpg',
                headers: { 'Authorization': (this.session.sessionid + '-' + this.session.usuario.id + '-local') },
                params: {
                    reporte_id: this.report_id,
                    foto_id: photo.implementation.id
                }
            };
            transfer.onProgress((response: any) => {
                if (response.lengthComputable) {
                }
            });

            // envio foto a la API
            transfer.upload( image, ( global.API_NEW + config.endpoints.foto_correctiva ), options )
                .then( ( result: any ) => {
                    let corectivePhoto = ( this.util.isJson( result.response ) ? JSON.parse( result.response ) : result.response );
                    
                    // agregamos la foto al servicio
                    photo.implementation.childs.push( { 
                        id: corectivePhoto.data.id, 
                        parent_id: photo.implementation.id,
                        nombre: corectivePhoto.data.nombre,
                        url: corectivePhoto.data.url }
                    );

                    // Evento para actualizar fotos correctivas en todas las vistas
                    this.events.publish('sendReportPoped');
                
                    this.util.showToast( 'Foto subida con éxito', 3000 );
                })
                .catch((error: any) => {
                    this.util.showToast( 'Error al subir foto', 3000 );
                });
        }
    }

    // para abrir camara y retorna foto
    async getImage(fromUtils?: boolean) {
        let image = null;
        if(fromUtils){
            await this.util.getCorectiveImage()
                .then((result) => { image = result; })
                .catch((error) => { 
                    this.util.showToast( 'No se pudo obtener foto', 3000 );  
                });
            return image;

        }else{
            return await this.getImageCamera();
        }
    }

    /**
     * Abre la camara in app
     */
    async getImageCamera(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.view = 'CAMERA';
                const modal = this.modal.create(CameraComponent, null, { cssClass: 'modal-full'});
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
    
    
}