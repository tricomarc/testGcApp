import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import {
	LoadingController,
	MenuController,
	Events,
	AlertController,
	ModalController,
	Platform,
	ActionSheetController,
	Content
} from 'ionic-angular';

import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Storage } from "@ionic/storage";

import {
	GoogleMaps,
	GoogleMap,
	GoogleMapsEvent,
	GoogleMapOptions,
	CameraPosition,
	MarkerOptions,
	Marker,
	MarkerIcon,
	HtmlInfoWindow,
	ILatLng,
	BaseArrayClass,
	LatLng
} from '@ionic-native/google-maps';

import * as _ from 'lodash';

// Configuración global
import { global } from '../../../shared/config/global';
import { globalConfig } from '../../../config';

import { UtilProvider } from '../../../shared/providers/util/util';

import { trucksPatents, mapStyles, ITruck } from '../ver-rutas.config';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';


@IonicPage()
@Component({
	selector: 'page-detalle-ruta',
	templateUrl: 'detalle-ruta.html',
})
export class DetalleRutaPage {

	@ViewChild(Content) content: Content;

	private map: GoogleMap; // defino el mapa
	private mapSubscription: any = null;
	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

	private truckMarker: Marker;

	// 0 = Cargando; 1 = Cargado con éxito; 2 = Cargado con error
	private mapStatus: number = 0;
	private snappedPoints = [];

	private patents: ITruck[] = [];
	private currentTruck: ITruck = null;
	private truckInfoWindow: HtmlInfoWindow;
	private truckInfo: HTMLElement;

	constructor(
		public navCtrl: NavController,
		public navParams: NavParams,
		private util: UtilProvider,
		private menu: MenuController,
		private loading: LoadingController,
		private events: Events,
		private actionSheet: ActionSheetController,
		private geolocation: Geolocation,
		private locationAccuracy: LocationAccuracy,
		private zone: NgZone,
		private diagnostic: Diagnostic,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
	}

	ionViewDidLoad() {
		// track de vista
		this.firebaseAnalyticsProvider.trackView( 'DetalleRutaVerRutas' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'DetalleRuta', 'VerRutas' );

		// probamos que venga la patente seleccionada
		console.log('patente seleccionada', this.navParams.data.selectedPatent);

		this.patents = trucksPatents;

		if (this.navParams.data.selectedPatent) {
			this.currentTruck = _.find(trucksPatents, { placa: this.navParams.data.selectedPatent });
			this.loadMap();
		}
	}

	ionViewWillEnter() {
		this.menu.swipeEnable(false, "menu");
	}

	ionViewWillUnload() {
		this.killMapProcess();
	}

	// Detiene los procesos del mapa
	killMapProcess() {
		this.menu.swipeEnable(true, "menu");

		// Eliminamos el mapa
		try {
			if ( this.mapSubscription ) {
				this.mapSubscription.unsubscribe();
				
				// borrar
				console.log( 'mapSubscription.unsubscribe 1' )
			}
			
			this.truckMarker = null;
			
			if ( this.map ) {
				// borrar
				console.log( 'map remove 2' )
				
				this.map.setDiv(null);
				
				this.map.remove()
					.then( ( success ) => {
						this.map = null;
						
						// borrar
						console.log('map remove 3')
					} ).catch( ( error ) => {
						// borrar
						console.log( 'map remove 4', error )
						
						this.map = null;
					}
				);
			}
		} catch ( e ) {
			// borrar
			console.log('map remove 5', e)
			
			this.map = null;
		}
	}

	// filtro de patentes
	filterbyPatent() {
		console.log('this.currentTruck', this.currentTruck)
		this.setTruckPoss();
	}

	onSearchTrucks( event ) {
		// CIERRO INFOWINDOW
		this.truckInfoWindow.close();
	}

	// mapa
	loadMap() {
		// ubicacion del camion
		const truckPoss = { lat: this.currentTruck.lat, lng: this.currentTruck.lng };

		this.zone.run(() => {
			// 1
			try {
				const mapOptions: GoogleMapOptions = {
					camera: {
						target: truckPoss,
						zoom: 13,
						tilt: 0
					},
					styles: mapStyles,
					controls: {
						zoom: false,
						myLocationButton: false,
						compass: false,
						indoorPicker: false,
						myLocation: false,
						mapToolbar: false
					}
				}

				this.map = GoogleMaps.create('map_canvas', mapOptions);

				let loading = this.loading.create({ content: 'Cargando mapa.' });

				loading.present();

				// ME SUBSCRIBO AL EVENTO CUANDO EL MAPA ESTE LISTO
				this.mapSubscription = this.map
					.on(GoogleMapsEvent.MAP_READY)
					.subscribe((success: any) => {

						// marco el punto del camion con la patente seleccionada/filtrada
						this.setTruckPoss();

						// borrar
						console.log('exito', success);

						// Si el mapa carga exitosamente y tiene estado 0 o 1
						if (this.mapStatus !== 2) {
							// cambio estado a cargado con éxito
							this.mapStatus = 1;
						}

						// ajusto la vista
						this.content.resize();

						this.content.scrollToTop();
					}, (error: any) => {
						console.log(error);
					}
					);

				// contamos el tiempo que demora en cargar con exito el mapa
				let mapTimer: number = 0;

				let mapInterval = setInterval(() => {
					// Si el mapa cargó exitosamente
					if (this.mapStatus === 1) {
						// 2
						try {
							// Me desuscribo al evento MAP_READY
							if (this.mapSubscription) this.mapSubscription.unsubscribe();

							loading.dismiss();

							// limpio el timer
							clearInterval(mapInterval);

							// Ajustamos el tamaño de la vista
							this.content.resize();

							this.content.scrollToTop();

							return;
						} catch (err) {
							console.log('error try 2', err);
						}
					}

					// si no carga en 10 segundos
					if (this.mapStatus === 0 && mapTimer > 10) {
						// 3
						try {
							if (this.mapSubscription) this.mapSubscription.unsubscribe();
							loading.dismiss();

							// cambiamos el estado a cargado con error
							this.mapStatus = 2;

							// limpio el timer
							clearInterval(mapInterval);

							// Ajustamos el tamaño de la vista
							this.content.resize();

							this.content.scrollToTop();
						} catch (err) {
							console.log('error try 3', err);
						}
					}
					// sumo tiempo al timer
					mapTimer++;
				}, 1000);
			} catch (err) {
				console.log('error try 1', err);
			}
		});
	}

