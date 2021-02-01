import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import {
	IonicPage,
	NavController,
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
	Environment,
	Circle,
	MarkerIcon,
	MarkerClusterOptions,
	MarkerClusterIcon,
	MarkerLabel,
	MarkerCluster
} from '@ionic-native/google-maps';

import { FormControl } from '@angular/forms';

import * as _ from 'lodash';


import { IncidentsBranchOfficePage } from '../incidents/branch-office/incidents-branch-office';
import { ChecklistTiendaPage } from '../checklist/tienda/checklist-tienda';
import { ChecklistsSucursalPage } from '../checklist/sub-pages/checklists-sucursal/checklists-sucursal';

// Proveedores
import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';
import { SessionProvider } from '../../shared/providers/session/session';

// Componentes
import { AlertsComponent } from './components/alerts/alerts';
import { ChecklistHistoricalComponent } from '../checklists/components/checklist-historical/checklist-historical';

// Configuración del componente
import { config } from './map-visit.config';

// Configuración global
import { global } from '../../shared/config/global';

import { globalConfig } from '../../config';
import { interval, Observable, Subscription } from 'rxjs';
import { ZonalPositionComponent } from './components/zonal-position/zonal-position';
import { VisitHistoricalComponent } from './components/visit-historical/visit-historical';
import { ISetting } from '../../shared/interfaces/setting.interface';
import { AsignacionPage } from '../visita/sub-pages/asignacion/asignacion';
import { FirebaseAnalyticsProvider } from '../../shared/providers/firebase-analytics/firebase-analytics';
import { VisitaSucursalPage } from '../visita/sub-pages/sucursal/sucursal';
import { DictionaryProvider } from '../../shared/providers/dictionary/dictionary';
import { CreateStoreComponent } from './components/create-store/create-store';
import { TaskAssignmentComponent } from '../task-manager/components/task-assignment/task-assignment';
import { TaskManagerPage } from '../task-manager/task-manager';

declare var google;

@IonicPage()
@Component({
	selector: 'page-map-visit',
	templateUrl: 'map-visit.html',
})

export class MapVisitPage {

	@ViewChild(Content) content: Content;

	private searchControl = new FormControl();

	// Atributos
	private map: GoogleMap;

	private markers: any = {
		user: null,
		branchOffices: []
	};

	private circle: Circle = null;
	private gpsSubscription: any = null;
	private gpsWatcher: any = null;
	private locations = {
		show: [],
		bad: [],
		good: [],
		outOfRange: []
	};

	private params = {
		proximity: 500,
		accurate: 500,
		useHighAccuracy: false,
		minimumGoodLocations: 10,
		minimumBadLocations: 30,
		acceptedDistance: 500,
		zoom: 16,
		timeout: 15000,
		iconPath: 'assets/img/',
		stopFlow: true,
		showListInstead: (globalConfig.isBrowser ? true : false),
		showDistance: true,
		hideZonalLastPosition: false,
		forceCheckout: true,
		showPrecision: true,
		showRevision: false
	};
	private availableServices = {
		gps: false,
		internet: false,
		position: true
	};

	private positionPagination: { lat: number; lng: number } = null;

	private revisar: boolean = false;
	private branchOffices: any = [];
	private selectedBranchOffice: any = null;
	private currentCheckin: any = null;
	private title: string = global.title; //Nombre para mostrar de la App
	private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
	private platformType: string = null;

	private alertModal: any = null;
	private gpsInterval: any = null;

	private session: any = {};
	private visits: any = null;

	private mapStatus: number = 0; // 0 = Cargando; 1 = Cargado con éxito; 2 = Cargado con error
	private branchOfficesList: any = [];

	private elapsedTimeInterval: any = null;
	private mapSubscription: any = null;

	private isIncidentsModule: boolean = false;

	private isDefaultPositionUsed: boolean = false;
	private loadingInit: any = null;

	private checklistMessage: string = null;
	private checkOutAlertShown = {
		close: false,
		halfFar: false,
		far: false
	};
	private checkinFarLevel: string = null;

	// Representa el estado de carga cuando se actualiza la data
	private requesting: boolean = false;

	private checkoutAlert: any = null;

	public static isAlertActive: boolean = false;
	private scrollSub: any = null;
	private branchOfficeLengthAlertShown: boolean = false;
	private static checkIn: boolean = false;

	private checklistSetting: any = null;

	private checkoutAvailable: boolean = false;

	private scrollSearching: boolean = false;

	// diccionario
	private sucursal: string;
	private sucursales: string;
	private tienda: string;
	private tiendas: string;
	private activeCreateStore: boolean = false;

	// Paginación listado
	private requestParams: { page: number; pageSize: number; q: string } = {
		page: 1,
		pageSize: 20,
		q: ''
	};

	private searchControlSubscription: Subscription = null;
	private scrollControlSubscription: Subscription = null;

	private isNextPage: boolean = true;
	private markerCluster: MarkerCluster = null;

	private searching: boolean = false;

	// Constructor
	constructor(private navCtrl: NavController,
		private loading: LoadingController,
		private request: RequestProvider,
		private util: UtilProvider,
		private sessionProvider: SessionProvider,
		private menu: MenuController,
		private geolocation: Geolocation,
		private events: Events,
		private alert: AlertController,
		private modal: ModalController,
		private diagnostic: Diagnostic,
		private locationAccuracy: LocationAccuracy,
		private storage: Storage,
		private platform: Platform,
		private actionSheet: ActionSheetController,
		private elementRef: ElementRef,
		private zone: NgZone,
		private firebaseAnalyticsProvider: FirebaseAnalyticsProvider,
		private dictionary: DictionaryProvider) {
		this.platformType = (this.platform.is('ios') ? 'ios' : 'android');
		if (this.platformType === 'ios') this.params.iconPath = 'www/assets/img/';
	}

	subscribeScroll() {
		this.scrollControlSubscription = this.content.ionScrollEnd.subscribe(async (event: any) => {
			if (!event) return;
			if (this.mapStatus !== 2) return;
			if (this.scrollSearching) return;
			if ((event.scrollTop + this.content.getContentDimensions().contentHeight) + 100 > this.content.getContentDimensions().scrollHeight) {
				this.scrollSearching = true;
				this.requestParams.page += 1;
				const loading = this.loading.create({ content: `Cargando ${this.tiendas}...` });
				loading.present();
				await this.getBranchOfficesPaginated();
				await this.drawClusterOffices();
				loading.dismiss();
				this.scrollSearching = false;
			}
		});
	}

	subscribeSearch() {
		this.searchControlSubscription = this.searchControl.valueChanges
			.debounceTime(400) // Cuando se deja de tipear por 300 ms
			.distinctUntilChanged() // Si el input es distinto
			.subscribe(async (searchTerm: any) => {

				this.searching = true;
				this.markers.branchOffices = [];

				try {
					this.markerCluster.remove();
					this.markerCluster = null;
				} catch (e) { }

				this.resetBOFF();
				this.requestParams.q = searchTerm;
				await this.getBranchOfficesPaginated();
				await this.drawClusterOffices();

				_.delay(() => {
					this.searching = false;
				}, 700);
			});
	}

	resetBOFF() {
		this.requestParams.page = 0;
		this.requestParams.pageSize = 30;
		this.requestParams.q = '';
		this.branchOffices = [];
		this.branchOfficesList = [];
	}

	// Método del ciclo de vida de la vista, se ejecuta antes de entrar a la vista
	async ionViewWillEnter() {
		this.menu.enable(true, "menu");
		this.menu.swipeEnable(false, "menu");

		// Obtenemos la sesión del usuario
		this.sessionProvider.getSession()
			.then(async (response: any) => {
				this.session = response;
				this.setUserSettings();

				// Verificamos si el usuario tiene el módulo de incidencias
				this.isIncidentsModule = this.checkModuleAvailability();

				// Obtenemos las visitas locales
				this.visits = await this.getUserLocalVisits();
				// Si no hay sucursales, actualizamos por primera vez
				if (!this.visits || !this.visits.sucursales || !this.visits.sucursales.length) {
					this.updateUserVisitsData().then(async () => {
						this.visits = await this.getUserLocalVisits();
					}).catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
				}
			});

		// Escuchamos cuando vuelve la conexión a internet
		this.events.subscribe('network-connected', () => {
			this.availableServices.internet = true;
			this.checkAvailableServices();
			// Revisamos que no tenga checkins
			this.getCheckInFromService();
		});

		// Escuchamos cuando perdemos la conexión a internet
		this.events.subscribe('network-disconnected', () => {
			// Si el mapa no ha cargado, bloqueamos la vista por no Internet
			if (!this.map) {
				this.availableServices.internet = false;
				this.checkAvailableServices();
			}
		});

		this.startGpsInterval();

		this.zone.run(() => {
			this.content.resize();
		});

		_.delay(() => {
			if (this.map) {
				this.map.setDiv(!this.params.showListInstead ? 'map_canvas' : 'map_canvas_hidden');
				this.map.setVisible(true);
			}
		}, 1000);


		this.enableCreateStore();
	}

	// Método del ciclo de vida de la vista, se ejecuta cuando la vista perderá el focus
	async ionViewWillLeave() {
		// Dejamos de escuchar los cambios de red
		this.events.unsubscribe('network-connected');
		this.events.unsubscribe('network-disconnected');
		// Habilitamos el menu al hacer swipe
		this.menu.swipeEnable(true, "menu");
		// Detenemos el intervalo que mira el estado del servicio de GPS
		this.stopGpsInterval();

		if (this.platform.is('android')) {
			this.map.setVisible(false);
			this.map.setDiv(null);
		}
	}

	// Método del ciclo de vida de la vista, se ejecuta cuando la vista se destruye
	ionViewWillUnload() {
		this.killMapProcess();
	}

