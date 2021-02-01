import { Component, ViewChild, NgZone, ElementRef, ViewEncapsulation } from '@angular/core';
import {
    IonicPage,
    NavController,
    NavParams,
    AlertController,
    LoadingController,
    Events,
    ModalController,
    Content
} from 'ionic-angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

// Configuración del componente
import { config } from './visual-report.config'

// Componentes
import { PhotoViewerComponent } from '../../../../components/photo-viewer/photo-viewer';

// Páginas
import { SendReportPage } from '../send-report/send-report';
import { EditReportPage } from '../edit-report/edit-report';
import { ShowReportPage } from '../show-report/show-report';

// Configuración global
import { global } from '../../../../shared/config/global';
import { globalConfig } from '../../../../config';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';
import { ModalNoImplementarPage } from '../../modal-no-implementar/modal-no-implementar';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@IonicPage()
@Component({
    selector: 'page-visual-report',
    templateUrl: 'visual-report.html',
    encapsulation: ViewEncapsulation.None
})
export class VisualReportPage {

    // Atributos
    private visual: any = null;
    private visual_id: any = null;
    private report_id: any = null;
    private branch_office_id: any = null;
    private receivedMaterial: boolean = false;
    private areRequiredPhotos: boolean = false;
    private statuses: any = [];
    // True para venir desde "Materiales"
    private fromMaterial: boolean = false;
    // True para venir desde "Estadísticas"
    private fromStats: boolean = false;
    // True para venir desde "Historial"
    private fromHistory: boolean = false;
    private fromMiGestion: boolean = false;

    private form: any = {
        commentary: ''
    };

    private session: any = null;
    private locked_buttons: boolean = false;
    private is_network_connected: any = true;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private appId: string = global.pro.appId;

    @ViewChild(Content) content: Content;

    // Representa el estado de carga cuando se actualiza un atributo del reporte
    private requesting: boolean = false;
    private status_data: any = { icon: 'help', color: 'default' };

    private commentary_focus: boolean = false;
    private loading_first_time: boolean = false;

    private branchOfficeName: boolean = false;
    isFavorite: boolean = null;
    reportId: string = '';
    noImplementar = {
        reporteId: null,
        causa_unica: null,
        causas: [],
        no_implementar: null,
        editable: null
    }
    isTask: null;

    private clientCode: string = global.pro.appId;

    private puede_corregir: boolean;

    private visual_puede_corregir: boolean;

    private puede_reportar: boolean = true;

    // diccionario
    private sucursal: string;
    
    constructor(private navCtrl: NavController,
        private navParams: NavParams,
        private alert: AlertController,
        private loading: LoadingController,
        private modal: ModalController,
        private events: Events,
        private browser: InAppBrowser,
        private zone: NgZone,
        private elementRef: ElementRef,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
        private dictionary: DictionaryProvider) {
    }