	// Marcar el camion en el mapa
	setTruckPoss() {
		// posicion
		const truckPoss: LatLng = new LatLng(this.currentTruck.lat, this.currentTruck.lng);

		console.log( 'camera position: truckposition', truckPoss );

		const cameraPoss: CameraPosition<ILatLng> = {
			target: truckPoss,
			zoom: 13
		};

		//console.log( 'trukposs', truckPoss );
		console.log( 'cameraPoss', cameraPoss );

		// configuracion del icono
		const truckIcon: MarkerIcon = {
			url: 'assets/img/icontruck.png',
			size: {
				width: 60,
				height: 60
			},
		};

		// opciones del marker
		const markerOptions: MarkerOptions = {
			icon: truckIcon,
			position: truckPoss
		};

		// INFOWINDOW
		this.truckInfoWindow = new HtmlInfoWindow();

		this.truckInfo = document.createElement('div');

		this.truckInfo.innerHTML = [
			'<p> Patente: ' + this.currentTruck.placa + '</p>',
			'<p> Ubicacion: ' + this.currentTruck.ubicacion + '</p>',
			'<p> Hora: ' + this.currentTruck.hora + '</p>',
			'<p> Velocidad: ' + this.currentTruck.velocidad + '</p>',
			'<p> Estado: ' + this.currentTruck.estado + '</p>',
			'<p> Temperatura: ' + this.currentTruck.temperatura + '</p>'
		].join("");

		this.truckInfoWindow.setContent( this.truckInfo, {
			width: '200px',
			height: '200px'
		} );

		// ASOCIO EL MARKER LA PRIMERA VEZ QUE ENTRA
		if ( !this.truckMarker ) {
			this.map.addMarker( markerOptions ).then( ( marker: Marker ) => {
				marker.on( GoogleMapsEvent.MARKER_CLICK ).subscribe( () => { 
					this.truckInfoWindow.open( marker );
				} );

				// guardo el marker
				this.truckMarker = marker;
			} );
			
			return;
		}

		this.zone.run( () => {
			this.map.setCameraZoom( 13 );
			
			this.map.setCameraTarget( truckPoss );
		})
		
		this.truckMarker.setPosition( truckPoss );
		
		// borrar
		console.log('truckMarker despues del marker', this.truckMarker);
		
		// ASOCIO EL EVENTO AL MARKER
		this.truckMarker.on( GoogleMapsEvent.MARKER_CLICK ).subscribe( ( ) => {
			//borrar
			console.log( 'desde el infowindow', this.truckInfo );
	
			this.truckInfoWindow.open( this.truckMarker );
		} );
	}

	/* Ajustamos los puntos con snap to road del tipo get( url, data, function ):
	$.get( 'https://roads.googleapis.com/v1/snapToRoads', data, function );

	Un tercer caso de uso de esta función es enviar tres parámetros, 
	uno con la ruta de la página a solicitar, 
	otro con datos que se enviarían en la URL de la solicitud HTTP (que recibiremos en el servidor por el método GET) 
	y una función para hacer cosas cuando la solicitud haya sido completada y se tenga el resultado. */
	snapPoints(routePoints: any) {
		// api key de google para android
		let apiKey = "AIzaSyDxm6IaHIk1BTRrfNcWB5RsC5qu80DzUy8";

		// creamos el path con los puntos a ajustar
		let snapPath = [];

		_.forEach(routePoints, (routePoint) => {
			snapPath.push(_.concat(routePoint.lat, routePoint.lng));
		});

		// PENDIENTE
		/* hacemos el ajustamiento
		$.get( 'https://roads.googleapis.com/v1/snapToRoads', {
			interpolate: true,
			key: apiKey,
			path: _.join( snapPath, '|' )
		}, function ( data ){
			console.log( data );
		} );
		*/
	}



}