	// Método del ciclo de vida de la vista, se ejecuta cuando la vista termina de cargar
	async ionViewDidLoad() {
		this.subscribeSearch();
		this.subscribeScroll();

		try {
			// TRACK DE VISTA
			this.firebaseAnalyticsProvider.trackView('MapVisit');
		} catch (e) { }

		try {
			const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');

			if (auxSetting && auxSetting.params) {
				this.checklistSetting = { value: JSON.parse(auxSetting.params).version }
			} else { this.checklistSetting = null }
		} catch (e) { }

		await this.dictionary.getDictionary().then((dictionary: any) => {
			this.sucursal = dictionary['Sucursal']
			this.sucursales = dictionary['Sucursales']
			this.tienda = dictionary['Tienda']
			this.tiendas = dictionary['Tiendas'] ? dictionary['Tiendas'] : 'Tiendas';
		});

		this.events.subscribe('checklists-closed', (data) => {
			this.checklistMessage = data.message;
		});

		this.events.subscribe('close-from-alert', () => {
			this.closeAlertModal(true);
			this.killMapProcess();
		});

		this.events.subscribe('registered-checkout', () => {
			this.clearCheckIn();
			this.sendAnswersVisits(false, true);
			this.setUserCenter();
		});

		this.events.publish('close-menu-checkout-alert');

		// Observamos los cambios en el campo de búsqueda
		// this.watchSearch();

		// Definimos si usamos o no alta presición
		this.params.useHighAccuracy = await this.isGpsLocationEnabled();

		// Asignamos los valores para los servicios de internet y gps
		this.availableServices.internet = this.util.isNetworkConnected(globalConfig.isBrowser);
		this.availableServices.gps = await this.checkGpsEnabled();

		// Si comenzamos con el gps apagado, asumimos que no tenemos ubicación
		if (!this.availableServices.gps) {
			this.availableServices.position = false;
		}

		// Verificamos que los servicios estén encendidos
		this.checkAvailableServices();

		this.loadingInit = this.loading.create({ content: 'Buscando ubicación.' });

		// Si no se bloquea la vista por un error, mostramos el loading
		if (!this.alertModal) this.loadingInit.present();

		// Obtenemos la primera posición y las sucursales
		let position = await this.getPosition();

		if (position && position.latitude) {
			this.positionPagination = { lat: position.latitude, lng: position.longitude }
		}

		this.loadingInit.setContent(`Buscando ${this.tiendas} `);

		// this.branchOffices = await this.getBranchOffices();
		this.isNextPage = await this.getBranchOfficesPaginated();

		_.delay(() => {
			try {
				this.loadingInit.dismiss();
				this.loadingInit = null;
			} catch (e) {
				this.loadingInit = null;
			}
		}, 3000);

		// Si tenemos la primera posición cargamos el mapa
		if (position.latitude && position.longitude) {
			setTimeout(() => {
				this.loadMap(position);
			}, 1000);
		} else {
			// Si no tenemos la ubicación y si tenemos detención de flujo, informamos al usuario y reintentamos obtener la ubicación hasta que esté disponible
			if (this.params.stopFlow) {
				this.availableServices.position = false;
				this.checkAvailableServices();
			} else {
				setTimeout(() => {
					this.availableServices.position = true;
					this.isDefaultPositionUsed = true;
					// Si no, habilitamos el checkin manual (centro en Santaigo)
					this.loadMap({
						latitude: -33.4724228,
						longitude: -70.7699137,
						accuracy: 1,
						currentDate: new Date(),
						currentTimestamp: new Date().getTime()
					});
				}, 1000);
			}
		}

		// Definimos el watcher (Observa los cambios de posición del dispositivo)
		this.gpsWatcher = !globalConfig.isBrowser
			? this.geolocation.watchPosition({ enableHighAccuracy: this.params.useHighAccuracy, maximumAge: 100, timeout: this.params.timeout })
			: this.fakeGps(true);
		// Iniciamos el observador (watcher)
		this.subscribeToLocationChanges();

		// this.content.ionScrollEnd.subscribe((data: any) => {
		// 	if (!data) return;
		// 	if (data.scrollTop + this.content.getContentDimensions().contentHeight > this.content.getContentDimensions().scrollHeight) {
		// 		if (this.mapStatus === 2 && this.markers.branchOffices.length > 50 && !this.branchOfficeLengthAlertShown) {
		// 			this.showLengthInfo();
		// 		}
		// 	}
		// });
	}

	// Busca la distancia máxima para hacer checkin y la asigna al atributo params.acceptedDistance
	// Busca la opción de hacer checkin manual y la asigna al atributo params.stopFlow
	setUserSettings() {
		try {
			// Buscamos el setting de distancia permitida para checkin
			let acceptedDistance = _.find(this.session.usuario.settings, (setting: any) => {
				return setting.nombre === 'control_perimetro_chkin';
			});
			// Buscamos el setting de visita
			let checkstore = _.find(this.session.usuario.settings, (setting: any) => {
				return setting.nombre === 'visita_tipo_checkstore';
			});
			// Buscamos el setting del zoom
			let zoom = _.find(this.session.usuario.settings, (setting: any) => {
				return setting.nombre === 'control_zoom_map';
			});
			// Si encontramos el radio lo asignamos
			if (acceptedDistance && (acceptedDistance.value >= 0)) {
				this.params.acceptedDistance = acceptedDistance.value;
			}
			// Si encontramos el zoom lo asignamos
			if (zoom && (zoom.value > 0)) {
				// Seteamos el zoom dinamicamente según el radio de cada cliente
				this.params.zoom = zoom.value;
			}

			if (checkstore && checkstore.params) {

				let params = JSON.parse(checkstore.params);

				this.params.stopFlow = ((params.checkstore_stop_flow === false) || (global.allowAllCheckinToGeneral && this.session.usuario.jerarquia === 100)) ? false : true;
				this.params.showListInstead = ((params.checkstore_listado === true || globalConfig.isBrowser)) ? true : false;
				this.params.showDistance = (params.checkstore_show_distance === false) ? false : true;
				this.params.hideZonalLastPosition = (params.checkstore_ocultar_ubi_zonales === true) ? true : false;

				// para mostrar o no la precision
				this.params.showPrecision = (params.checkstore_ocultar_precision === true) ? false : true;

				// para mostrar o no la revisión
				this.params.showRevision = (params.checkstore_revisar === true) ? true : false;

				if (this.params.stopFlow || this.params.showListInstead) {
					this.params.iconPath = 'assets/img/';
				}
				this.params.forceCheckout = (params.force_checkout === false ? false : true);
			}
		} catch (e) { }
	}

	// Verifica si los servicios de internet y gps están encendidos
	// Si alguno está apagado, bloquea la vista
	// Si ambos todos están ok, y la vista está bloqueada, la habilita
	async checkAvailableServices() {

		if (this.markers.user) {
			this.availableServices.position = true;
		}

		if (
			(!this.availableServices.internet && !globalConfig.isBrowser)
			|| (this.params.stopFlow && !this.availableServices.position)) {
			if (!this.alertModal) {
				this.showAlertModal();
			}
			return;
		}
		this.closeAlertModal(false);
	}

	// Incia un interval que consulta el estado del gps
	startGpsInterval() {
		// Preguntamos cada 3 segundos si el gps está encendido
		if (!this.gpsInterval) {
			this.gpsInterval = setInterval(async () => {
				let temp = this.availableServices.gps ? true : false;
				this.availableServices.gps = await this.checkGpsEnabled();
				if (this.availableServices.gps !== temp) {
					this.checkAvailableServices();
				}
			}, 3000);
		}
	}

	// Detiene el interval que consulta el estado del gps
	stopGpsInterval() {
		try {
			// Dejamos de verificar el estado del gps
			clearInterval(this.gpsInterval);
			this.gpsInterval = null;
		} catch (e) { }
	}

	// Levanta un modal que bloquea la vista y muestra un mensaje asociado
	showAlertModal() {
		// Registramos la acción del botón atrás para Android
		// La función hace nada, justamente para que no cierre el modal
		// La almacenamos en una variable (deregisterFunction) para luego borrar este registro
		let deregisterFunction = this.platform.registerBackButtonAction(() => { });
		this.alertModal = this.modal.create(AlertsComponent, { availableServices: this.availableServices, session: this.session.usuario });
		this.alertModal.present();
		this.alertModal.onDidDismiss(() => {

			if (this.loadingInit) this.loadingInit.present();

			this.alertModal = null;
			// Eliminamos la función registrada (botón atrás de Android vuelve a la normalidad)
			deregisterFunction();
		});
	}

	// Cierra el modal de alertas y dependiendo de la razón vuelve a ejecutar las funciones necesarias
	closeAlertModal(from_alert: boolean) {
		try {
			this.alertModal.dismiss();
		} catch (e) {
			if (from_alert) this.events.publish('alert-not-closed');
		}
	}

	/* Pinta las sucursales en el mapa
	async drawBranchOffices() {
		// Si no hay sucursales las traemos
		if (!this.branchOffices || !this.branchOffices.length) {
			this.branchOffices = await this.getBranchOffices();
		}

		// Recorremos las sucursales
		_.forEach(this.branchOffices, (branchOffice) => {
			// Para cada sucursal, si tiene su latitud y longitud (Y existe el mapa), generamos su marcador
			if (branchOffice.latitud && branchOffice.longitud && this.map) {

				let myLatLng = { lat: branchOffice.latitud, lng: branchOffice.longitud };

				let icon: MarkerIcon = {
					url: (this.params.iconPath + branchOffice.estado_checkin.icono),
					size: {
						width: 40,
						height: 40
					}
				};

				let options: MarkerOptions = {
					icon: icon,
					position: myLatLng,
					title: branchOffice.nombre_real
				};

				try {
					let marker: any = this.map.addMarkerSync(options);
				
					branchOffice.iconUrl = icon.url;

					marker.branchOfficeData = branchOffice;

					// Para cada marcador le agregamos un listener (click)
					this.bindBranchOfficeMarkerClick(marker);
					// Agregamos cada marcador de sucursal a su arreglo
					this.markers.branchOffices.push(marker);

				} catch (e) { }
			}
		});
		this.branchOfficesList = this.markers.branchOffices;
		
		this.calculateDistanceBetweenUserAndBranchOffices();
	}*/

