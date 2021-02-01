import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, LoadingController, Platform, ModalController } from 'ionic-angular';
import { DatePicker } from '@ionic-native/date-picker';
import { Camera, CameraOptions } from '@ionic-native/camera';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';

// Configuración del componente
import { config } from './edit-material-report.config';

// Configuración global
import { global } from '../../../shared/config/global';
import { globalConfig } from '../../../config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';
import { CameraComponent } from '../../../shared/providers/camera/component/camera';

@IonicPage()
@Component({
	selector: 'page-edit-material-report',
	templateUrl: 'edit-material-report.html',
})

export class EditMaterialReportPage {

	// Atributos
	private material: any = null;
	private material_id: any = null;
	private errors: any = [];
	private form: any = {
		date: {
			segment: null
		},
		status: null,
		quantity: 0,
		error_reason: null,
		photo: null,
		commentary: null
	};
	
	// Segmentos con opciones para la fecha del reporte
	private segments: any = [ {
		label: null,
		key: 'custom',
		value: null
	}, 
	{
		label: 'Ayer',
		key: 'yesterday',
		value: this.getYesterday()
	}, 
	{
		label: 'Hoy',
		key: 'today',
		value: new Date()
	} ];

	private statuses: any = [ {
		id: 'Correcto',
		label: 'Buen estado',
		icon: 'md-thumbs-up',
		class: 'segment-balanced',
		active: false
	}, 
	{
		id: 'Incorrecto',
		label: 'Mal estado',
		icon: 'md-thumbs-down',
		class: 'segment-assertive',
		active: false
	}, 
	{
		id: 'No llegó la gráfica',
		label: 'No llegó la gráfica',
		icon: 'md-close-circle',
		class: 'segment-energized',
		active: false
	} ];
	
	private session: any = null;
	
	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private view: string = null;

    // Constructor
	constructor(
		private navCtrl: NavController,
		private navParams: NavParams,
		private events: Events,
		private datePicker: DatePicker,
		private camera: Camera,
		private platform: Platform,
		private loading: LoadingController,
		private request: RequestProvider,
		private util: UtilProvider,
		private modal: ModalController,
		private sessionProvider: SessionProvider,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider ) {
	}