    // Método que se inicia automáticamente cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView('VisualReportVisual');
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'VisualReport', 'Visual' );

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.sucursal = dictionary['Sucursal']
        } );
        
        this.is_network_connected = this.util.isNetworkConnected(globalConfig.isBrowser);

        let report_id = this.navParams.data.report_id;
        this.reportId = report_id;
        this.fromMaterial = this.navParams.data.fromMaterial;
        this.fromStats = this.navParams.data.fromStats;
        this.fromHistory = this.navParams.data.fromHistory;
        this.fromMiGestion = this.navParams.data.fromMiGestion;
        this.report_id = report_id;
        this.branchOfficeName = this.navParams.data.branchOfficeName;
        this.isTask = this.navParams.data.task;
        // Si es desde materiales o estadística hacemos un flujo distinto
        if (this.fromMaterial || this.fromStats || this.fromHistory || this.fromMiGestion) {
            if (!report_id) {
                this.util.showToast('Reporte inválido, falta información', 3000);
                this.navCtrl.pop();
                return;
            }

            this.loading_first_time = true;
            // Obtenemos los estados y asignamos color e ícono al visual
            this.statuses = await this.getStatuses();
        } else {
            let visual_id = this.navParams.data.visual_id;
            let branch_office_id = this.navParams.data.branch_office_id;

            this.visual_id = visual_id;
            this.branch_office_id = branch_office_id;

            // Si la vista no recibe "report_id, visual_id o branch_office_id", se cierra automáticamente
            if (!visual_id || !report_id || !branch_office_id) {
                this.util.showToast('Reporte inválido, falta información', 3000);
                this.navCtrl.pop();
                return;
            }
            this.statuses = this.navParams.data.statuses;
        }

        // Obtenemos la data del reporte
        this.visual = await this.getVisualReport(true, null);

        console.log(this.visual);

        try {
            this.content.resize();
        } catch (e) { }

        if (this.fromMaterial && this.visual) {
            this.visual_id = this.visual.id;
            this.branch_office_id = this.visual.visuales_sucursal_id;
        }

        // Flujo normal
        this.sessionProvider.getSession().then((response: any) => {
            this.session = response;
        });

        // Asignamos el valor de "llego_material" del reporte
        this.receivedMaterial = (this.visual.llego_material ? true : false);

        // Verificamos si el visual tiene fotos requeridas
        this.checkRequiredPhotos();

        // Si el usuario está en esta vista por 5 segundos se debe marcar el reporte como leído, en caso de que no lo esté
        if (!this.visual.leido && !this.fromStats) {
            setTimeout(() => {
                let view = this.navCtrl.getActive();
                // Si continuamos en esta vista o la de envío del report envíamos el request
                if ((view.instance instanceof VisualReportPage || view.instance instanceof SendReportPage) && !this.fromStats) {
                    this.markAsRead();
                }
            }, 5000);
        }

        // Escucha el evento 'sendReportPoped', cuando se cierra SendReportPage actualiza la data de esta vista
        this.events.subscribe('sendReportPoped', async () => {
            this.zone.run(async () => {
                try {
                    // this.content.scrollToTop();
                    let visual = await this.getVisualReport(false, null);

                    if (visual) {
                        // Verificamos si el visual tiene fotos requeridas
                        this.visual = visual;
                        this.checkRequiredPhotos();
                    }
                    this.content.resize();
                } catch (e) { }
            });
        });

        this.events.subscribe('network-connected', () => {
            this.is_network_connected = true;
        });

        this.events.subscribe('network-disconnected', () => {
            this.is_network_connected = false;
        });
    }

    // Método que se ejecuta cuando se cierra esta vista
    ionViewDidLeave() {
        // Activa el evento "visualReportPoped"
        if (this.navCtrl.getActive().instance instanceof VisualReportPage) {
            if (!this.fromMaterial && !this.fromStats) {
                this.events.publish('visualReportPoped');
            }
            this.events.unsubscribe('sendReportPoped');
            this.events.unsubscribe('network-connected');
            this.events.unsubscribe('network-disconnected');
        }
    }

    // Obtiene el reporte del visual (Recibe la vía por la cual se debe mostrar la carga)
    // En el primer request se muestra un loading con un texto
    async getVisualReport(firstRequest: boolean, refresher: any) {
        let result = {};

        if (!refresher) {
            if (firstRequest) this.loading_first_time = true;
            else this.requesting = true;
        }

        // Solicitamos el reporte del visual al servicio
        await this.request
            .get(config.endpoints.newApi.get.report + this.report_id, true)
            .then((response: any) => {
                if (response.data) {
                    this.noImplementar = {
                        causa_unica: response.data.causa_unica,
                        editable: response.data.editable,
                        reporteId: response.data.reporte_id,
                        no_implementar: response.data.no_implementar,
                        causas: response.data.causas
                    }

                    // asignamos al cargo si puede o no reportar
                    if( response.data.puede_reportar === false ){
                        this.puede_reportar = false;
                    }else{
                        this.puede_reportar = true;
                    }

                    // capturamos el setting si viene activo o no
                    this.puede_corregir = response.data.puede_corregir;
                    // capturamos el setting si viene activo o no
                    this.visual_puede_corregir = response.data.visual_puede_corregir;

                    // Para cada foto de referencia asignamos su implementación
                    this.setImplementations(response.data.fotos, response.data.implementaciones);

                    // Agrupamos las fotos que han sido clasificadas y las agregamos al visual
                    response.data.classified_photos = this.groupClassifiedPhotos(response.data.fotos, response.data.fotos_clasificadas);

                    // Asignamos las implementaciones extras
                    response.data.classified_photos.optional = response.data.implementaciones.normales;

                    let status_data = this.status_data;

                    if (this.statuses.length) status_data = this.getStatusValueByKey(response.data.estado);
                    result = _.merge(response.data, { status_data: status_data });
                    this.isFavorite = response['data']['favorito'];
                }
                // else this.util.showAlert("Atención", "No ha sido posible obtener el reporte, intente nuevamente");
            })
            .catch((error: any) => {
                // this.util.showToast('No ha sido posible obtener el reporte, intente nuevamente', 3000);
            });
        if (refresher) refresher.complete();
        else {
            if (firstRequest) this.loading_first_time = false;
            this.requesting = false;
        }
        return result;
    }

    // Marca el reporte actual como leído
    markAsRead() {
        this.request
            .post(config.endpoints.newApi.post.read, { reporte_id: this.report_id }, true)
            .then(async (response: any) => {
                this.visual = await this.getVisualReport(false, null);
                // Verificamos si el al tiene fotos requeridas
                this.checkRequiredPhotos();
            })
            .catch((error: any) => {
            });
    }

    // Envía un request confirmando que el usuario recibió el material
    async reportReceivedMaterial() {
        this.requesting = true;
        if (!await this.isExpired()) {
            this.requesting = false;
            let confirm = this.alert.create({
                title: 'Recepción de material',
                message: '¿Está seguro que desea reportar que recibió el material?',
                buttons: [{
                    text: 'Cancelar',
                    role: 'cancel',
                    handler: () => {
                        this.receivedMaterial = (this.visual.llego_material ? true : false);
                    }
                }, {
                    text: 'Confirmar',
                    handler: (data: any) => {
                        if (this.visual.tiene_recepcion_parcial && !data) {
                            this.util.showAlert('Atención', 'Debe indicar si se recepcionó total o parcialmente el material.');
                            this.receivedMaterial = (this.visual.llego_material ? true : false);
                            return;
                        }
                        this.request
                            .post(config.endpoints.newApi.post.receivedMaterial, {
                                sucursal_id: this.branch_office_id,
                                visual_id: this.visual_id,
                                reporte_id: this.report_id,
                                llego_material: (data ? parseInt(data) : 1)
                            }, true)
                            .then(async (response: any) => {
                                if (response.message === config.api_messages.report_material) {
                                    this.util.showToast('Recepción de material registrada.', 3000);
                                    this.visual = await this.getVisualReport(false, null);
                                    // Verificamos si el visual tiene fotos requeridas
                                    this.checkRequiredPhotos();
                                    return;
                                }
                                this.receivedMaterial = (this.visual.llego_material ? true : false);
                            })
                            .catch((error: any) => {
                                this.receivedMaterial = (this.visual.llego_material ? true : false);
                                this.util.showToast('No ha sido posible reportar el material, intente nuevamente', 3000);
                            });
                    }
                }]
            });
            if (this.visual.tiene_recepcion_parcial) {
                confirm.setMessage('Seleccione la cantidad de material recibido');
                confirm.addInput({
                    type: 'radio',
                    label: 'Total',
                    value: '1',
                    checked: false
                });
                confirm.addInput({
                    type: 'radio',
                    label: 'Parcial',
                    value: '2',
                    checked: false
                });
            }
            confirm.present();
            return;
        }
        this.receivedMaterial = (this.visual.llego_material ? true : false);
        this.requesting = false;
    }

    // Abre un modal el cual muestra la foto que entra por parámetro
    openPhotoViewer(photo: any, type: string, is_video: boolean, reference: any, evaluated: boolean) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let modal = this.modal.create(PhotoViewerComponent, {
            photo: photo,
            type: (type === 'removed' ? 'none' : type),
            is_video: is_video,
            reference: reference,
            evaluated: evaluated,
            removed: (type === 'removed')
        });
        modal.present();
    }

    // Para cada foto de referencia obligatoria se le asigna su foto/video de implementación (en caso de que exista)
    setImplementations(photos: any, implementations: any) {
        _.forEach(photos, (photo) => {
            let implementation = _.find(implementations.obligatorias, { parent_id: photo.id });
            if (photo.obligatoria && implementation) photo.implementation = implementation;
        });
        return photos;
    }

    // Agrupa las fotos clasificadas por su estado y obligatoriedad
    groupClassifiedPhotos(photos: any, classifiedPhotos: any) {
        let result = {
            required: {
                pending: [], rejected: [], accepted: [], all: [], temporarilyRejected: []
            }
        };
        try {
            _.forEach(photos, (photo) => {
                if (photo.obligatoria) {
                    // Buscamos la implementación de la foto para ver su estado
                    let implementation = _.find(classifiedPhotos, (cph) => {
                        if (cph.parent) return cph.parent.id === photo.id;

                        return null;
                    });
                    if (implementation) {
                        if (photo.implementation) photo.implementation.rechazos = (implementation.rechazos || []);

                        if (implementation.rechazada === 1) {
                            if (photo.implementation) {
                                if (implementation.childs) {
                                    photo.implementation.childs = implementation.childs;
                                } else {
                                    photo.implementation.childs = new Array();
                                }
                            }

                            result.required.rejected.push(photo);
                        }
                        else if (implementation.rechazada === 0) {
                            result.required.accepted.push(photo);
                        }
                        else {
                            result.required.pending.push(photo);
                        }
                        if (implementation.rechazo_temporal === true) {
                            photo.temporarilyRejected = true;
                            result.required.temporarilyRejected.push(photo);
                        }
                    }

                    result.required.all.push(photo);
                }
            });
        } catch (e) { }
        return result;
    }

    // Descarga un archivo
    downloadFile(file: any) {

        // Si venimos desde estadísticas no se registra la descarga del archivo
        if (this.fromStats) {
            const options: InAppBrowserOptions = { location: 'no', };
            const browser = this.browser.create(file.url, '_system', options);
            return;
        }

        this.request
            .post(config.endpoints.newApi.post.downloadFile, { reporte_id: this.report_id, archivo: file.nombre, instructivo: file.instructivo }, true)
            .then((response: any) => {
                if (response && response.status) {
                    if (file.instructivo) this.visual.descargo_instructivo = true;
                    const options: InAppBrowserOptions = { location: 'no', };
                    const browser = this.browser.create(file.url, '_system', options);
                    return;
                }
                this.util.showToast('Error al abrir el archivo, intente nuevamente', 3000);
            })
            .catch((error: any) => {
                this.util.showToast('Error al abrir el archivo, intente nuevamente', 3000);
            });
    }

    // Agrega un comentario para el visual
    addCommentary() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        if (!this.form.commentary) {
            this.util.showAlert('Atención', 'Debe ingresar un comentario.');
            return;
        }
        this.requesting = true;
        this.request
            .post(config.endpoints.newApi.post.addCommentary, {
                comentario: this.form.commentary,
                reporte_id: this.report_id
            }, true)
            .then(async (response: any) => {
                this.requesting = false;
                this.util.showToast('Comentario agregado.', 3000);
                this.visual = await this.getVisualReport(false, null);
                // Verificamos si el visual tiene fotos requeridas
                this.checkRequiredPhotos();
                this.form = { commentary: null };
            })
            .catch((error: any) => {
                this.requesting = false;
                this.util.showAlert('Atención', 'Comentario no agregado, intente nuevamente.');
            });
    }

    // Retorna true o false dependiendo si hay fotos requeridas con implementación
    checkRequiredPhotos() {
        let count = 0;
        try {
            if (this.visual && this.visual.id) {
                // Contamos las fotos que cuentan con implementación
                _.forEach(this.visual.classified_photos.required.all, (photo) => {
                    if (photo.implementation) count++;
                });
            }
        } catch (e) {
        }
        this.areRequiredPhotos = count > 0;
    }

    // Lleva a la pantalla para enviar el reporte
    async navigateToSendReport() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        /**
         * Debemos validar si el visual requiere la descarga del instructivo para ser reportado
         * y si fue descargado o no
         */
        if (this.visual.instructivo_obligatorio && !this.visual.descargo_instructivo) {
            this.util.showAlert('Atención', 'Es necesario descargar el instructivo para reportar la campaña.');
            return;
        }

        this.requesting = true;
        if (await this.isExpired()) {
            this.requesting = false;
            return
        }
        ;
        this.requesting = false;
        if (!this.checkMaterialStatus()) return;
        this.navCtrl.push(SendReportPage, {
            visual: this.visual,
            report_id: this.report_id,
            branch_office_name: this.navParams.data.branch_office_name
        });
    }

    // Lleva a la pantalla para editar el reporte
    async navigateToEditReport() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        this.requesting = true;
        if (await this.isExpired()) {
            this.requesting = false;
            return
        }
        ;
        this.requesting = false;
        this.navCtrl.push(EditReportPage, {
            visual: this.visual,
            report_id: this.report_id,
            branch_office_name: this.navParams.data.branch_office_name
        });
    }

    // Lleva a la pantalla para ver el reporte
    navigateToShowReport() {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        this.navCtrl.push(ShowReportPage, {
            visual: this.visual,
            report_id: this.report_id,
            branch_office_name: this.navParams.data.branch_office_name,
            puede_corregir: this.puede_corregir, // tiene o no setting activo
            visual_puede_corregir: this.visual_puede_corregir // tiene o no setting activo

        });
    }

    // Verifica si una campaña ha caducado o no, además agrega la holgura del cliente en caso de que exista
    async isExpired() {
        let result = true;
        await this.request
            .get(config.endpoints.newApi.get.info, true)
            .then((response: any) => {
                if (!response || !response.data || !response.data.timestamp) {
                    this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
                } else if (response.data.timestamp > (this.visual.fecha_reporte.timestamp + (this.visual.holgura ? this.visual.holgura : 0))) {
                    let formatedDate = this.visual.fecha_reporte.day.string + ' '
                        + this.visual.fecha_reporte.day.real + ' de ' + this.visual.fecha_reporte.month.string
                        + ', ' + this.visual.fecha_reporte.year.real + '<br> a las '
                        + this.visual.fecha_reporte.time + ' hrs.';
                    this.util.showAlert('Atención', 'La fecha de reporte ha caducado. Fecha de vencimiento: ' + formatedDate);
                } else {
                    result = false;
                }
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No se pudo verificar la fecha de reporte, intente nuevamente');
            });
        return result;
    }

    // Retorna true si el material está ok o no es necesario, false en caso contrario
    checkMaterialStatus() {
        if (this.visual.tiene_material && !this.visual.reportar_sin_material && !this.visual.llego_material) {
            this.util.showAlert('Atención', 'Aún no ha llegado el material, por lo tanto no puede reportar.');
            return false;
        }
        return true;
    }

    // Actualiza el reporte
    async refreshVisualReport(refresher: any) {
        let temp: any = await this.getVisualReport(false, refresher);
        if (temp && temp.id) this.visual = temp;
        // Verificamos si el visual tiene fotos requeridas
        this.checkRequiredPhotos();
    }

    // Muestra una alerta con el motivo de no implementación
    showNoImplementationReason(reason: any) {
        // Bloqueo de botones
        if (this.locked_buttons) return;
        else this.blockButtons();

        let template = ('<p><b>' + reason.nombre + '</b><br>' + (reason.comentario ? reason.comentario : '') + '</p>');
        this.util.showAlert('Motivo', template);
    }

    // Retorna un aproximado del ícono usado en ionic 1
    /*(CONFIGURAR EN ADMIN ICONOS PARA IONIC 2+ Y DEJAR DE USAR ESTA FUNCIÓN)*/
    getIconByStatus(info: any) {
        let data = this.util.getIconAndColorFromV1(info);
        return data;
    }

    // Retorna el valor (nombre) del estado actual o del estado que entra por parámetro (id)
    getStatusValueByKey(key: any) {
        let value = _.find(this.statuses, { id: key });
        if (value) return value;
        return { nombre: 'Desconocido' };
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

    // Implementa un reporte
    async implementReport() {
        const loading = this.loading.create({});
        loading.present();
        if (await this.isExpired()) { loading.dismiss(); return };
        if (!this.checkMaterialStatus()) { loading.dismiss(); return };
        loading.dismiss();
        let confirm = this.alert.create({
            title: 'Implementar reporte',
            message: '¿Está seguro que desea implementar este reporte?',
            buttons: [{
                text: 'Cancelar',
                role: 'cancel',
                handler: () => { }
            }, {
                text: 'Confirmar',
                handler: () => {
                    const loading = this.loading.create({ content: 'Implementando reporte' });
                    loading.present();
                    this.request
                        .post(config.endpoints.newApi.post.implement, { reporte_id: this.report_id }, true)
                        .then(async (response: any) => {
                            loading.dismiss();
                            if (response.message === config.api_messages.implement) {
                                try {
                                    this.content.scrollToTop()
                                } catch (e) {
                                }
                                this.visual = await this.getVisualReport(false, null);
                                // Verificamos si el visual tiene fotos requeridas
                                this.checkRequiredPhotos();
                                this.util.showToast('Campaña implementada exitosamente', 3000);
                                return;
                            }
                            this.util.showAlert('Atención', 'No ha sido posible implementar la campaña, intente nuevamente.');
                        })
                        .catch((error: any) => {
                            this.util.showAlert('Atención', 'No ha sido posible implementar la campaña, intente nuevamente.');
                            loading.dismiss();
                        });
                }
            }]
        });
        confirm.present();
    }


    async noImplementarReporte() {
        const loading = this.loading.create({});
        loading.present();
        if (await this.isExpired()) { loading.dismiss(); return };
        if (!this.checkMaterialStatus()) { loading.dismiss(); return; }
        loading.dismiss();
        const modal = this.modal.create(ModalNoImplementarPage, { params: this.noImplementar });
        modal.present();
        modal.onDidDismiss(() => {
            this.refreshVisualReport(null);
        })
    }

    // Obtiene los estados desde el servicio
    async getStatuses() {
        let results = [];
        // this.requesting = true;
        await this.request
            .get(config.endpoints.newApi.get.statuses, true)
            .then((response: any) => {
                // Antes de retornar los estados, cambiamos los íconos a ionic 2+
                _.forEach(response.data, (result) => {
                    // if (result.nombre !== 'Caducado') {
                    let info = this.getIconByStatus(result.icono_app);
                    result = _.merge(result, info);
                    results.push(result);
                    // }
                });
            })
            .catch((error: any) => {
                this.util.showToast('No ha sido posible traer la lista de estados', 3000);
            });
        // this.requesting = false;
        return results;
    }

    // Si la implementación está en el arreglo de aprobadas o rechazadas, decimos que fue evaluada
    isEvaluated(implementation: any) {
        if (
            _.includes(this.visual.classified_photos.required.rejected, implementation)
            || _.includes(this.visual.classified_photos.required.accepted, implementation)
        ) {
            return true;
        }
        return false;

    }

    // Busca la implementación de un comentario y la muestra en el visor
    showCommentaryImplementation(reference: any) {
        // Buscamos la implementación por su id
        let temp = _.find(this.visual.classified_photos.required.all, (photo: any) => {
            return (photo.implementation ? photo.implementation.id === reference.id : false);
        });

        // Si encontramos la implementación en el arreglo de fotos clasidicadas
        // abrimos el visor de fotos con los parámetros correspondientes
        if (temp) {
            let evaluated = this.isEvaluated(temp);
            this.openPhotoViewer(temp.implementation, 'implementation', temp.solicitar_video, temp.url, evaluated);
            return;
        }

        // Si no encontramos la implementación (Posiblemente borrada)

        // Si tenemos un motivo de no implementación, abrimos el visor con los parámetros correspondientes
        if (reference.motivo) {
            this.openPhotoViewer(reference, 'removed', false, ((reference.parent && reference.parent.url) ? reference.parent.url : null), true);
            return;
        }

        // Si no tenemos motivo, pero tenemos una url, mostramos dicha url
        if (reference.url) {
            this.openPhotoViewer(reference, 'removed', ((reference.parent && reference.parent.solicitar_video) ? reference.parent.solicitar_video : false), ((reference.parent && reference.parent.url) ? reference.parent.url : null), false);
            return;
        }

        // Si no, informamos al usuario que la implementación no está disponible
        this.util.showAlert('Atención', 'Implementación no disponible.');
    }

    setFavorite() {
        const loading = this.loading.create({});
        loading.present();
        const params = { prefix: 'visual', id: this.reportId, favorito: !this.isFavorite }
        this.util.setFavorite(params)
            .then(() => { loading.dismiss(); this.isFavorite = !this.isFavorite })
            .catch((err) => { loading.dismiss(); this.util.showAlert('Atención', err.message); })
    }

    allRejectedAreTemporarily() {
        for (let photo of this.visual.classified_photos.required.rejected) {
            if (!photo.temporarilyRejected) return false;
        }
        return true;
    }

}