	// FUNCION DE PRUEBA agrupa las sucursales con clusters
	async drawClusterOffices(isFirst?: boolean, fromLoad?: boolean) {

		// Si no hay sucursales las traemos
		if (!this.branchOffices || !this.branchOffices.length) {
			// this.branchOffices = await this.getBranchOffices();
			this.isNextPage = await this.getBranchOfficesPaginated();
		}

		let markersAux = [];

		_.forEach(this.branchOffices, (branchOffice) => {
			if (
				!_.find(this.markers.branchOffices, (m: any) => {
					return m.branchOfficeData.id === branchOffice.id;
				})
			) {
				if (branchOffice.latitud && branchOffice.longitud && this.map) {

					let marker: MarkerOptions = {
						icon: {
							url: this.params.iconPath + branchOffice.estado_checkin.icono,
							size: {
								width: 40,
								height: 40
							}
						},
						position: { lat: branchOffice.latitud, lng: branchOffice.longitud },
						title: branchOffice.nombre_real
					};

					branchOffice.iconUrl = marker.icon.url;

					marker.branchOfficeData = branchOffice;

					markersAux.push(marker);
				}
			}
		});

		if (!this.markerCluster) {
			this.markerCluster = await this.map.addMarkerCluster({
				boundsDraw: false,
				maxZoomLevel: 20,
				markers: markersAux,
				icons: [{
					min: 2,
					max: 1000,
					url: 'assets/img/cluster.png',
					anchor: { x: 16, y: 16 }
				}]
			});
		} else {
			this.markerCluster.addMarkers(markersAux);
		}

		if (fromLoad) {
			// Buscamos si existe un checkin activo
			this.getCheckInFromService();
		}

		markersAux.forEach((m) => this.markers.branchOffices.push(m));

		const subscription = this.map.addEventListener(GoogleMapsEvent.CAMERA_MOVE_END).subscribe(() => {

			_.delay(() => {
				try {

					// REEMPLAZAMOS EL ARREGLO DE MARKERS POR LOS QUE ESTÁN
					// DIBUJADOS EN EL MAPA
					const objIns = this.markerCluster['_objectInstance']
					const mkrMap = objIns['_markerMap'];
					const mkrs = [];

					for (let key in mkrMap) {
						const mAux = this.markers.branchOffices.find((m) => {
							return mkrMap[key].getTitle() === m.branchOfficeData.nombre_real;
						});

						if (mAux) {
							mkrMap[key].branchOfficeData = mAux.branchOfficeData;
							if (mkrMap[key].getTitle) mkrs.push(mkrMap[key]);
						}
					}

					this.markers.branchOffices = mkrs;

					this.markerCluster.off(GoogleMapsEvent.MARKER_CLICK);

					this.markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((data) => {
						if (_.isArray(data) && data.length > 1) {
							let markerAux = _.find(this.markers.branchOffices, function (aux) {
								return aux.getTitle && aux.getTitle() == data[1].getTitle();
							});

							if (!markerAux) {
								markerAux = data[1]['_objectInstance'];
							}

							// accion por evento de click
							this.bindBranchOfficeMarkerClusterClick(markerAux);
						}
					});
				} catch (e) { }

				this.branchOfficesList = this.markers.branchOffices;

				this.calculateDistanceBetweenUserAndBranchOffices();

				subscription.unsubscribe();
			}, 1000);
		});

		if (this.params.showListInstead === true) {
			this.map.trigger(GoogleMapsEvent.CAMERA_MOVE_END);
		} else {
			if (isFirst) this.map.setCameraZoom(this.params.zoom);
		}
	}

	bindBranchOfficeMarkerClusterClick(marker: any) {

		try {
			// Si tenemos un checkin activo, cortamos la ejecución del método
			if (this.currentCheckin) return;

			let markerPosition = marker.position;

			if (!this.params.stopFlow) {
				if (markerPosition && markerPosition.lat) {
					this.map.setCameraTarget({ lat: markerPosition.lat, lng: markerPosition.lng });
				}

				this.selectedBranchOffice = marker;

				this.content.resize();
				return;
			}

			this.zone.run(() => {
				// Obtenemos la distancia entre la sucursal y el usuario
				let distanceToBranchOffice = this.getDistanceToBranchOffice(marker);

				// Si esta distancia es menor o igual al rango + la presición, seleccionamos la sucursal
				if (distanceToBranchOffice <= ((this.markers.user.currentAccuracy > this.params.accurate ? this.params.accurate : this.markers.user.currentAccuracy) + this.params.acceptedDistance)) {
					if (markerPosition && markerPosition.lat) {
						this.map.setCameraTarget({ lat: markerPosition.lat, lng: markerPosition.lng });
					}
					this.selectedBranchOffice = marker;

					this.content.resize();
					return;
				}
				// Si no, informamos al usuario
				this.util.showAlert('Atención', `La ${this.tienda} "${marker.branchOfficeData.nombre_real}" está fuera del rango aceptado.`);
			});
		} catch (e) { }
	}

	// Pinta al usuario en el mapa
	drawUserPosition(myLatLng: any, accuracy: any, position: any) {

		let icon: MarkerIcon = {
			url: (this.params.iconPath + 'mark.png'),
			size: {
				width: 40,
				height: 75
			}
		};

		let options: MarkerOptions = {
			icon: icon,
			position: myLatLng,
			zIndex: -1
		};

		let marker: Marker = this.map.addMarkerSync(options);

		// Add circle
		let circle: Circle = this.map.addCircleSync({
			center: myLatLng,
			radius: (this.params.acceptedDistance + accuracy /* (accuracy > this.params.accurate ? this.params.accurate : accuracy) */),
			strokeColor: global.client_colors.primary,
			strokeWidth: 1,
			fillColor: global.client_colors.primary,
			zIndex: -1,
			fillOpacity: 0.35
		});

		this.circle = circle;

		// Asignamos el marcador al atributo de la clase (markers.user)
		this.markers.user = marker;


		// Definimos la presición de la nueva ubicación
		this.markers.user.currentAccuracy = Math.round(accuracy);


		// La fecha de la ubicación
		this.markers.user.currentDate = position.currentDate;


		// El timestamp que entrega el plugin
		this.markers.user.currentTimestamp = position.currentTimestamp;


		// El mensaje del tiempo transcurrido
		this.markers.user.elapsedTimeMessage = '';

		this.startIntervalElapsedTime();
	}

	// Carga el mapa
	loadMap(position: any) {
		if (this.map) return;

		this.zone.run(async () => {
			try {
				// Posición inicial
				let latitude = position.latitude;
				let longitude = position.longitude;

				// Objeto con latitud y longitud para centrar el mapa
				let myLatLng = { lat: latitude, lng: longitude };

				// Definimos y creamos el mapa si no existe
				let mapOptions: GoogleMapOptions = {
					camera: {
						target: myLatLng,
						zoom: this.params.zoom,
						tilt: 0
					},
					styles: config.map_styles,
					controls: {
						zoom: false,
						myLocationButton: false,
						compass: false,
						indoorPicker: false,
						myLocation: false,
						mapToolbar: false
					}
				};

				this.map = GoogleMaps.create(!this.params.showListInstead ? 'map_canvas' : 'map_canvas_hidden', mapOptions);

				// Dibujamos la ubicación del usuario
				this.drawUserPosition(myLatLng, position.accuracy, position);

				// Dibujamos las sucursales en el mapa
				//this.drawBranchOffices();

				// FUNCION PRUEBA CLUSTERING
				this.drawClusterOffices(false, true);

				this.checkoutAvailable = true;

				// Si no se debe mostrar el mapa, habilitamos la lista
				if (this.params.showListInstead) {
					// Consideramos que falló al cargar

					this.zone.run(() => { this.mapStatus = 2; })
					// Ajustamos el tamaño de la vista
					this.content.resize();

					_.delay(() => {
						try {

							let elem = document.getElementById("map_canvas_hidden") as HTMLElement;
							let elem2 = document.getElementById("map_curtain") as HTMLElement;

							this.zone.run(() => {
								if (this.platform.is('ios')) {
									elem.style.display = 'none';
									elem.style.visibility = 'hidden';
									elem.style.opacity = '0';
									elem.style.zIndex = '-1';

									elem2.style.zIndex = '0';
								} else {
									elem.style.position = 'absolute';
									elem.style.bottom = '-300px';
									elem.style.right = '-300px';
									elem.style.zIndex = '-1';

									elem2.style.position = 'absolute';
									elem2.style.bottom = '-300px';
									elem2.style.right = '-300px';
									elem2.style.zIndex = '-1';
								}
							});


						} catch (e) { }
					}, 150);

					this.content.scrollToTop();
					return;
				}


				let loading = this.loading.create({ content: 'Cargando mapa.' });
				loading.present();

				this.mapSubscription = this.map
					.on(GoogleMapsEvent.MAP_READY)
					.subscribe((success: any) => {
						// Si el mapa cargó durante los 10 primeros segundos
						if (this.mapStatus !== 2) {
							// Consideramos que ha cargado con éxito
							this.mapStatus = 1;

							this.startBackgroundLoading(true);
						}
						this.content.resize();
						this.content.scrollToTop();
					}, (error: any) => { }
					);

				// Tiempo transcurrido antes de que el mapa esté listo
				let mapElapsedTime: number = 0;

				// Intervalo que suma cada segundo a mapElapsedTime
				let mapTimeInterval = setInterval(() => {
					// Si el mapa cargó exitosamente
					if (this.mapStatus === 1) {
						try {
							if (this.mapSubscription) this.mapSubscription.unsubscribe();
							loading.dismiss();
							// Terminamos el intervalo
							clearInterval(mapTimeInterval);
							this.content.resize();
							this.content.scrollToTop();
							return;
						} catch (e) { }
					}
					// Si el mapa no carga dentro de 10 segundos
					if (this.mapStatus === 0 && mapElapsedTime > 10) {
						try {
							if (this.mapSubscription) this.mapSubscription.unsubscribe();
							loading.dismiss();
							// Consideramos que falló al cargar
							this.zone.run(() => { this.mapStatus = 2; })
							// Terminamos el intervalo
							clearInterval(mapTimeInterval);
							// Ajustamos el tamaño de la vista
							this.content.resize();

							_.delay(() => {
								try {

									let elem = document.getElementById("map_canvas_hidden") as HTMLElement;
									let elem2 = document.getElementById("map_curtain") as HTMLElement;

									this.zone.run(() => {
										elem.style.display = 'none';
										elem.style.visibility = 'hidden';
										elem.style.opacity = '0';
										elem.style.zIndex = '-1';

										elem2.style.zIndex = '0';
									});


								} catch (e) { }
							}, 150);

							this.content.scrollToTop();
						} catch (e) { }
					}
					mapElapsedTime++;
				}, 1000);
			} catch (e) { }
		});
	}

	async startBackgroundLoading(isFirst: boolean) {
		if (this.isNextPage) {
			this.requestParams.page = this.requestParams.page + 1;
			const isNextPage = await this.getBranchOfficesPaginated();
			if (isNextPage) {
				await this.startBackgroundLoading(false);
			}
			this.drawClusterOffices(isFirst);
		}
	}

	// Posiciona el mapa en el punto del usuario
	setUserCenter() {
		let userPosition = this.markers.user.getPosition();

		// Si contamos con el marcador del usuario
		if (userPosition && userPosition.lat) {
			// Creamos la nueva ubicación, centramos el mapa y asignamos el zoom por defecto
			let myLatLng = { lat: userPosition.lat, lng: userPosition.lng };
			this.map.setCameraZoom(this.params.zoom);
			this.map.setCameraTarget(myLatLng);
		}
	}

