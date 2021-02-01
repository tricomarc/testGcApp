import { ApplicationRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { LoadingController, ModalController, NavParams, Content } from "ionic-angular";
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import * as _ from 'lodash';
import { UtilProvider } from "../../../../shared/providers/util/util";
import { global } from "../../../../shared/config/global";
import { config } from "../../tienda/comunicados-tienda.config";
import { RequestProvider } from "../../../../shared/providers/request/request";
import { SessionProvider } from "../../../../shared/providers/session/session";
import { ImageViewerController } from 'ionic-img-viewer';
import { globalConfig } from '../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';


@Component({
    selector: 'comunicado',
    templateUrl: 'comunicado.html',
})
export class ComunicadoComponent {

    @ViewChild(Content) content: Content;

    _imageViewerCtrl: ImageViewerController;

    details = {};
    archivos = [];
    comunicadoLeido = false;
    onlyWatch = false;
    //Caracteristicas para abrir navegador desde la App
    options: InAppBrowserOptions = {
        location: 'no',//Or 'no'
        hidden: 'no', //Or  'yes'
        clearcache: 'yes',
        clearsessioncache: 'yes',
        zoom: 'yes',//Android only ,shows browser zoom controls
        hardwareback: 'yes',
        mediaPlaybackRequiresUserAction: 'no',
        shouldPauseOnSuspend: 'no', //Android only
        closebuttoncaption: 'Close', //iOS only
        disallowoverscroll: 'no', //iOS only
        toolbar: 'yes', //iOS only
        enableViewportScale: 'no', //iOS only
        allowInlineMediaPlayback: 'no',//iOS only
        presentationstyle: 'pagesheet',//iOS only
        fullscreen: 'yes',//Windows only
    };

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private images: string[] = [];

    constructor(
        private loading: LoadingController,
        public params: NavParams,
        private applicationRef: ApplicationRef,
        public modalCtrl: ModalController,
        private theInAppBrowser: InAppBrowser,
        private request: RequestProvider,
        private session: SessionProvider,
        private util: UtilProvider,
        private browser: InAppBrowser,
        imageViewerCtrl: ImageViewerController,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

        this._imageViewerCtrl = imageViewerCtrl;
    }

    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView('ComunicadoComponentComunicados');
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ComunicadoComponent', 'Comunicados' );
    }

    async ionViewWillEnter() {
        //Se reciben los detalles del comunicado por parametros desde vista de detalles
        this.details = this.params;

        try {
            this.images = _.isArray(this.details['data'].comunicado.imagenes) ? this.details['data'].comunicado.imagenes : [];
        } catch (e) { }

        if (!_.isUndefined(this.details['data'].watch) && !_.isNull(this.details['data'].watch)) this.onlyWatch = this.details['data'].watch;

        if (!_.isUndefined(this.details['data'].comunicado) && !_.isNull(this.details['data'].comunicado)) {
            console.log("comunicado ", this.details['data'].comunicado)
            if (!_.isUndefined(this.details['data'].comunicado.estado) && !_.isNull(this.details['data'].comunicado.estado)) {
                this.comunicadoLeido = this.details['data'].comunicado.estado;
            } else if (!_.isUndefined(this.details['data'].comunicado.leido) && !_.isNull(this.details['data'].comunicado.leido)) {
                this.comunicadoLeido = this.details['data'].comunicado.leido;
            }
        } else {
            console.log("sin comunicado ", this.details['data'])
        }
        await this.loadFiles();

        let tabbar = document.getElementsByClassName('tabbar')[0];
        //console.log("tabbar ", tabbar)
        //body.classList.remove("className");   //remove the class
        tabbar.classList.add("show-tabbar");   //add the class
    }

    /**
     * Asignación de archivos
     */
    async loadFiles() {
        this.applicationRef.tick();
        if (!_.isUndefined(this.details["data"].comunicado.archivos)) {
            this.archivos = [];
            for (let key in this.details["data"].comunicado.archivos) {
                let value = this.details["data"].comunicado.archivos[key];
                this.archivos.push(value);
            }
        }
        if (!this.comunicadoLeido) this.updateState();
        else console.log("ya leido ", this.comunicadoLeido)
    }

    /**
     * Cambio de estado para comunicado ya leido,
     * A los 2 segundos de ingresar a la vista, se valida el estado
     * del comunicado, se cambia a estado Leido en caso de no estarlo.
     * @returns {Promise<{}>}
     */
    updateState() {
        this.session.getSession().then(session => {
            let context = this;
            let result = session;
            setTimeout(function () {
                //loading.present();
                config.updateState.comunicado_id = context.details['data'].comunicado["comunicado_id"];
                config.updateState.usuario_id = result["usuario"].id + "";
                config.updateState.session_id = result["sessionid"];
                config.updateState.leido = true;

                console.log("updateState ", config.updateState)
                context.request
                    .post(config.endpoints.put.comunicados, JSON.stringify(config.updateState), false)
                    .then((response: any) => {
                        try {
                            context.details['data'].comunicado["comunicadoLeido"] = response.data.leido;
                            context.applicationRef.tick();
                            context.comunicadoLeido = context.details['data'].comunicado["comunicadoLeido"];
                            console.log("details ", context.details['data'])
                            this.content.resize();
                            this.content.scrollToTop();

                        }
                        catch (e) {
                            console.log("error ", e);
                            //loading.dismiss();
                        }
                    })
                    .catch((error: any) => {
                        try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                        if (error && error.message) context.util.showToast(error.message, 3000);

                        //loading.dismiss();
                    });

            }, 5000);
        });
    }

    /**
     * Abre modal para ver imagen seleccionada
     * @param url
     */
    openModalPhoto(url) {
        var data = { url: url };
        var modalPage = this.modalCtrl.create('ImageModalPage', data);
        modalPage.present();
    }

    /**
     * Abre enlace para descargar archivo seleccionado
     * @param file
     */
    downloadFile(file: any) {
        console.log("archivo ", file)
        let options: InAppBrowserOptions = { location: 'no', };
        let browser = this.browser.create(file.path, '_system', options);
    }

    /**
     * Opciones para ver link seleccionado en browser
     * @param {string} url: direccion del link seleccionado
     */
    public openWithSystemBrowser(url: string) {
        console.log("dowload ", url);
        let target = "_system";
        this.theInAppBrowser.create(url, target, this.options);
    }

    public openWithInAppBrowser(url: string) {
        console.log("dowload ", url);
        let target = "_blank";
        this.theInAppBrowser.create(url, target, this.options);
    }

    public openWithCordovaBrowser(url: string) {
        console.log("dowload ", url);
        let target = "_self";
        this.theInAppBrowser.create(url, target, this.options);
    }

    /**
     * Modal para iamgen con zoom
     * @param myImage
     */
    presentImage(image) {
        const imageViewer = this._imageViewerCtrl.create(image);
        imageViewer.present();

        /* setTimeout(() => imageViewer.dismiss(), 1000);
         imageViewer.onDidDismiss(() => alert('Viewer dismissed'));*/
    }

    openPhotoViewer(image: string) {
        const img = new Image();
		img.src = image;
		const imageViewer = this._imageViewerCtrl.create(img);
		imageViewer.present();
    }
}
