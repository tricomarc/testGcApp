import { Component, ViewChild, NgZone } from '@angular/core';
import {
    IonicPage,
    NavController,
    LoadingController,
    Events,
    Content,
    NavParams,
    AlertController,
    Platform
} from 'ionic-angular';
import { DatePicker } from '@ionic-native/date-picker';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

import 'rxjs/add/operator/debounceTime';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';

// Configuración del componente
import { config } from './report-material.config';

// Configuración global
import { global } from '../../../shared/config/global';

// Páginas
import { EditMaterialReportPage } from '../edit-material-report/edit-material-report';
import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-report-material',
    templateUrl: 'report-material.html',
})

export class ReportMaterialPage {

    @ViewChild( Content ) content: Content;

    // Atributos
    private report: any = null;
    private report_id: any = null;
    private materials: any = [];
    private materials_view: any = [];
    private materials_to_report: any = [];
    private form: any = {
        date: null,
        selected_date: null
    };
    private session: any = null;
    private searchControl = new FormControl();
    // Representa el estado de carga cuando se actualiza la data
    private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    private max_date: any = this.getCurrentDate();
    

    private auxAumDism: any;
    

    // Constructor
    constructor(
        private navCtrl: NavController,
        private loading: LoadingController,
        private zone: NgZone,
        private events: Events,
        private navParams: NavParams,
        private datePicker: DatePicker,
        private alert: AlertController,
        private platform: Platform,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'ReportMaterialMaterials' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'ReportMaterial', 'Materials' );

        let report_id = this.navParams.data.report_id;
        
        if ( !report_id ) {
            this.util.showAlert( 'Atención', 'Falta información del reporte' );
            
            this.navCtrl.pop();
            
            return;
        }
        
        this.report_id = report_id;
        
        this.report = await this.getReportMaterial(report_id, false);

        this.session = await this.sessionProvider.getSession();

        this.watchSearch();