	// Retorna la posición actual del dispositivo
	async getPosition() {
		let position: any = {
			latitude: null,
			longitude: null,
			accuracy: null,
			currentDate: null,
			currentTimestamp: null
		};

		const options: GeolocationOptions = { timeout: this.params.timeout, enableHighAccuracy: this.params.useHighAccuracy, maximumAge: 100 };

		/* El timeout del plugin geolocation no está funcionando correctamente,
		por lo cual, implementamos un timeout custom */

		const promise = new Promise((resolve, reject) => {

			// Timeout custom, si la ubicación no la obtenemos después de x segundos, rechazamos la promesa
			const timer = setTimeout(() => {
				clearTimeout(timer);
				reject({ error: 'Custom timeout error.', code: 3 });
			}, options.timeout)

			// Solicitamos la ubicación actual
			this.geolocation
				.getCurrentPosition(options)
				.then((response: any) => {
					clearTimeout(timer);
					try {
						this.isDefaultPositionUsed = false;
						this.availableServices.position = true;
						resolve({
							latitude: response.coords.latitude,
							longitude: response.coords.longitude,
							accuracy: response.coords.accuracy,
							currentDate: new Date(),
							currentTimestamp: response.timestamp
						});
					} catch (e) {
						reject(e);
					}
				})
				.catch((error: any) => {
					try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
					clearTimeout(timer);
					reject(error);
				});
		});

		await promise
			.then((response: any) => {
				position = response;
			})
			.catch((error) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				if (error && error.code === 3) {
					this.toggleAccuracy();
				}
			});