	// Método que se ejecuta cuando carga la vista
	async ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'EditMaterialReportMaterials' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'EditMaterialReport', 'Materials' );

		let material_id = this.navParams.data.material_id;
		
		if ( !material_id ) {
			this.util.showAlert( 'Atención', 'Falta información del material' );
			
			this.navCtrl.pop();
			
			return;
		}
		
		this.material_id = material_id;
		
		this.material = await this.getMaterialReportDetail( material_id );
		
		this.errors = await this.getErrors();

		this.session = await this.sessionProvider.getSession();
	}

	// Retorna la lista de errores que se le pueden asignar a un reporte
	async getErrors() {
		let errors = [];
		await this.request
			.get(config.endpoints.oldApi.get.errors, false)
			.then((response: any) => {
				if (response && response.data) errors = response.data;
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showToast('No ha sido posible obtener la lista de errores.', 3000);
			});
		return errors;
	}

	// Retorna el detalle de un material
	async getMaterialReportDetail( material_id: any ) {
		// loading
		const loading = this.loading.create({ content: 'Obteniendo detalle...' });

		loading.present();
		
		let material = null;
		
		await this.request.get( ( config.endpoints.oldApi.get.detail + material_id ), false )
			.then( ( response: any ) => {
				loading.dismiss();

				if ( response && response.data && response.data.length > 0 ) {
					material = response.data[0];
					
					// Si el material ya fue recepcionado y tiene fecha de recepción iniciamos el segmento en ese valor
					if ( material.estado_material !== 'Pendiente' ) {
						let date = new Date( material.fecha_recepcion + ' 00:00:00' );
						
						if ( material.fecha_recepcion && !isNaN( date.getTime() ) ) {
							this.segments[0].value = new Date( material.fecha_recepcion + ' 00:00:00' );
							
							this.segments[0].label = this.util.getFormatedDateFromString( material.fecha_recepcion );
							
							this.form.date.segment = this.segments[0];
						}
						
						this.form.quantity = material.cantidad_reportada;

						// Si se conoce el estado lo incializamos
						let status = _.find( this.statuses, { id: material.estado_material } );
						
						if ( status ) {
							status.active = true;
							
							this.form.status = status;
						}
					}
				}
			})
			.catch((error: any) => {
				loading.dismiss();
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.util.showAlert('Atención', 'No ha sido posible obtener el detalle del material.');
			});
		return material;
	}

	// Retorna la fecha de ayer
	getYesterday() {
		let date = new Date();
		
		date.setDate( date.getDate() - 1 );
		
		return date;
	}

	// Si la fecha es "custom", muestra una ventana para seleccionarla, de lo contrario asigna la fecha de ayer u hoy según corresponda
	changedSegementDate() {
		if ( this.form.date.segment && this.form.date.segment.key === 'custom' ) {
			this.datePicker
				.show( {
					date: (this.form.date.segment.value ? this.form.date.segment.value : new Date()),
					mode: 'date',
					androidTheme: this.datePicker.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT,
					maxDate: ( this.platform.is( 'ios' ) ? new Date() : ( new Date() ).valueOf() )
				} ).then( ( date: any ) => {
					this.segments[0].value = date;
					
					this.segments[0].label = this.util.getFormatedDateFromObject( date );
					
					this.form.date.segment = this.segments[0];
				}, ( error: any ) => {
                    this.util.showAlert( "Atención", "Fecha no seleccionada" );
				} );
		}
	}

	// Alterna el status de los estados
	changedStatus() {
		if ( this.form.status.id === 'No llegó la gráfica' ) this.form.date.segment = null;
		
		_.forEach( this.statuses, ( status: any ) => {
			if ( this.form.status.id === status.id ) status.active = true;
			
			else status.active = false;
		});
	}

	// Disminuye en 1 la cantidad a reportar
	decreaseMaterialsQuantity() {
		this.form.quantity--;
	}

	// Aumenta en 1 la cantidad a reportar
	increaseMaterialsQuantity() {
		this.form.quantity++;
	}

	// Elimina la fotografía del formulario
	removePhoto() {
		this.form.photo = null;
	}

	// Solicita tomar una fotografía
	async takePhoto() {
		let image = await this.getImage();
		if ( !image ) return;
		this.form.photo = image;
	}

	// Solicita una foto al proveedor y la retorna	
	async getImage(fromUtils?: boolean) {
        let image = null;
        if(fromUtils){
            await this.util.getImage(globalConfig.isBrowser)
                .then((result) => { image = result; })
                .catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
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
    

	// Valida y envía el reporte del material
	sendReport() {
		if ( !this.form.status ) { this.util.showAlert( 'Atención', 'Seleccione el estado del material' ); return; }

		let body = {
			estadomaterial_id: null,
			cantidad_reportada: null,
			fecha_recepcion2: null,
			fecha_recepcion: null,
			material_material_reporte_id: this.material_id,
			incorrecto: null,
			foto: [],
			error_id: null,
			observacion: null,
			foto_incorrecta: ''
		};

		if ( this.form.status.id === 'Correcto' ) {
			if ( !this.form.date.segment ) { this.util.showAlert( 'Atención', 'Seleccione una fecha' ); return; }
			
			if ( !this.form.quantity ) { this.util.showAlert( 'Atención', 'Ingrese la cantidad de material recibido' ); return; }
			
			if ( this.form.quantity.toString().length > 7 ) { this.util.showAlert( 'Atención', 'La cantidad ingresada debe ser menor a 7 dígitos' ); return; }

			body.estadomaterial_id = 2;
			
			body.cantidad_reportada = this.form.quantity;
			
			body.fecha_recepcion = this.form.date.segment.value;
			
			body.fecha_recepcion2 = this.form.date.segment.value;

		} else if ( this.form.status.id === 'Incorrecto' ) {
			if ( !this.form.date.segment ) { this.util.showAlert( 'Atención', 'Seleccione una fecha' ); return; }
			
			if ( !this.form.quantity ) { this.util.showAlert( 'Atención', 'Ingrese la cantidad de material recibido' ); return; }
			
			if ( this.form.quantity.toString().length > 7 ) { this.util.showAlert( 'Atención', 'La cantidad ingresada debe ser menor a 7 dígitos' ); return; }
			
			if ( !this.form.error_reason ) { this.util.showAlert( 'Atención', 'Seleccione el motivo por el cual el material está incorrecto' ); return; }
			
			if ( !this.form.photo ) { this.util.showAlert( 'Atención', 'Por favor adjunte una fotografía del material' ); return; }

			body.estadomaterial_id = 3;
			
			body.cantidad_reportada = this.form.quantity;
			
			body.error_id = this.form.error_reason;
			
			body.foto_incorrecta = this.form.photo;
			
			body.observacion = this.form.commentary;
			
			body.fecha_recepcion = this.form.date.segment.value;
			
			body.fecha_recepcion2 = this.form.date.segment.value;

		} else if ( this.form.status.id === 'No llegó la gráfica' ) {
			body.estadomaterial_id = 4;
			
			body.cantidad_reportada = 0;
		} else {
			this.util.showAlert( 'Atención', 'Estado desconocido, no es posible continuar' );
			
			return;
		}

		const loading = this.loading.create( { content: 'Enviando material' } );
		
		loading.present();

		this.request.put( config.endpoints.oldApi.put.edit, body, false )
			.then( ( response: any ) => {
				loading.dismiss();
				
				if ( response && response.message === config.api_messages.edit ) {
					this.util.showAlert( 'Éxito', 'Se reportó el material exitosamente' );
					
					this.navCtrl.pop();
					
					this.events.publish( 'materialChanged' );
					
					return;
				}
				this.util.showAlert('Atención', 'Material no reportado, intente nuevamente');
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				
				this.util.showAlert( 'Atención', 'Material no reportado, intente nuevamente' );
			}
		);
	}
}