        // Cada vez que se edita o envía un material, se acciona este evento
        this.events.subscribe('materialChanged', async () => {
            this.report = await this.getReportMaterial( report_id, false );
        });

    }

    // Método que se ejecuta cuando se destruirá la vista
    ionViewWillUnload() {
        this.events.unsubscribe('materialChanged');
    }


    // Obtiene el material de un reporte
    async getReportMaterial( report_id: any, isRefresh: boolean ) {
        // loading
		const loading = this.loading.create({ content: 'Obteniendo material...' });

        loading.present();
        
        this.materials_to_report = [];
        
        this.searchControl.setValue( '' );
        
        if ( !isRefresh ) this.requesting = true;
        
        let report = null;
        
        await this.request.get( ( config.endpoints.oldApi.get.report + report_id ), false )
            .then( ( response: any ) => {
                loading.dismiss();

                if ( response && response.data ) {
                    report = response.data;
                    
                    if ( report && report.materiales ) {
                        _.forEach( report.materiales, ( material: any ) => {
                            const aux = _.find(this.materials_view, { id: material.id });
                            material.form = { 
                                quantity: (aux && aux.form && aux.form.quantity ? aux.form.quantity : 0)
                            };
                        });

                        this.materials = report.materiales;
                        
                        this.materials_view = report.materiales;
                        
                        return;
                    }
                }
                this.util.showAlert("Atención", "No se han encontrado materiales");
            })
            .catch((error: any) => {
                loading.dismiss();
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.util.showAlert('Atención', 'No ha sido posible obtener el material del reporte');
            });
        this.requesting = false;
        
        return report;
    }

    // Refresca el material del reporte
    async refreshReportMaterial( refresher: any ) {
        if ( this.report_id ) this.report = await this.getReportMaterial( this.report_id, true );
        
        refresher.complete();
    }

    // Muestra un popup para seleccionar una fecha
    selectDate() {
        this.datePicker
            .show( {
                date: new Date(),
                mode: 'date',
                androidTheme: this.datePicker.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT,
                maxDate: (this.platform.is('ios') ? new Date() : (new Date()).valueOf())
            } )
            .then( ( date: any ) => {
                this.form.date = date;
            } ).catch( ( error: any ) => {
                this.form.date = null;
                
                this.util.showAlert( "Atención", "Fecha no seleccionada" );
            }
        );
    }

    // Observa el campo de búsqueda y solicita filtrar los materiales
    watchSearch() {
        this.searchControl.valueChanges
            .debounceTime( 300 ) // Cuando se deja de tipear por 300 ms
            .distinctUntilChanged() // Si el input es distinto
            .subscribe( ( searchTerm: any ) => {
                this.filterMaterials( searchTerm );
            }
        );
    }

    // Filtra la lista de materiales
    filterMaterials( term: any ) {
        let lower_case_term: any = term.toLowerCase();
        
        // Si no hay filtro asignamos todos los materiales
        if (!term) {
            this.materials_view = this.materials;
            
            return;
        }
        
        // Filtramos los materiales por nombre, código o estado
        let temp = _.filter( this.materials, ( material: any ) => {
            return ( ( material.nombre ? _.includes( material.nombre.toLowerCase(), lower_case_term) : false ) ||
                ( material.estado_material ?_.includes( material.estado_material.toLowerCase(), lower_case_term ) : false) ||
                ( material.codigo ? _.includes( material.codigo.toString().toLowerCase(), lower_case_term ) : false ) );
            }
        );

        if ( temp ) this.materials_view = temp;
        
        else this.materials_view = this.materials;
    }

    // Valida y solicita reportar los materiales informados
    reportMaterials() {
        if ( !this.form.date ) {
            this.util.showAlert( 'Atención', 'Por favor, seleccione una fecha.' );
            
            return;
        }

        let selected_date = this.form.date.split( '-' );

        if ( !selected_date || selected_date.length !== 3 ) {
            this.util.showAlert( 'Atención', 'La fecha seleccionada no es válida, intente nuevamente.' );
            
            return;
        }

        this.form.selected_date = selected_date[0] + '-' + selected_date[1] + '-' + selected_date[2];

        if ( this.materials_to_report.length < 1 ) {
            this.util.showAlert( 'Atención', 'Debe seleccionar al menos un producto a reportar.' );
            
            return;
        }

        // Buscamos los materiales que el valor ingresado difieren del enviado
        let materials_with_differences = _.filter( this.materials_to_report, ( material: any ) => {
            return ( material.form.quantity !== material.cantidad );
        } );

        if ( materials_with_differences && materials_with_differences.length > 0 ) {
            let confirm = this.alert.create( {
                title: 'Atención',
                message: ('Reportará ' + materials_with_differences.length + ' producto(s) que difiere(n) de la cantidad enviada. ¿Desea continuar?'),
                buttons: [ 
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    handler: () => {}
                }, 
                {
                    text: 'Reportar',
                    handler: ( data: any ) => {
                        this.sendReportMaterials();
                    }
                }]
            } );
            
            confirm.present();
            
            return;
        }
        
        this.sendReportMaterials();
    }

    // Reduce la cantidad informada de un material y lo saca del arreglo en caso de ser 0
    decreaseMaterialsQuantity( material: any ) {
        material.form.quantity --;
        
        if ( material.form.quantity < 1 ) _.remove( this.materials_to_report, { id: material.id } );
    }

    // Aumenta la cantidad informada de un material y lo agrega al arreglo si es la primera vez que se aumenta
    increaseMaterialsQuantity( material: any ) {
        material.form.quantity ++;
        
        if ( material.form.quantity === 1 ) this.materials_to_report.push( material );
    }

    // Reporta el material informado
    sendReportMaterials() {
        if ( !this.session ) {
            this.util.showAlert( 'Atención', 'No es posible enviar el reporte ya que falta información de la sesión.' );
            
            return;
        }
        
        if ( !this.form.selected_date ) {
            this.util.showAlert( 'Atención', 'Por favor, seleccione una fecha.' );
        
            return;
        }
        
        const loading = this.loading.create( { content: 'Enviando reporte' } );
        
        loading.present();

        let body = {
            materiales: [],
            fecha_recepcion: new Date( this.form.selected_date ),
            usuario_id: this.session.usuario.id,
            session_id: this.session.sessionid,
            uuid: 'local'
        };

        // Agregamos los materiales reportados al cuerpo del request
        _.forEach( this.materials_to_report, ( material: any ) => {
            body.materiales.push( {
                producto_id: material.id,
                cantidad_reportar: material.form.quantity,
                cantidad_total: material.cantidad,
                codigo_material: material.codigo,
                estadomaterial_id: 2
            } );
        } );

        this.request
            .put( config.endpoints.oldApi.put.report, body, false )
            .then( async ( response: any ) => {
                loading.dismiss();
                if ( response && response.message === config.api_messages.report ) {
                    this.util.showAlert( 'Éxito', 'Materiales reportados correctamente.' );
                    
                    this.report = await this.getReportMaterial( this.report_id, false );
                    
                    // this.materials_to_report = [];
                    
                    this.form = {
                        date: null,
                        selected_date: null
                    };
                    
                    return;
                }
                this.util.showAlert('Atención', 'No ha sido posible enviar el reporte, intente nuevamente.');
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.util.showAlert('Atención', 'No ha sido posible enviar el reporte, intente nuevamente.');
                loading.dismiss();
            }
        );
    }

    // Navega hasta la vista para editar un material (o reportarlo por primera vez)
    navigateToEditMaterial( material_id: any ) {
        this.navCtrl.push( EditMaterialReportPage, { material_id: material_id } );
    }

    // Retorna la fecha actual en formato YYYY-MM-DD
    getCurrentDate() {
        let date = new Date();
        
        let month = date.getMonth() + 1;
        
        let day = date.getDate();

        return ( date.getFullYear() + '-' + ( ( month < 10 ) ? ( '0' + month ) : month ) + '-' + ( ( day < 10 ) ? ( '0' + day ) : day ) );
    }
}