		return position;
	}

	// Comienza a escuchar los cambios de posición
	subscribeToLocationChanges() {
		// Si es que hay alguna anterior, la borramos
		this.unsubscribeToLocationChanges();
		// Definimos la suscripción al watch
		// (Esto se hace para luego poder borrar la suscripción y dejar de escuchar)
		this.gpsSubscription = this.gpsWatcher
			.subscribe((data: any) => {
				// Si tenemos coordenadas las procesamos
				if (data && data.coords) {

					if (this.params.forceCheckout) this.forceCheckout(data);

					data.coords.currentDate = new Date();
					data.coords.currentTimestamp = data.timestamp;

					this.isDefaultPositionUsed = false;

					// Si no contamos con el mapa, lo cargamos con la posición obtenida
					if (!this.map) {
						this.loadMap(data.coords);
					}
					// Si está el loading de no ubicación, lo cerramos
					if (!this.availableServices.position) {
						this.availableServices.position = true;
						this.checkAvailableServices();
					}

					this.processLocation(data.coords);
				} else {
					if (data.code === 3) this.toggleAccuracy();
				}
			});
	}

	/**
	 * Muestra una alerta indicando el nivel de lejanía de un usuario
	 * con un checkin en curso (si es que existe)
	 * para el nivel de lejanía más alto, realiza un checkout automático
	 * @param data ubicación del usuario
	 */
	forceCheckout(data: any) {
		/**
		* Si hay un check in en curso
		* y si hay registrados 20 puntos (con accuracy < 100) fuera del rango de la sucursal (para un mismo nivel)
		* mostramos una alerta al usuario para que registre el checkout y en el último caso lo hacemos automaticamente
		*/
		if (this.currentCheckin) {
			if (data.coords.accuracy < 100) {

				// Calculamos la distancia entre la ubicación actual del usuario versus la ubicación de la tienda con checkin en curso
				let distance = Math.round(this.getDistance(
					{ latitude: data.coords.latitude, longitude: data.coords.longitude },
					{ latitude: this.currentCheckin.sucursal.latitud, longitude: this.currentCheckin.sucursal.longitud }
				));

				/* // Descomentar para pruebas sin necesidad de moverse
				if (!this.checkOutAlertShown.close) {
					distance = (this.params.acceptedDistance + 50);
				} else if (!this.checkOutAlertShown.halfFar) {
					distance = (this.params.acceptedDistance + 150);
				} else if (!this.checkOutAlertShown.far) {
					distance = (this.params.acceptedDistance + 300);
				} */

				// Definimos los niveles de lejanía
				const level = {
					close: (this.params.acceptedDistance + 50),
					halfFar: (this.params.acceptedDistance + 150),
					far: (this.params.acceptedDistance + 300)
				};

				/**
				 * Si la distancia es mayor o igual a la lejanía mínima, continuamos evaluando las alertas
				 * Si la distancia es menor a la lejanía "close", solo vaciamos el arreglo con puntos fuera de rango (ver else)
				 */
				if (distance >= level.close) {
					/** 
					 * Seteamos el nivel actual de lejanía
					 * En caso de que pasemos de un nivel a otro, vaciamos el arreglo que registra los puntos fuera de lugar
					*/
					if (distance >= level.close && distance < level.halfFar) {
						if (this.checkinFarLevel !== 'close') this.locations.outOfRange = [];
						this.checkinFarLevel = 'close';
					} else if (distance >= level.halfFar && distance < level.far) {
						if (this.checkinFarLevel !== 'halfFar') this.locations.outOfRange = [];
						this.checkinFarLevel = 'halfFar';
					} else if (distance >= level.far) {
						if (this.checkinFarLevel !== 'far') this.locations.outOfRange = [];
						this.checkinFarLevel = 'far';
					}

					this.locations.outOfRange.push(data.coords);

					/**
					 * Si ya tenemos 20 puntos y la alerta no ha sido mostrada según su nivel de lejanía, la mostramos
					 */
					if (this.locations.outOfRange.length === 20) {

						if (!this.checkoutAlert) {
							this.checkoutAlert = this.alert.create({
								title: 'Atención',
								subTitle: null,
								buttons: []
							});
							this.checkoutAlert.onDidDismiss(() => {
								this.checkoutAlert = null;
								MapVisitPage.isAlertActive = false;
							});
						}

						if (this.checkinFarLevel === 'close' && !this.checkOutAlertShown.close) {
							this.checkoutAlert.data.buttons = [];
							this.locations.outOfRange = [];
							this.checkOutAlertShown.close = true;
							this.checkoutAlert.setSubTitle(`Hemos detectado que está fuera del rango de la ${this.sucursal} en la que tiene un checkin. ¿Desea hacer checkout de la ${this.sucursal} ${this.currentCheckin.sucursal.nombre}?`);
							this.checkoutAlert.addButton({
								text: 'Cancelar',
								handler: () => { }
							});
							this.checkoutAlert.addButton({
								text: 'Checkout',
								handler: () => {
									this.doCheckOut(true, 1);
								}
							});
							this.checkoutAlert.present();
							MapVisitPage.isAlertActive = true;
						} else if (this.checkinFarLevel === 'halfFar' && !this.checkOutAlertShown.halfFar) {
							this.checkoutAlert.data.buttons = [];
							this.locations.outOfRange = [];
							this.checkOutAlertShown.halfFar = true;
							this.checkoutAlert.setSubTitle(`Hemos detectado que te sigues alejando de la ${this.sucursal} ${this.currentCheckin.sucursal.nombre}. Si te sigues alejando realizaremos el checkout de manera automática. ¿Deseas hacer checkout ahora?`);
							this.checkoutAlert.addButton({
								text: 'Cancelar',
								handler: () => { }
							});
							this.checkoutAlert.addButton({
								text: 'Checkout',
								handler: () => {
									this.doCheckOut(true, 2);
								}
							});
							this.checkoutAlert.present();
							MapVisitPage.isAlertActive = true;
						} else if (this.checkinFarLevel === 'far' && !this.checkOutAlertShown.far) {
							this.checkoutAlert.data.buttons = [];
							this.locations.outOfRange = [];
							this.checkOutAlertShown.far = true;
							this.doCheckOut(true, 3);
							this.checkoutAlert.setSubTitle(`Hemos hecho el checkout de manera automática por lejanía de la ${this.sucursal} ${this.currentCheckin.sucursal.nombre}.`);
							this.checkoutAlert.addButton({
								text: 'Aceptar'
							});
							this.checkoutAlert.present();
							MapVisitPage.isAlertActive = true;
						}
					}
				} else {
					this.locations.outOfRange = [];
				}
			}
		}
	}

	// Somete la ubicación a una serie de validaciones y la ubica en el arreglo que corresponda
	processLocation(currentLocation: any) {
		// La instancia de latlng de google maps, tiene atributos read only
		// Por lo que creamos un nuevo objeto para procesar
		let location: any = {
			latitude: currentLocation.latitude,
			longitude: currentLocation.longitude,
			accuracy: currentLocation.accuracy,
			currentDate: currentLocation.currentDate,
			currentTimestamp: currentLocation.currentTimestamp
		};
		/* Checkear que no sea el primero que se muestra */
		if (this.locations.show.length) {
			/* Distancia buena? */
			if (this.isClose(location, _.last(this.locations.show))) {
				/* Acc bueno? */
				if (this.isAccurate(location)) {
					/* mostrar */
					this.locations.show.push(location);
					this.setUserLocation(location);
					/* borrar historicos */
					this.locations.bad = [];
					this.locations.good = [];
				}
			} else {
				/* Si la distancia es mala (lejana al último punto) */
				/* Acc buena */
				if (this.isAccurate(location)) {
					/* Hay historicos buenos suficientes? */
					if (this.locations.good.length > this.params.minimumGoodLocations) {
						/* sacar promedio y agregar para mostrar */
						let latSum = 0;
						let lngSum = 0;
						let accSum = 0;
						_.forEach(this.locations.good, (temp) => {
							latSum += temp.latitude;
							lngSum += temp.longitude;
							accSum += temp.accuracy
						});
						let avgLat = latSum / this.locations.good.length;
						let avgLng = lngSum / this.locations.good.length;
						let avgAcc = accSum / this.locations.good.length;

						location.latitude = avgLat;
						location.longitude = avgLng;
						location.accuracy = avgAcc;
						this.locations.show.push(location);
						this.setUserLocation(location);
						this.locations.bad = [];
						this.locations.good = [];
					} else {
						/* Agregar a historicos buenos */
						this.locations.good.push(location);
					}
				} else {
					/* Hay histroicos con mal acc? */
					if (this.locations.bad.length) {
						/* son ditintos? */
						if (
							location.latitude !== _.last(this.locations.bad).latitude
							|| location.longitude !== _.last(this.locations.bad).longitude
							|| location.accuracy !== _.last(this.locations.bad).accuracy
						) {
							if (this.locations.bad.length > (this.params.minimumBadLocations > 29 ? this.params.minimumBadLocations : 30)) {
								let applied = this.applyFormula();
								if (this.isClose(applied, _.last(this.locations.show))) {
									this.locations.show.push(applied);
									this.setUserLocation(applied);
									this.locations.bad = [];
									this.locations.good = [];
								} else {
									/* Toggle high accuracy */
									this.toggleAccuracy()
								}
							}
						}
					} else {
						/* Agregar a historicos malos */
						this.locations.bad.push(location);
					}
				}
			}
		} else {
			/* Si no tenemos puntos para mostrar */
			/* Verificar que tenga buen acc el primer dato o se ignora */
			if (this.isAccurate(location)) {
				this.locations.show.push(location);
				this.setUserLocation(location);
			}
		}
	}

	// Alterna el valor de useHighAccuracy
	toggleAccuracy() {
		// Si tenemos una suscripción al watch, la borramos
		if (this.gpsSubscription) {
			this.unsubscribeToLocationChanges();
		}
		// Cambiamos el valor del accuracy
		this.params.useHighAccuracy = !this.params.useHighAccuracy;
		// Volvemos a definir el watcher
		this.gpsWatcher = !globalConfig.isBrowser
			? this.geolocation.watchPosition({ enableHighAccuracy: this.params.useHighAccuracy, maximumAge: 100, timeout: this.params.timeout })
			: this.fakeGps(true);
		// Volvemos a suscribir el watch
		this.subscribeToLocationChanges();
	}

	fakeGps(inRange: boolean) {
		return Observable.interval(2000).map(() => {
			const result = { coords: { latitude: null, longitude: null, accuracy: 99 }, timestamp: new Date().getTime() };
			if (this.currentCheckin) {
				if (inRange) {
					result.coords.latitude = this.currentCheckin.sucursal.latitud;
					result.coords.longitude = this.currentCheckin.sucursal.longitud;
				} else {
					result.coords.latitude = this.currentCheckin.sucursal.latitud + (180 / Math.PI) * ((this.params.acceptedDistance / 2) / 6378137)
					result.coords.longitude = this.currentCheckin.sucursal.longitud + (180 / Math.PI) * ((this.params.acceptedDistance / 2) / 6378137) / Math.cos(this.currentCheckin.sucursal.latitud);
				}
			} else {
				result.coords.latitude = -33.4160486;
				result.coords.longitude = -70.5871115;
			}
			return result;
		});
	}

	// Realiza un cálculo sobre los puntos "malos" y retorna un valor mejorado
	applyFormula() {
		let sumLat = 0;
		let sumLng = 0;

		for (let index = 0; index < this.locations.bad.length; index++) {
			sumLat += this.locations.bad[index].latitude * (1 / 2 ^ (index + 1));
			sumLng += this.locations.bad[index].longitude * (1 / 2 ^ (index + 1));
		}

		let lastBadLocation = _.last(this.locations.bad);

		lastBadLocation.latitude = sumLat;
		lastBadLocation.longitude = sumLng;
		return lastBadLocation;
	}

	// Actualiza la posición del usuario en el mapa
	setUserLocation(location: any) {
		if (this.map) {
			// Si tenemos el marcador del usuario
			if (this.markers.user) {
				// Definimos la nueva ubicación
				let newLatLng = { lat: location.latitude, lng: location.longitude };

				// Actualizamos la posición
				this.markers.user.setPosition(newLatLng);

				// Definimos la presición de la nueva ubicación
				this.markers.user.currentAccuracy = Math.round(location.accuracy);

				// La fecha de la ubicación
				this.markers.user.currentDate = location.currentDate;

				// El timestamp que entrega el plugin
				this.markers.user.currentTimestamp = location.currentTimestamp;

				// Cambiamos el radio y centro del círculo
				this.circle.setCenter(newLatLng);

				this.circle.setRadius(this.params.acceptedDistance + location.accuracy);

				// Recalculamos la distancia entre el usuario y las sucursales
				this.calculateDistanceBetweenUserAndBranchOffices();

				return;
			}
		}
	}

	// Deja de escuchar los cambios de posición
	unsubscribeToLocationChanges() {
		try {
			if (this.gpsSubscription) this.gpsSubscription.unsubscribe();
		} catch (e) { }
	}

	// Determina si un punto es cercano a otro
	isClose(lastLocation, comparativeLocation) {
		// Obtenemos la distancia y la comparamos con el parámetro de proximidad
		if (this.getDistance(lastLocation, comparativeLocation) < this.params.proximity) {
			return true;
		}
		return false;
	}

	// Retorna la distancia (en metros) entre 2 puntos
	getDistance(location1, location2) {
		var R = 6378137; // Promedio del radio de la tierra en metros
		var dLat = this.rad(location2.latitude - location1.latitude);
		var dLong = this.rad(location2.longitude - location1.longitude);
		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.rad(location1.latitude)) * Math.cos(this.rad(location2.latitude)) *
			Math.sin(dLong / 2) * Math.sin(dLong / 2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;
		return d; // returns the distance in meter
	}

	// Convierte "x" a radianes
	rad(x) {
		return x * Math.PI / 180;
	}

	// Determina si una ubicación tiene buen accuracy
	isAccurate(location) {
		if (location.accuracy <= this.params.accurate) {
			return true;
		}
		return false;
	}

	// Obtiene y retorna la lista de sucursales (prioriza la respuesta de la API)
	async getBranchOffices() {
		let result = [];
		let session_aux = null;

		// Traemos las sucursales desde la sesión
		await this.sessionProvider.getSession()
			.then((session: any) => {
				if (session && session.usuario) {
					session_aux = session;
					result = session.usuario.sucursales_visita;
				}
			})
			.catch(error => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });

		// También solicitamos la lista de sucursales del servicio
		// Si la solicitud es exitosa usamos estas sucursales
		await this.request
			.get(config.endpoints.get.branchOffices, true)
			.then((response: any) => {
				if (response && response.data) {
					result = response.data.sucursales;

					// Aprovechamos de actualizar las sucursales en la sesión local
					if (session_aux && session_aux.usuario) {
						session_aux.usuario.sucursales_visita = result;
						this.sessionProvider.saveSession(session_aux);
					}
				}
			})
			.catch(error => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return result;
	}

	// Obtiene y retorna la lista de sucursales paginada (prioriza la respuesta de la API)
	async getBranchOfficesPaginated() {

		// También solicitamos la lista de sucursales del servicio
		// Si la solicitud es exitosa usamos estas sucursales
		return await this.request
			.get(config.endpoints.get.branchOffices + this.getQueryParams(), true)
			.then((response: any) => {
				if (response && response.data && _.isArray(response.data.sucursales)) {

					_.forEach(response.data.sucursales, (b: any) => {
						if (!_.find(this.branchOffices, { id: b.id })) {
							this.branchOffices.push(b);
						}
					});

					if (response.data.pagination && ((this.requestParams.page * this.requestParams.pageSize) >= response.data.pagination.count)) {
						this.requestParams.page = this.requestParams.page - 1;
						return false;
					}
					return true;
				}
				this.requestParams.page = this.requestParams.page - 1;
				return false;
			})
			.catch(error => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.requestParams.page = this.requestParams.page - 1;
				return false;
			});
	}

	getQueryParams() {
		return `?paging=1&page=${this.requestParams.page}&limit=${this.requestParams.pageSize}`
			+ (this.positionPagination ? `&lat=${this.positionPagination.lat}&lng=${this.positionPagination.lng}&radius=100000` : '')
			+ (this.requestParams.q ? ('&search=' + this.requestParams.q) : '');
	}

	// Define el listener 'click' para la sucursal que llega por parámetro
	// En cada click a una sucursal, mide la distancia y si es permitida la selecciona
	bindBranchOfficeMarkerClick(marker: any) {
		// Evento click de los marcadores de sucursal
		marker.addEventListener(GoogleMapsEvent.MARKER_CLICK)
			.subscribe(() => {
				try {
					// Si tenemos un checkin activo, cortamos la ejecución del método
					if (this.currentCheckin) return;

					let markerPosition = marker.getPosition();

					if (!this.params.stopFlow) {
						if (markerPosition && markerPosition.lat) {
							this.map.setCameraTarget({ lat: markerPosition.lat, lng: markerPosition.lng });
						}
						this.selectedBranchOffice = marker;
						this.content.resize();
						return;
					}

					this.zone.run(() => {
						// Obtenemos la distancia entre la sucursal y el usuario
						let distanceToBranchOffice = this.getDistanceToBranchOffice(marker);

						// Si esta distancia es menor o igual al rango + la presición, seleccionamos la sucursal
						if (distanceToBranchOffice <= ((this.markers.user.currentAccuracy) + this.params.acceptedDistance)) {
							if (markerPosition && markerPosition.lat) {
								this.map.setCameraTarget({ lat: markerPosition.lat, lng: markerPosition.lng });
							}
							this.selectedBranchOffice = marker;
							this.content.resize();
							return;
						}
						// Si no, informamos al usuario
						this.util.showAlert('Atención', `La ${this.tienda} "${marker.branchOfficeData.nombre_real}" está fuera del rango aceptado.`);
					});
				} catch (e) { }
			});
	}

	// Valida que un checkin sea posible
	isCheckinPosible() {
		if (!this.params.stopFlow) return true;

		// Obtenemos la distancia entre un usuario y la sucursal selccionada
		const distanceToBranchOffice = this.getDistanceToBranchOffice(this.selectedBranchOffice);
		// Si estamos fuera del rango, no podemos seguir
		if (distanceToBranchOffice > ((this.markers.user.currentAccuracy) + this.params.acceptedDistance)) {
			this.util.showAlert('Atención', `La ${this.tienda} ${this.selectedBranchOffice.branchOfficeData.nombre_real} está fuera del rango aceptado.`);
			return false;
		}
		return true;
	}

	// Calcula y retorna la distancia del usuario a una sucursal
	getDistanceToBranchOffice(branchOffice: any) {
		let userPosition = this.markers.user.getPosition();

		let branchOfficePosition = null;

		try {
			branchOfficePosition = branchOffice.getPosition();
		} catch (e) {
			branchOfficePosition = { lat: branchOffice.branchOfficeData.latitud, lng: branchOffice.branchOfficeData.longitud };
		}

		// Si tenemos una sucursal selccionada y la posición del usuario
		if (branchOfficePosition && branchOfficePosition.lat && userPosition && userPosition.lat) {
			// Definimos los objetos de ubicación
			let userLatLng = { latitude: userPosition.lat, longitude: userPosition.lng };

			let branchOfficeLatLng = { latitude: branchOfficePosition.lat, longitude: branchOfficePosition.lng };

			// Retornamos la distancia entre ambos
			return Math.round(this.getDistance(userLatLng, branchOfficeLatLng));
		}
		// Si no contamos con ubicación o sucursal retornamos un número siempre mayor
		// (Caso borde, nunca debería ocurrir)
		return (this.params.acceptedDistance + this.params.accurate + 1000);
	}

	// Envía un intento de checkin a la API
	async tryCheckIn(body: any, timeout: number) {
		let success: boolean = false;

		// Enviamos la solicitud de checkin
		await this.request
			.postWithTimeout(config.endpoints.post.checkIn, body, true, timeout)
			.then((response: any) => {
				if (response) {
					// Si ya existe un checkin en curso, informamos y lo asignamos
					if (response.message === config.messages.checkinExists) {
						this.util.showToast('Existe un checkin en curso, se requiere hacer checkout para continuar.', 3000);
						this.getCheckInFromService();
						success = true;
						return;
					}
					// Si el checkin es registrado con éxito
					if (
						response.message === config.messages.checkinSuccess
						&& response.data
						&& response.data[0]
						&& response.data[0].control_checkin_id
					) {
						// Armamos el objeto del checkin actual
						let currentCheckin = response.data[0];

						let branchOffice = _.find(this.branchOffices, { id: currentCheckin.sucursal_id });

						this.updateBranchOfficeStatus(currentCheckin.sucursal_id, response.data[0].estado_checkin);

						if (branchOffice) {
							currentCheckin.sucursal = branchOffice;
						}

						this.zone.run(() => {
							let branchOffice = this.getBranchOfficeById(response.data[0].sucursal_id);

							// Asignamos el checkin registrado
							if (branchOffice) this.selectedBranchOffice = branchOffice;

							this.currentCheckin = currentCheckin;
							this.util.showToast('Checkin registrado con éxito.', 3000);

							try {
								//REGISTRAMOS EL EVENTO COMO UN TRACK DE VISTA
								this.firebaseAnalyticsProvider.trackButtonEvent("CheckIn");
							} catch (e) { }

							try {
								// Actualizamos el ícono de la sucursal
								let icon: MarkerIcon = {
									url: (this.params.iconPath + 'ico-mapa-incompleto.png'),
									size: {
										width: 40,
										height: 40
									}
								};

								this.selectedBranchOffice.branchOfficeData.iconUrl = icon.url;

								this.selectedBranchOffice.icon = icon;

								try {
									this.selectedBranchOffice.setIcon(icon);
								} catch (e) { }

							} catch (e) { }
						});
						success = true;
					} else {
						try { this.util.logError(JSON.stringify(response), null, globalConfig.version); } catch (e) { }
					}
				} else {
					try { this.util.logError(JSON.stringify(response), null, globalConfig.version); } catch (e) { }
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
			});
		return success;
	}

	// Envía una solicitud para hacer checkin
	async doCheckIn() {

		// Si no contamos con el id de la sucursal selccionada, paramos la ejecución del método
		// Caso borde (Nunca debería ocurrir)
		if (
			!this.selectedBranchOffice
			|| !this.selectedBranchOffice.branchOfficeData
			|| !this.selectedBranchOffice.branchOfficeData.id
		) {
			this.util.showAlert('Atención', `Ninguna ${this.tienda} seleccionada, intente nuevamente.`);
			this.selectedBranchOffice = null;
			return;
		}

		// Verificamos si es o no hacer checkin
		if (!this.isCheckinPosible()) {
			this.selectedBranchOffice = null;
			return;
		}

		let userPosition = this.markers.user.getPosition();

		if (!userPosition || !userPosition.lat) return;

		try {
			// Armamos el cuerpo del request para el checkin,
			// Lo armamos con la última ubicación del usuario
			let body = {
				sucursal_id: this.selectedBranchOffice.branchOfficeData.id,
				latitud_inicial: userPosition.lat,
				longitud_inicial: userPosition.lng
			};

			let count: number = 1;
			let timeout: number = 5000;
			let success: boolean = false;

			let loading = this.loading.create({ content: 'Registrando checkin.' });
			loading.present();

			try {
				// Actualizamos los checklists
				await this.sendAnswersVisits(false, false);
			} catch (e) { }

			// Intentamos hasta 4 veces hacer checkin
			while (count < 5) {

				let content = `Registrando checkin. Intento ${count} de 4.`;
				loading.setContent(content);

				// Recibimos el estado del checkin
				let checkIn = await this.tryCheckIn(body, timeout);

				// Si el checkin es exitoso, paramos los intentos
				if (checkIn) {
					this.checkOutAlertShown.close = false;
					this.checkOutAlertShown.halfFar = false;
					this.checkOutAlertShown.far = false;
					loading.dismiss();
					success = true;
					break;
				}

				// Si el intento actual no es exitoso, aumentamos el timeout y pasamos al siguiente intento
				timeout += 5000;
				count++;
			}

			// Si fallan todos los intentos, informamos al usuario
			if (!success) {
				try { this.util.logError(JSON.stringify({ checkInTimeout: true }), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
				this.util.showAlert('Atención', 'No ha sido posible registrar el checkin, por favor intente nuevamente.');
			}
		} catch (e) {
			this.util.logError(e, config.errors.checkin.code, globalConfig.version);
			this.util.showAlert('Atención', ('Error desconocido, contacte a soporte con el código: ' + config.errors.checkin.code));
		}
	}

	// Consulta al servicio si existe un checkin activo
	async getCheckInFromService() {
		await this.request
			.get(config.endpoints.get.checkIn, true)
			.then((response: any) => {
				// Si se cumplen estas condiciones quiere decir que hay un checkin activo
				if (
					response
					&& response.data
					&& response.data[0]
					&& response.data[0].check_out
					&& response.data[0].sucursal
					&& response.data[0].sucursal.id
				) {
					this.checkOutAlertShown.close = false;
					this.checkOutAlertShown.halfFar = false;
					this.checkOutAlertShown.far = false;
					// Buscamos la sucursal
					let branchOffice = this.getBranchOfficeById(response.data[0].sucursal.id);


					// Si la encontramos, asignamos el checkin actual
					if (branchOffice) {
						this.zone.run(() => {
							this.selectedBranchOffice = branchOffice;
							this.currentCheckin = response.data[0];
						});
					} else {
						this.clearCheckIn();
					}
				} else if (response.message === config.messages.noCheckin) {
					this.clearCheckIn();
				}
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
	}

	// Si Existe un checkin, le asigna el ícono de visitado y luego limpia la variable
	clearCheckIn() {
		this.zone.run(() => {
			if (this.selectedBranchOffice) {
				let icon: MarkerIcon = {
					url: (this.params.iconPath + 'ico-mapa-finalizado.png'),
					size: { width: 40, height: 40 }
				};
				this.selectedBranchOffice.branchOfficeData.iconUrl = icon.url;
				try {
					this.selectedBranchOffice.setIcon(icon);
				} catch (e) { }
			}
			this.selectedBranchOffice = null;
			this.currentCheckin = null;
		});
	}

	// Busca y retorna una sucursal por su id
	getBranchOfficeById(id: any) {
		let branchOffice: any = _.find(this.markers.branchOffices, (temp) => {
			return temp.branchOfficeData.id === id;
		});
		return branchOffice;
	}

	// Levanta una alerta de confirmación para realizar un checkout
	confirmCheckOut(checkin_id) {

		if (
			!this.markers
			|| !this.markers.user
			|| !this.markers.user
			|| !this.markers.user.getPosition) {
			return;
		}

		const confirm = this.alert.create({
			title: 'Atención',
			message: (this.checklistMessage ? this.checklistMessage : `Se marcará la salida de la ${this.tienda}. ¿Desea continuar?`),
			buttons: [{
				text: 'Cancelar',
				handler: () => { }
			}, {
				text: 'Continuar',
				handler: () => {
					this.doCheckOut(false);
				}
			}]
		});
		confirm.present();
	}

	// Realiza un checkout
	async doCheckOut(automatic: boolean, level?: number) {
		// Si no tenemos un checkin activo, cortamos la ejecución del método
		if (!this.currentCheckin || !this.currentCheckin.control_checkin_id) return;

		const loading = this.loading.create({ content: 'Registrando checkout.' });
		loading.present();

		try {

			// Objeto para enviar al servicio de checkout
			let body: any = {
				control_checkin_id: this.currentCheckin.control_checkin_id,
				latitud_final: null,
				longitud_final: null,
				intento: 1
			};

			if (level) body.nivel = level;

			let userPosition = null;

			try {
				userPosition = _.cloneDeep(this.markers.user.getPosition());
			} catch (e) { }

			if (
				userPosition
				&& userPosition.lat
			) {
				body.latitud_final = userPosition.lat;
				body.longitud_final = userPosition.lng;
			}

			let count: number = 1;
			let timeout: number = 5000;
			let success: boolean = false;

			// Intentamos hasta 4 veces hacer checkout
			while (count < 5) {

				let content = `Registrando checkout. Intento ${count} de 4.`;
				loading.setContent(content);

				body.intento = count;

				// Recibimos el estado del checkout
				let checkoutSuccess = await this.tryCheckOut(body, timeout);

				// Si el checkout es exitoso, limpiamos el checkin actual y actualizamos la información
				if (checkoutSuccess) {
					loading.dismiss();
					try {
						this.clearCheckIn();
						this.sendAnswersVisits(false, true);
						this.setUserCenter();
						this.util.showToast('Checkout registrado con éxito.', 3000);
						if (automatic) {
							this.events.publish('checklist-send-silent');
							_.delay(this.navCtrl.popToRoot(), 500);
						}

						try {
							// track de boton
							this.firebaseAnalyticsProvider.trackButtonEvent("CheckOut");
						} catch (e) { }
					} catch (e) { }
					success = true;
					break;
				}

				// Si el intento actual no es exitoso, aumentamos el timeout y pasamos al siguiente intento
				timeout += 5000;
				count++;
			}

			// Si fallan todos los intentos, informamos al usuario
			if (!success) {
				this.util.showAlert('Atención', 'No ha sido posible registrar el checkout, por favor intente nuevamente.');
				loading.dismiss();
			}
		} catch (e) {
			loading.dismiss();
			this.util.logError(e, config.errors.checkout.code, globalConfig.version);
			this.util.showAlert('Atención', ('Error desconocido, contacte a soporte con el código: ' + config.errors.checkout.code));
		}
	}

	// Envía un intento de checkout a la API
	async tryCheckOut(body: any, timeout: number) {
		let success: boolean = false;

		await this.request
			.postWithTimeout(config.endpoints.post.checkOut, body, true, timeout)
			.then((response: any) => {
				// Si el mensaje es de éxito, limpiamos el checkin y sucursal selccionada
				if (
					response.message === config.messages.checkoutSuccess
					|| response.message === config.messages.checkoutAlreadyDone
				) {
					this.updateBranchOfficeStatus(this.currentCheckin.sucursal.id, response.data[0].estado_checkin);
					success = true;
				} else {
					try { this.util.logError(JSON.stringify(response), null, globalConfig.version); } catch (e) { }
				}
			})
			.catch((error: any) => {
				try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
			});
		return success;
	}

	// Navegamos hasta la vista de visita de una sucursal
	navigateToBranchOffice(revisar) {
		// Si tenemos una oficina seleccionada, vamos a la vista de visita
		if (
			this.selectedBranchOffice
			&& this.selectedBranchOffice.branchOfficeData
			&& this.selectedBranchOffice.branchOfficeData.id
		) {

			if (!this.checklistSetting) {
				this.navCtrl.push('ChecklistTiendaPage', {
					sucursal: this.selectedBranchOffice.branchOfficeData.id
				});
				return;
			}

			const value: any = this.checklistSetting.value;

			if (value === 2) {
				this.navCtrl.push('ChecklistsBranchOfficePage', {
					branchOfficeId: this.selectedBranchOffice.branchOfficeData.id,
					checkinId: (this.currentCheckin ? this.currentCheckin.control_checkin_id : null),
					fromCheckStore: true
				});
				return;
			}
			this.navCtrl.push('ChecklistTiendaPage', {
				sucursal: this.selectedBranchOffice.branchOfficeData.id
			});

			// flujo para cuando quiero revisar
			if (revisar) {

				try {
					// track de boton
					this.firebaseAnalyticsProvider.trackButtonEvent("IrAChecklist/Revisar");
				} catch (e) { }

				this.navCtrl.push('ChecklistsSucursalPage', {
					sucursal: this.selectedBranchOffice.branchOfficeData.id, revisar: revisar
				});
				return;
			}

			try {
				// track de boton
				this.firebaseAnalyticsProvider.trackButtonEvent("IrAChecklist");
			} catch (e) { }

			// flujo normal
			this.navCtrl.push('ChecklistTiendaPage', { sucursal: this.selectedBranchOffice.branchOfficeData.id });


		}
	}

	// Retorna el estado del gps (on/off)
	async checkGpsEnabled() {
		let isGpsEnabled: boolean = true;
		await this.diagnostic
			.isLocationEnabled()
			.then((enabled: any) => {
				isGpsEnabled = enabled;
			})
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return isGpsEnabled;
	}

	// Detecta si la alta presición está activada
	async isGpsLocationEnabled() {
		let result: boolean = false;
		await this.diagnostic
			.isGpsLocationEnabled()
			.then((data: any) => { result = data; })
			.catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return result;
	}

	// Ve si se puede solcitar alta presición, y lo hace si es posible
	async checkHighAccuracy() {
		try {
			await this.locationAccuracy.canRequest()
				.then(async (canRequest: boolean) => {
					if (canRequest) {
						await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
							() => {
								return;
							}, error => {
								return;
							}
						);
					}
				})
				.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		} catch (e) { }
	}

	// Actualiza las visitas de un usuario y retorna una promesa
	async updateUserVisitsData() {
		// Definimos los parámetros de la consulta
		let params: any = ((!this.session.usuario || !this.session.usuario.zona_id) ? '?zona_id=&tipo=usuario' : `?zona_id=${this.session.usuario.zona_id}&tipo=usuario`);

		return new Promise((resolve, reject) => {
			// Realizamos la consulta
			this.request
				.get((config.endpoints.get.refreshOfflineGet + params), false)
				.then((response: any) => {
					try {
						// Si tenemos sucursales sin responder
						if (
							response
							&& response.data
							&& response.data.sucursales_sin_responder
						) {
							let arr: any = [];

							// Recorremos las respuestas de cada visita
							_.forEach(response.data.sucursales_sin_responder.visitas_respuestas, (visit) => {
								if (visit.estado_id !== 4) {
									visit.modified = true;
									let visit_checklist = _.find(response.data.sucursales_sin_responder.checklists, { id: visit.checklist_id });
									if (visit_checklist) visit.checklist = visit_checklist;
									arr.push(visit);
								}
							});

							// Generamos el objeto a guardar localmente
							let visita_tienda: any = {
								sucursales: response.data.sucursales_sin_responder.sucursales,
								zonas: response.data.sucursales_sin_responder.zonas,
								checklists: response.data.sucursales_sin_responder.checklists,
								visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
								respuestas: response.data.sucursales_sin_responder.respuestas,
								estados_visita: response.data.sucursales_sin_responder.estado_visita,
								visitas: arr,
								fechaActualizacion: new Date()
							};
							// Guardamos la información de visita para este usuario en particular
							this.storage.set('visita_tienda_' + this.session.usuario.id, JSON.stringify(visita_tienda));
							resolve(true);
						} else {
							reject();
						}
					} catch (e) {
						reject();
					}
				})
				.catch((error: any) => {
					try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
					reject();
				});
		});
	}

	// Obtiene y retorna la información de visita del usuario actual
	async getUserLocalVisits() {
		let visits: any = null;

		await this.storage.get('visita_tienda_' + this.session.usuario.id)
			.then((response: any) => {
				visits = JSON.parse(response);
			})
			.catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return visits;
	}

	// Muestra una hoja de acciones
	presentActionSheet() {
		let buttons = [{
			text: 'Histórico de visitas',
			handler: () => {
				this.navCtrl.push(VisitHistoricalComponent);
			}
		}/* , {
			text: 'Histórico de checklists',
			handler: () => {
				this.navCtrl.push(ChecklistHistoricalComponent, { type: 2 });
			}
		} */, {
			text: 'Asignación de Visitas',
			handler: () => {
				this.navCtrl.push(AsignacionPage);
			}
		}];

		if (
			this.session
			&& this.session.usuario
			&& this.session.usuario.jerarquia
			&& this.session.usuario.jerarquia > 99
			&& !this.params.hideZonalLastPosition
		) {
			buttons.push({
				text: 'Ubicación de zonales',
				handler: () => {
					this.navCtrl.push(ZonalPositionComponent).then(a => a).catch(e => e);
				}
			});
		}
		
		if(this.currentCheckin && this.selectedBranchOffice && this.selectedBranchOffice.branchOfficeData && this.selectedBranchOffice.branchOfficeData.id){
			buttons.push({
				text: 'Asignar Tarea',
				handler: () => {
					let component = {
						navigate: TaskAssignmentComponent, data: { sucursalId: this.selectedBranchOffice.branchOfficeData.id  }
					}
					this.navCtrl.push(TaskManagerPage, { component });
				}
			});
		}

		// Si tenemos un check-in en curso y el cliente tiene el módulo de incidencias, agregamos la opción de agregar una incidencia
		if (this.currentCheckin && this.isIncidentsModule) {
			buttons.push({
				text: 'Generar incidencia',
				handler: () => {
					// Creamos un modal, el cual contiene la página 'AddIncidentPage'
					const modal = this.modal.create('AddIncidentPage', { areas: null, visit: this.currentCheckin });
					// Mostramos el modal
					modal.present();
				}
			});
		}

		const actionSheet = this.actionSheet.create({
			buttons: buttons
		});
		actionSheet.present();
	}

	// Muestra hoja de acciones para perfil general
	presentActionSheet2(marker: any) {
		let buttons = [
			{
				text: 'Revisar',
				handler: () => {
					this.revisar = true;
					this.setCheckinFromList(marker);
				}
			},
		];
		// Validación para la proximidad de una tienda
		if (marker.branchOfficeData && marker.branchOfficeData.userProximity && marker.branchOfficeData.userProximity.checkin && !this.currentCheckin) {
			buttons.splice(0, 0, {
				text: 'Check In',
				handler: () => {
					this.setCheckinFromList(marker);
				}
			})
		}

		const actionSheet = this.actionSheet.create({
			buttons: buttons
		});
		actionSheet.present();
	}

	// Actualiza las sucursales, envía las visitas
	async sendAnswersVisits(showProgress: boolean, fromCheckout: boolean) {
		if (this.visits) {
			if (showProgress) this.requesting = true;
			this.util.updateVisitResps(this.visits.respuestas, null).then(async value => {

				let temp_respuestas = value;

				// Creamos el cuerpo para el request
				let body = {
					data: {
						visitas_respuestas: this.visits.visitas ? this.visits.visitas : [],
						respuestas: temp_respuestas
					}
				};

				// Enviamos las respuestas al servicio
				await this.request
					.post(config.endpoints.post.sendAnswers, body, false)
					.then(async (response: any) => {
						if (response && response.status) {
							if (showProgress) this.util.showToast('Información actualizada correctamente.', 3000);
							this.reloadEssentials();
						} else {
							if (showProgress) this.util.showAlert('Atención', 'No ha sido posible actualizar la información, por favor intente nuevamente.');
							else if (fromCheckout) this.util.showAlert('Atención', 'No ha sido posible enviar los checklists, intente nuevamente utilizando el botón para refrescar.');
						}
					})
					.catch((error: any) => {
						try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
						if (showProgress) this.util.showAlert('Atención', 'No ha sido posible actualizar la información, por favor intente nuevamente.');
						else if (fromCheckout) this.util.showAlert('Atención', 'No ha sido posible enviar los checklists, intente nuevamente utilizando el botón para refrescar.');
					});
				this.requesting = false;
				return;
			});

		}
	}

	// Recarga la información escencial de la vista
	async reloadEssentials() {
		// Actualizamos los marcadores de las sucursales
		//this.updateBranchOfficesMarkers();

		// Actualizamos la información de las visitas
		this.updateUserVisitsData().then(async () => {
			// Actualizamos la variable
			this.visits = await this.getUserLocalVisits();
		}).catch((error) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		// Revisamos que no tenga checkins
		this.getCheckInFromService();
	}

	// Actualiza los estados de las sucursales
	async updateBranchOfficesMarkers() {
		// this.branchOffices = await this.getBranchOffices();
		this.isNextPage = await this.getBranchOfficesPaginated();

		// Si las sucursales no están en el mapa, las pintamos
		if (!this.markers.branchOffices.length) {
			//this.drawBranchOffices();
			this.drawClusterOffices();
			return;
		}

		// Buscamos si llegaron nuevas sucursales
		let newBranchOffices = _.filter(this.branchOffices, (branchOffice: any) => {
			// Si no encontramos la sucursal en los markers, la consideramos como nueva
			return !_.find(this.markers.branchOffices, (marker: any) => {
				return marker.branchOfficeData.id === branchOffice.id;
			});
		});

		let markersAux = [];

		// Agregamos las nuevas oficinas al mapa
		_.forEach(newBranchOffices, (branchOffice) => {
			// Para cada sucursal nueva, si tiene su latitud y longitud, generamos su marcador en el mapa
			if (branchOffice.latitud && branchOffice.longitud) {
				let marker: any = {
					icon: {
						url: this.params.iconPath + branchOffice.estado_checkin.icono,
						size: {
							width: 40,
							height: 40
						}
					},
					position: { lat: branchOffice.latitud, lng: branchOffice.longitud },
					title: branchOffice.nombre_real
				};

				branchOffice.iconUrl = marker.icon.url;

				marker.branchOfficeData = branchOffice;

				markersAux.push(marker);

				this.markers.branchOffices.push(marker);
			}
		});

		// Si ya están, las actualizamos
		_.forEach(this.markers.branchOffices, (marker: any) => {
			// Buscamos cada marcador
			let temp = _.find(this.branchOffices, { id: marker.branchOfficeData.id });
			// Si lo encontramos, actualizamos su ícono
			if (temp) {
				let icon = {
					url: (this.params.iconPath + temp.estado_checkin.icono),
					size: {
						width: 40,
						height: 40
					}
				};
				try {

					let markerPosition = marker.position;

					// Cambiamos el ícono de la sucursal
					marker.branchOfficeData.iconUrl = icon.url;

					marker.icon = icon;

					// Si tenemos latitud y longitud
					if (temp.latitud && temp.longitud && markerPosition.lat) {
						// Y si alguno de estos valores cambió
						if ((temp.latitud !== markerPosition.lat || temp.longitud !== markerPosition.lng)) {
							// Actualizamos la posición de la sucursal
							marker.position = { lat: temp.latitud, lng: temp.longitud };
						}
					}
				} catch (e) { }
			}
		});
		this.searchControl.setValue('');
		// this.branchOfficesList = _.take(this.markers.branchOffices, 50);
		this.branchOfficesList = this.markers.branchOffices;
		this.calculateDistanceBetweenUserAndBranchOffices();
	}

	// Envías las respuestas de las visitas
	updateData() {
		this.sendAnswersVisits(true, false);
	}

	// Observa el campo de búsqueda y solicita filtrar las sucursales
	watchSearch() {
		this.searchControl.valueChanges
			.debounceTime(300) // Cuando se deja de tipear por 300 ms
			.distinctUntilChanged() // Si el input es distinto
			.subscribe(async (searchTerm: any) => {
				if (searchTerm) {
					if (this.markers.branchOffices.length > 50) {
						if (searchTerm.length < 3) {
							this.branchOfficesList = [];

							return;
						}

						this.branchOfficesList = _.take(_.filter(this.markers.branchOffices, (marker) => {
							return (_.includes(marker.branchOfficeData.nombre.toLowerCase(), searchTerm.toLowerCase()) || _.includes(marker.branchOfficeData.direccion.toLowerCase(), searchTerm.toLowerCase()));
						}), 50);
						return;
					}

					this.branchOfficesList = _.filter(this.markers.branchOffices, (marker) => {
						return (_.includes(marker.branchOfficeData.nombre.toLowerCase(), searchTerm.toLowerCase()) || _.includes(marker.branchOfficeData.direccion.toLowerCase(), searchTerm.toLowerCase()));
					});
					return;
				}

				this.branchOfficesList = _.take(this.markers.branchOffices, 50);
			});
	}

	get getSearchTermLenght() {
		return (this.searchControl.value ? this.searchControl.value.length : 0);
	}

	// Selecciona una tienda desde la lista de sucursales que reemplaza al mapa cuando este falla
	setCheckinFromList(marker: any) {
		try {
			// Cuando queremos ir a revisar el checklist sin hacer checkin
			if (this.revisar) {
				this.selectedBranchOffice = marker;
				this.navigateToBranchOffice(this.revisar);
				this.revisar = false;
				return;
			}

			// Si tenemos un checkin activo, cortamos la ejecución del método
			if (this.currentCheckin) return;

			this.zone.run(() => {

				if (!this.params.stopFlow) {
					this.selectedBranchOffice = marker;
					// hacemos el checkin
					this.doCheckIn();
					this.content.resize();
					return;
				}

				// Obtenemos la distancia entre la sucursal y el usuario
				let distanceToBranchOffice = this.getDistanceToBranchOffice(marker);

				// Si esta distancia es menor o igual al rango + la presición, seleccionamos la sucursal
				if (distanceToBranchOffice <= ((this.markers.user.currentAccuracy > this.params.accurate ? this.params.accurate : this.markers.user.currentAccuracy) + this.params.acceptedDistance)) {
					this.selectedBranchOffice = marker;
					this.doCheckIn();
					try {
						this.firebaseAnalyticsProvider.trackButtonEvent("CheckInFromList");
					} catch (e) { }

					this.content.resize();
					return;
				}
				// Si no, informamos al usuario
				this.util.showAlert('Atención', `La ${this.tienda} "${marker.branchOfficeData.nombre_real}" está fuera del rango aceptado.`);
			});
		} catch (e) { }
	}

	// Calcula la distancia entre el usuario y cada sucursal
	calculateDistanceBetweenUserAndBranchOffices() {
		let userPosition = this.markers.user.getPosition();

		if (userPosition && userPosition.lat) {
			_.forEach(this.branchOfficesList, (marker) => {

				let markerPosition = null;

				try {
					markerPosition = marker.getPosition();
				} catch (e) { }

				try {
					if (markerPosition && markerPosition.lat) {
						// Definimos los objetos de ubicación
						let userLatLng = { latitude: userPosition.lat, longitude: userPosition.lng };

						let branchOfficeLatLng = { latitude: markerPosition.lat, longitude: markerPosition.lng };

						// Asignamos la distancia entre el usuario y cada sucursal
						let distance = Math.round(this.getDistance(userLatLng, branchOfficeLatLng));

						// Seteamos los valores de proximidad del usuario con cada sucursal
						marker.branchOfficeData.userProximity = {
							distance: distance,
							checkin: (distance <= ((this.markers.user.currentAccuracy) + this.params.acceptedDistance))
						};
					} else if (marker.position && marker.position.lat && marker.position.lng) {

						// Definimos los objetos de ubicación
						let userLatLng = { latitude: userPosition.lat, longitude: userPosition.lng };

						let branchOfficeLatLng = { latitude: marker.position.lat, longitude: marker.position.lng };

						// Asignamos la distancia entre el usuario y cada sucursal
						let distance = Math.round(this.getDistance(userLatLng, branchOfficeLatLng));

						// Seteamos los valores de proximidad del usuario con cada sucursal
						marker.branchOfficeData.userProximity = {
							distance: distance,
							checkin: (distance <= ((this.markers.user.currentAccuracy) + this.params.acceptedDistance))
						};
					}
				} catch (e) { }
			});
		}
	}

	// Incia el intervalo que calcula y asigna el tiempo transcurrido desde la última posición del usuario
	startIntervalElapsedTime() {
		this.elapsedTimeInterval = setInterval(() => {
			this.zone.run(() => {
				try {
					// Obtenemos el timestamp actual
					const currentTimestamp: any = new Date().getTime();
					// Restamos los dos timestamp y obtenemos el tiempo transcurrido en minutos
					const elapsedMinutes: any = Math.round((currentTimestamp - this.markers.user.currentTimestamp) / 60000);

					// Si el valor del timestamp con la fecha actual es menor a 1 minuto retornamos 'Ahora'
					if (elapsedMinutes < 1) {
						this.markers.user.elapsedTimeMessage = 'Act. ahora.';
						return;
					}
					// Si ha pasado 1 minuto o más, retornamos el mensaje
					this.markers.user.elapsedTimeMessage = `Act. hace ${elapsedMinutes} min.`;
				} catch (e) {
					// Si hay algún error retornamos vacío
					this.markers.user.elapsedTimeMessage = '';
				}
			});
		}, 5000);
	}

	// Limpia el intervalo que cuenta los minutos transcurridos
	clearElapsedTimeInterval() {
		clearInterval(this.elapsedTimeInterval);
	}

	// Detiene los procesos del mapa
	killMapProcess() {

		try {
			this.searchControlSubscription.unsubscribe();
		} catch (e) { }

		try {
			this.scrollControlSubscription.unsubscribe();
		} catch (e) { }

		// Borramos la suscripción a los cambios de ubicación
		this.unsubscribeToLocationChanges();
		this.clearElapsedTimeInterval();

		// Dejamos de escuchar los cambios de red
		this.events.unsubscribe('network-connected');
		this.events.unsubscribe('network-disconnected');
		// Habilitamos el menu al hacer swipe
		this.menu.swipeEnable(true, "menu");
		// Detenemos el intervalo que mira el estado del servicio de GPS
		this.stopGpsInterval();
		this.events.unsubscribe('close-from-alert');
		this.events.unsubscribe('checklists-closed');
		this.events.unsubscribe('registered-checkout');

		try {
			this.markerCluster.remove();
			this.markerCluster = null;
		} catch (e) { }

		// Eliminamos el mapa
		try {
			if (this.mapSubscription) this.mapSubscription.unsubscribe();
			if (this.scrollSub) this.scrollSub.unsubscribe();
			this.markers.user = null;

			this.markers.branchOffices = [];
			if (this.map) {
				this.map.setDiv(null);
				this.map.remove()
					.then((success) => {
						this.map = null;
					})
					.catch((error) => {
						try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
						this.map = null;
					});
			}
		} catch (e) {
			this.map = null;
		}
	}

	// Verifica la disponibilidad de un módulo
	checkModuleAvailability() {
		if (
			this.session
			&& this.session.usuario
			&& this.session.usuario.modulo_incidencias === true
		) {
			return true;
		}
		return false;
	}

	showLengthInfo() {
		const alert = this.alert.create({
			title: 'Información',
			subTitle: 'Debido a la gran cantidad de sucursales, estamos mostrando un número reducido de ellas. Para ver una en específico, por favor utilice el buscador.',
			buttons: [{
				text: 'Aceptar'
			}]
		});
		alert.present();
		this.branchOfficeLengthAlertShown = true;
	}

	async getCoords() {
		return new Promise((resolve, reject) => {
			const options: GeolocationOptions = { timeout: this.params.timeout, enableHighAccuracy: true, maximumAge: 100 };

			this.geolocation
				.getCurrentPosition(options)
				.then((position) => {
					resolve({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					})
				});
		})
	}

	enableCreateStore() {
		this.activeCreateStore = true;
		this.sessionProvider.getSession()
			.then(async (response: any) => {
				if (response) {
					const usuario: any[] = response.usuario;
					const active = usuario && usuario['agregar_sucursal'] || false;
					this.activeCreateStore = active;

				}
			});
	}

	async createStore() {
		const load = this.loading.create();
		load.present();

		try {
			const position = await this.getCoords();
			// const position = {
			// 	latitude: '-12',
			// 	longitude: '-12'
			// }
			load.dismiss();

			const modal = this.modal.create(CreateStoreComponent, {
				position
			});
			modal.onDidDismiss((data) => {
				if (data.update) {
					this.navCtrl.setRoot(this.navCtrl.getActive().component);
				}
			})
			modal.present();

		} catch (error) {
			load.dismiss();
		}
	}

	/**
	 * Actualiza el estado de una sucursal previamente cargada (paginación)
	 * @param branchOfficeId 
	 */
	updateBranchOfficeStatus(branchOfficeId: number, estado_checkin: any) {
		const branchOfficeMarker = _.find(this.markers.branchOffices, (bo: any) => {
			return bo.branchOfficeData.id === branchOfficeId;
		});

		if (branchOfficeMarker) {
			branchOfficeMarker.branchOfficeData.estado_checkin = estado_checkin;
		}
	}
}