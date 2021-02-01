import {ApplicationRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    ActionSheetController,
    AlertController,
    Events,
    IonicPage, Loading,
    LoadingController,
    MenuController,
    NavController, ToastController

} from 'ionic-angular';
/*import * as _ from 'lodash';
import {
    GoogleMaps,
    GoogleMap,
    GoogleMapsEvent,
    GoogleMapOptions,
    Marker,
    Circle,
    MarkerOptions, CameraPosition, LatLng
} from '@ionic-native/google-maps';
import {Diagnostic} from '@ionic-native/diagnostic';
import {SessionProvider} from "../../../../shared/providers/session/session";
import {UtilProvider} from "../../../../shared/providers/util/util";
import {VisitaSucursalPage} from "../sucursal/sucursal";
import {config} from "./map.config";
import {RequestProvider} from "../../../../shared/providers/request/request";
import {Storage} from "@ionic/storage";
import {global} from "../../../../shared/config/global";
import {Network} from "@ionic-native/network";
import {Geolocation} from '@ionic-native/geolocation';
import {HistoricasPage} from "../historicas/historicas";
import {RelojControlPage} from "../../../reloj-control/reloj-control";
import {AsignacionPage} from "../asignacion/asignacion";
import {PhotoAccessPage} from "../../../reloj-control/sub-pages/photo-access/photo-access";
import {DetailsMonthPage} from "../../../reloj-control/sub-pages/details-month/details-month";
import {Platform} from 'ionic-angular';
import {LocationAccuracy} from '@ionic-native/location-accuracy';
import {GcApp} from "../../../../app/app.component";*/

/**
 * Generated class for the VisitaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

declare var navigator: any;
declare var Connection: any;

@IonicPage()
@Component({
    selector: 'page-map',
    templateUrl: 'map.html',
})


export class MapPage {

    @ViewChild(Content) content: Content;

   /* map: GoogleMap;
    markets = [];
    settings = [];
    marker: {};
    selectedMarker: {};
    visita_tienda = {};
    season = {};
    myMarker = null;
    circle = null;
    thisSession = null;
    interval = null;
    searchGps = null;
    changeSubscription = null;
    disconnectSubscription = null;
    connectSubscription = null;
    gpswatch = null;
    toast = null;
    showBtnCheckIn: boolean = false;
    showBtnCheckOut: boolean = false;
    showBtnVisit: boolean = false;
    hasCheckin: boolean = false;
    hasInterval: boolean = true;
    noInternet: boolean = false;
    noGps: boolean = false;
    showMap: boolean = true;
    isMap: boolean = false;
    isLoading: boolean = false;
    isLoadingButtons: boolean = false;
    validCheckout: boolean = true;
    cargando: boolean = false;
    conectionLoading: boolean = false;
    firstLocation: boolean = true;
    message: "";
    fromCheckin = "mapa";
    checkin_id = 0;
    perimeterCheckin = 0;
    selectedMarkerId = 0;
    accuracy = 0;

    backLat = 0;
    backLong = 0;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private watcher_position: any = null;
    private watcher_suscription: any = null;
    private branch_offices: any = [];
    private selected_branch_office: any = 0;*/

    //private map_aux: GoogleMap;

    constructor(
        /*private navCtrl: NavController,
        private session: SessionProvider,
        private googleMaps: GoogleMaps,
        private applicationRef: ApplicationRef,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private events: Events,
        private storage: Storage,
        private alert: AlertController,
        private menu: MenuController,
        private network: Network,
        private actionSheet: ActionSheetController,
        private diagnostic: Diagnostic,
        private geolocation: Geolocation,
        public toastController: ToastController,
        private locationAccuracy: LocationAccuracy,
        public platform: Platform,
        private gcApp: GcApp*/) {
    }

    /* FUNCIONES TEMPORALES PARA LA IMPLEMENTACIÓN DE SELECT */
    /*ionViewWillEnter() {
        let mapOptions: GoogleMapOptions = {
            MyLocationEnabled: true,
            setMyLocationButtonEnabled: true,
            camera: {
                target: {
                    lat: 0, // default location
                    lng: 0 // default location
                },
                zoom: 16,
                tilt: 30,
            },
            controls: {
                zoom: true
            }
        };

        var resp = {
            'value': false,
            'message': "",
            'marker': null,
            'checkin': true
        };
    }

    /!* FUNCIONES TEMPORALES PARA LA IMPLEMENTACIÓN DE SELECT *!/
    ionViewDidLeave() {
        this.events.unsubscribe('map-network-disconnected');
        this.events.unsubscribe('map-network-connected');
    }

    async ionViewDidEnter() {
        this.menu.enable(true, "menu");
        this.isMap = false;
        await this.checkGpsStatus();
        this.isLoading = true;
        this.isLoadingButtons = true;

        let context = this;
        let loadingTime = setTimeout(function () {
                context.isLoadingButtons = false;
                console.log("end loading ", context.isLoadingButtons);
            }, (5000) //5 segundos
        );
        this.noInternet = !UtilProvider.hasInternet;

        this.thisSession = await this.util.getInternalSession();
        this.branch_offices = await this.getBranchOffices();
        this.getDatafromMemory();
        this.visita_tienda['markers'] = this.branch_offices;
        console.log("new branch_offices ", this.branch_offices);
        await this.getActiveCheckIn();
        this.isLoading = false;
        this.isLoadingButtons = false;
        clearInterval(loadingTime);

        console.log("ionViewDidEnter")

        /!**
         * Señal de aviso de desconexión a internet
         *!/
        this.events.subscribe('map-network-disconnected', async () => {
            console.log('network was disconnected :-(');
            if (this.map) this.map.clear();
            if (this.circle) {
                this.circle.remove();
                this.circle = null;
            }
            this.isMap = false;
            this.noInternet = true;
        });

        /!**
         * Señal de aviso de conexión/reconexión a internet
         *!/
        this.events.subscribe('map-network-connected', async () => {
            console.log('network connected! ', navigator.onLine);
            this.request
                .get(config.endpoints.get.getCheck, true)
                .then((response: any) => {
                    console.log("response ", response);
                    if (response.code == 200) {
                        console.log('si hay conexion valida');
                        this.noInternet = false;
                        if (this.conectionLoading == false) {
                            if (!this.map) {
                                console.log("no hay mapa en network")
                                this.isMap = true;
                                this.loadMap();
                                return;
                            }
                            console.log("si hay mapa en network")
                            this.map.remove().then((response: any) => {
                                console.log("remove")
                            });
                            this.loadMap().then((response: any) => {
                                console.log("loadMap")
                            });
                            return;
                        } else {
                            console.log("carga en curso ", this.conectionLoading)
                            return;
                        }
                    }
                }).catch((error: any) => {
                console.log('no hay conexion valida');
            });
        });

        /!**
         * Valida que la geolocalización se encuentra activada
         *!/
        this.diagnostic.isLocationEnabled().then(location => {
            console.log("isLocationEnabled : ", location);
            this.gpswatch = this.diagnostic.registerLocationStateChangeHandler((state) => {
                let view = this.navCtrl.getActive();
                if (view && view.instance instanceof MapPage) {
                    if (!this.cargando) {
                        this.checkGpsStatus();
                        this.gpsUpdate(state);
                    }
                    else console.log("cargando")
                }
            })
        });

        /!**
         * Watcher para cambios en ubicación
         * @type {Observable<Geoposition>}
         *!/
        this.watcher_position = this.geolocation.watchPosition();
        this.watcher_suscription = this.watcher_position.subscribe((data) => {
            /!* console.log("coords en mapa")
             console.log('En map Latitude: ' + data.coords.latitude + '\n' +
                 'Longitude: ' + data.coords.longitude + '\n' +
                 'Altitude: ' + data.coords.altitude + '\n' +
                 'Accuracy: ' + data.coords.accuracy + '\n' +
                 'Altitude Accuracy: ' + data.coords.altitudeAccuracy + '\n' +
                 'Heading: ' + data.coords.heading + '\n' +
                 'Speed: ' + data.coords.speed + '\n' +
                 'Timestamp: ' + data.timestamp + '\n');*!/
            if (this.isMap && this.noInternet == false) {
                this.updatePosition(data.coords);
            } else {
                console.log("No hay mapa")
                this.backLat = data.coords.latitude;
                this.backLong = data.coords.longitude;
                this.accuracy = data.coords.accuracy;
            }
        });

        this.toast = await this.toastController.create({
            message: 'Se ha perdido la conexión GPS, intentando reconectar',
            showCloseButton: false,
            position: 'top',
            cssClass: 'customToast',
            closeButtonText: 'Done'
        });

        this.checkGps().then((response: any) => {
            console.log("retorna ", response)
            if (this.noInternet != true) this.loadMap();
        });
    }

    ionViewWillLeave() {
        console.log("clearInterval")
        this.checkin_id = 0;
        this.storage.set('checkin_' + this.thisSession['usuario'].id, JSON.stringify(this.checkin_id));
        if (this.circle) {
            this.circle.remove();
            this.circle = null;
        }
        if (this.map) {
            this.map.clear();
            this.map.remove();
        }
        this.toast.dismiss();
        this.gpswatch = null;
        clearInterval(this.disconnectSubscription);
        clearInterval(this.changeSubscription);
        clearInterval(this.connectSubscription);
        if (this.watcher_suscription) {
            this.watcher_suscription.unsubscribe();
            this.watcher_suscription = null;
            this.watcher_position = null;
        }
    }

    /!**
     * Verifica el tipo de conexión que este utilizando el usuario
     *!/
    checkConnection() {
        var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'No network connection';
        console.log('Connection type: ' + states[networkState]);

        if (networkState == Connection.NONE) this.noInternet == true;
    }

    /!**
     * Aviso de encendido/apagado de GPS en Móvil
     *!/
    async checkGps() {
        return new Promise((resolve) => {
            this.diagnostic.isLocationEnabled().then(location => {
                console.log("isLocationEnabled : ", location);
                let context = this;
                if (location == false) context.noGps = true;
                else context.noGps = false;

                console.log("context.noGps en check gps : ", context.noGps);
                if (context.noGps) this.gpsUpdate('location_off');
                resolve(123);
            });
        });

    }

    /!**
     * Actualiza mapa de acuerdo a estado de GPS
     * @param state
     *!/
    async gpsUpdate(state) {
        this.cargando = true;
        //location_off, device_only, high_accuracy
        console.log("estado : " + state);
        if (state == 'location_off') {
            this.selected_branch_office = 0;
            this.isMap = false;
            let context = this;
            if (context.map) {
                context.map.clear();
            }
            if (context.circle) {
                context.circle.remove();
                context.circle = null;
            }
            context.noGps = true;
            context.cargando = false;
            context.applicationRef.tick();
            return;
        } else {
            this.toast.dismiss();

            this.toast = await this.toastController.create({
                message: 'Se ha perdido la conexión GPS, intentando reconectar',
                showCloseButton: false,
                position: 'top',
                cssClass: 'customToast',
                closeButtonText: 'Done'
            });

            console.log("noGps, noInternet ", this.noGps, this.noInternet);
            let context = this;
            console.log("volvio gps: " + context.noGps);

            clearInterval(context.searchGps);
            context.applicationRef.tick();

            if (!this.noInternet && this.noGps) {
                this.noGps = false;
                this.applicationRef.tick();
                if (!this.map) {
                    console.log("sin map ")
                    this.isMap = true;
                    this.loadMap();
                    this.cargando = false;
                    return;
                } else {
                    this.cargando = false;
                    let context = this;
                    console.log("con map ", context.map)

                    context.map.remove().then((response: any) => {
                        console.log("map.remove() ", response)
                    }).catch((error: any) => {
                        console.log("error map.remove", error);
                        if (error && error.message) this.util.showToast("Ocurrió un error al actualizar el mapa, por favor intente mas tarde", 3000);
                    });

                    context.isMap = true;
                    context.loadMap().then((response: any) => {
                        console.log("loadMap")
                    }).catch((error: any) => {
                        console.log("error loadMap", error);
                        if (error && error.message) this.util.showToast("Ocurrió un error al actualizar el mapa, por favor intente mas tarde", 3000);
                    });
                    return;
                }
            } else {
                this.noGps = false;
                console.log("no genera mapa, sin gps o internet ", this.noGps, this.noInternet)
                this.cargando = false;
                return;
            }
        }
    }

    /!**
     * Actualización de botones según el estado del marker seleccionado
     * @param resp
     *!/
    updatedSelect(resp) {
        console.log("resp", resp)
        var isSelected = resp['value'];
        if (!isSelected) {
            this.updateMessage(resp['message']);
            this.updateCheckIn(false);
            this.updateCheckOut(false);
            this.updateVisit(false);
        } else {
            this.selectedMarker = resp['marker'];
            this.updateMessage(resp['message']);
            if (resp['checkin']) {
                this.updateCheckIn(true);
                this.updateCheckOut(false);
                this.updateVisit(false);
            } else {
                this.updateCheckIn(false);
                this.updateCheckOut(true);
                this.updateVisit(true);
            }
            console.log("selectedMarker updatedSelect", this.selectedMarker)
        }
        this.applicationRef.tick();
    }

    /!**
     * Trae informacion de visitas alojada en memoria
     *!/
    getDatafromMemory() {
        if (!_.isUndefined(this.thisSession['usuario']) && !_.isNull(this.thisSession['usuario'])) {
            this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then((val) => {
                if (val) this.visita_tienda = JSON.parse(val);
                console.log('visita_tienda_' + this.thisSession['usuario'].id, this.visita_tienda);
            });

            this.storage.get('checkin_' + this.thisSession['usuario'].id).then((val) => {
                if (val) this.checkin_id = val;
                console.log('checkin_id ', this.checkin_id);
            });
        }
        return null;
    }

    /!**
     * Carga inicial de mapa con markers asociados
     * @returns {Promise<void>}
     *!/
    async loadMap() {
        this.selected_branch_office = 0;
        this.conectionLoading = true;
        this.isLoading = true;
        this.isLoadingButtons = true;

        let contextLoading = this;
        let loadingTime = setTimeout(function () {
                contextLoading.isLoadingButtons = false;
                console.log("end loading ", contextLoading.isLoadingButtons);
            }, (5000) //5 segundos
        );
        if (this.noGps == true) {
            console.log("no hay mapa, no hay gps ")
            let context = this;
            console.log("all markets", context.branch_offices)

            context.hasCheckin = false;
            this.updateCheckIn(false);
            this.updateCheckOut(false);
            this.updateVisit(false);
            this.updateMessage("Seleccione una sucursal de la lista o mapa.");

            //Sin GPS, se actualizan las sucursales, en caso de que existe checkin, se selecciona
            context.branch_offices.forEach(async (selectedMark, key) => {
                selectedMark['inMap'] = false;
                if (_.isNull(selectedMark.latitud) || _.isNull(selectedMark.longitud)) {
                    console.log("error de coordenadas")
                } else {
                    var latLng = {
                        lat: selectedMark.latitud,
                        lng: selectedMark.longitud
                    };
                    var addMarker = {
                        id_sucursal: selectedMark.id,
                        title: selectedMark.nombre_real,
                        icon: {
                            'url': this.platform.is('ios') ? 'www/assets/img/' + selectedMark.estado_checkin.icono : 'assets/img/' + selectedMark.estado_checkin.icono,
                            size: {
                                height: 25,
                                width: 25
                            }
                        },
                        position: latLng
                    };
                }
                //En caso de estar incompletro (con checkin) pasa a ser el checkin seleccionado
                if (selectedMark['estado_checkin'].codigo == "incompleta") {
                    if (this.checkin_id == 0) {
                        await this.request
                            .get(config.endpoints.get.getCheck, true)
                            .then((response: any) => {
                                console.log("response ", response);
                                if (response.code == 200) {
                                    this.checkin_id = response.data[0].control_checkin_id;
                                    console.log("checkin_id ", this.checkin_id);
                                }
                            }).catch((error: any) => {
                                console.log("error getCheck ", error);
                                if (error && error.message) this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente mas tarde", 3000);
                            });
                    }

                    context.selectedMarker = selectedMark;
                    console.log("tiene checkin")
                    context.hasCheckin = true;
                    var message = "Tienes seleccionada la sucursal: " + selectedMark.nombre;
                    if (!_.isNull(addMarker) || !_.isUndefined(addMarker)) {
                        resp = {
                            'value': true,
                            'message': message,
                            'marker': addMarker,
                            'checkin': false
                        };
                    } else {
                        resp = {
                            'value': true,
                            'message': message,
                            'marker': null,
                            'checkin': false
                        };
                    }

                    this.selected_branch_office = selectedMark.id;
                    console.log("selected_branch_office ", this.selected_branch_office)
                    this.applicationRef.tick();
                    context.updatedSelect(resp);
                }
                if (key == (context.markets.length - 1)) {
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    this.conectionLoading = false;
                    clearInterval(loadingTime);
                }
            });
        } else {
            //Si existe GPS, se crea el mapa, una vez finalizado, se realizan las acciones determinadas
            let context = this;
            let mapOptions: GoogleMapOptions = {
                MyLocationEnabled: true,
                setMyLocationButtonEnabled: true,
                camera: {
                    target: {
                        lat: 0, // default location
                        lng: 0 // default location
                    },
                    zoom: 16,
                    tilt: 30,
                },
                controls: {
                    zoom: true
                }
            };
            console.log("mapOptions ", mapOptions)
            var resp = {
                'value': false,
                'message': "",
                'marker': null,
                'checkin': true
            };

            context.hasCheckin = false;
            this.updateCheckIn(false);
            this.updateCheckOut(false);
            this.updateVisit(false);
            this.updateMessage("Seleccione una sucursal de la lista o mapa.");


            context.map = GoogleMaps.create('map_canvas', mapOptions);

            console.log("GoogleMaps.create")
            // Wait the MAP_READY before using any methods.
            context.map.one(GoogleMapsEvent.MAP_READY)
                .then(async () => {
                    this.isMap = true;
                    console.log("in MAP_READY")
                    console.log("all markets", context.branch_offices)

                    //Se recorren las sucursales para crearlas como marker en mapa, si hay checkin pendiente, se selecciona
                    await context.asyncForEach(context.branch_offices, async (selectedMark, key) => {
                        console.log("selectedMark ", JSON.parse(JSON.stringify(selectedMark)))
                        if (_.isNull(selectedMark.latitud) || _.isNull(selectedMark.longitud)) {
                            console.log("error de coordenadas")
                            selectedMark['inMap'] = false;
                            if (selectedMark['estado_checkin'].codigo == "incompleta") {
                                if (this.checkin_id == 0) {
                                    await this.request
                                        .get(config.endpoints.get.getCheck, true)
                                        .then((response: any) => {
                                            console.log("response ", response);
                                            if (response.code == 200) {
                                                this.checkin_id = response.data[0].control_checkin_id;
                                                console.log("checkin_id ", this.checkin_id);
                                            }
                                        }).catch((error: any) => {
                                            console.log("error getCheck", error);
                                            if (error && error.message) this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente mas tarde", 3000);
                                        });
                                } else {
                                    console.log("tiene checkin_id")
                                }
                                console.log("tiene checkin")
                                context.hasCheckin = true;
                                var message = "Tienes seleccionada la sucursal: " + selectedMark.nombre;
                                resp = {
                                    'value': true,
                                    'message': message,
                                    'marker': null,
                                    'checkin': false
                                };
                                this.selected_branch_office = selectedMark.id;
                                context.updatedSelect(resp);
                            }
                        } else {
                            selectedMark['inMap'] = true;
                            var latLng = {
                                lat: selectedMark.latitud,
                                lng: selectedMark.longitud
                            };
                            let marker: Marker;
                            var addMarker = {
                                id_sucursal: selectedMark.id,
                                title: selectedMark.nombre_real,
                                icon: {
                                    'url': this.platform.is('ios') ? 'www/assets/img/' + selectedMark.estado_checkin.icono : 'assets/img/' + selectedMark.estado_checkin.icono,
                                    size: {
                                        height: 25,
                                        width: 25
                                    }
                                },
                                position: latLng
                            };

                            console.log("addMarker ", addMarker)
                            marker = this.map.addMarkerSync(addMarker);
                            console.log("marker in map ", marker)
                            selectedMark['mapMarker'] = marker;

                            //En caso de estar incompletro (con checkin) pasa a ser el checkin seleccionado
                            if (selectedMark['estado_checkin'].codigo == "incompleta") {
                                if (this.checkin_id == 0) {
                                    await this.request
                                        .get(config.endpoints.get.getCheck, true)
                                        .then((response: any) => {
                                            console.log("response ", response);
                                            if (response.code == 200) {
                                                this.checkin_id = response.data[0].control_checkin_id;
                                                console.log("checkin_id ", this.checkin_id);
                                            }
                                        }).catch((error: any) => {
                                            console.log("error getCheck", error);
                                            if (error && error.message) this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente mas tarde", 3000);
                                        });
                                } else {
                                    console.log("tiene checkin_id")
                                }
                                console.log("tiene checkin")
                                context.hasCheckin = true;
                                context.selectedMarker = marker;
                                var message = "Tienes seleccionada la sucursal: " + marker.get('title');
                                resp = {
                                    'value': true,
                                    'message': message,
                                    'marker': marker,
                                    'checkin': false
                                };
                                this.selected_branch_office = selectedMark.id;
                                context.updatedSelect(resp);

                                this.map.moveCamera({
                                    target: {lat: selectedMark.latitud, lng: selectedMark.longitud}
                                }).then(() => {
                                    //alert("Camera target has been changed");
                                });
                            }

                            /!*if (key == (context.markets.length - 1)) {
                                await context.getPosition(context.thisSession.usuario)
                                  this.conectionLoading = false;
                                  this.isLoading = false;
                                  this.isLoadingButtons = false;
                                  this.isMap = true;
                                  clearInterval(loadingTime);
                            }*!/
                            //En caso de que se seleccione el checklist en el mapa
                            marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((selectedMarker: any) => {
                                console.log("select ", selectedMark, selectedMarker)
                                context.markerClicked(selectedMarker, selectedMark, marker, "mapa")
                            });
                        }
                    });
                    console.log("context.branch_offices in loadMap ", context.branch_offices)
                    await context.getPosition(context.thisSession.usuario)
                    this.conectionLoading = false;
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    context.applicationRef.tick();
                    console.log("termino for")
                }).catch(error => {
                this.conectionLoading = false;
                this.isLoading = false;
                this.isLoadingButtons = false;
                clearInterval(loadingTime);
                console.log("loadmap error ", error);
                return false;
            });
        }
    }

    /!**
     * Si pasa las restricciones el marker pasa a estado incompleto y queda seleccionado,
     * para cambiar el estado se borra el marker y se vuelve a generar con su nuevo estado.
     *!/
    async selectCheckin() {
        if (this.noInternet) {
            this.util.showToast('No puede hacer checkin sin conexión a internet', 5000);
            return;
        }
        console.log("all markets", this.branch_offices)
        console.log("marker", this.selectedMarker)
        console.log("fromCheckin", this.fromCheckin)

        let toSend = {};
        let branch_office = null;
        //let select = 0;
        const loading = this.loading.create({content: 'Registrando Check-In', duration: 7000});
        loading.present();
        this.isLoading = true;
        this.isLoadingButtons = true;
        let context = this;
        let loadingTime = setTimeout(function () {
                context.isLoadingButtons = false;
                console.log("end loading ", context.isLoadingButtons);
            }, (5000) //5 segundos
        );
        //setCheckInFromSelect
        if (this.fromCheckin == "select") {

            console.log("selected_branch_office", this.selected_branch_office)
            branch_office = _.find(this.branch_offices, {id: this.selected_branch_office});

            if (!branch_office) {
                this.util.showToast('Sucursal no seleccionada, por favor intente nuevamente', 5000);
                this.isLoading = false;
                this.isLoadingButtons = false;
                clearInterval(loadingTime);
                loading.dismiss();
                return;
            }

            toSend = {
                "sucursal_id": branch_office.id,
                "latitud_inicial": this.backLat,
                "longitud_inicial": this.backLong,
                "manual": true
            };
            console.log("toSend", toSend)
        } else {
            toSend = {
                "sucursal_id": this.selectedMarker['get']('id_sucursal'),
                "latitud_inicial": this.backLat,
                "longitud_inicial": this.backLong
            };
            console.log("toSend", toSend)
        }

        //validador de id de sucursal
        if (toSend['sucursal_id'] == 0 || _.isUndefined(toSend['sucursal_id']) || _.isNull(toSend['sucursal_id'])) {
            this.restartFunctions(loadingTime);
            loading.dismiss();

            const confirm = this.alert.create({
                title: 'Atención',
                message: "No se ha seleccionado sucursal, intente nuevamente",
                buttons: [{
                    text: 'Aceptar',
                    handler: () => {
                        return;
                    }
                }]
            });
            confirm.present();
        } else {
            await this.request
                .post(config.endpoints.post.checkIn, toSend, true)
                .then(async (response: any) => {
                    console.log("response ", response);
                    if (response.message == "Debe marcar la salida pendiente.") {
                        loading.dismiss();
                        this.util.showToast("Ya existe un checkin pendiente, se requiere hacer checkout para poder continuar", 3000);
                    } else {

                        this.checkin_id = response.data[0].control_checkin_id;
                        this.storage.set('checkin_' + this.thisSession['usuario'].id, this.checkin_id);
                        if (this.fromCheckin == "mapa") {
                            console.log("id_sucursal", this.selectedMarker['get']('id_sucursal'))
                            this.selectedMarkerId = this.selectedMarker['get']('id_sucursal');
                        } else {
                            console.log("id_sucursal", branch_office.id)
                            this.selectedMarkerId = branch_office.id;
                            this.updateCheckIn(false);
                            this.updateCheckOut(true);
                            this.updateVisit(true);
                        }
                        console.log("guarda checkin desde post ", this.checkin_id)
                        this.storage.set('checkin_' + this.thisSession['usuario'].id, this.checkin_id);
                        let foundMarker = {};
                        let selectMark = _.find(this.branch_offices, {id: this.selectedMarkerId});
                        console.log("selectMark", selectMark)
                        if (!_.isUndefined(selectMark) && !_.isNull(selectMark)) {
                            console.log("foundMarker", foundMarker)
                            this.updateCheckIn(false);
                            this.updateCheckOut(true);
                            this.updateVisit(true);
                            if (!_.isNull(selectMark.estado_checkin) && !_.isUndefined(selectMark.estado_checkin)) {
                                selectMark.estado_checkin = {
                                    codigo: 'incompleta',
                                    icono: 'ico-mapa-incompleto.png',
                                    nombre: 'Incompleta'
                                };
                                var latLng = {
                                    lat: selectMark['latitud'],
                                    lng: selectMark['longitud']
                                };
                                var addMarker = {
                                    id_sucursal: selectMark['id'],
                                    title: selectMark['nombre_real'],
                                    icon: {
                                        'url': this.platform.is('ios') ? 'www/assets/img/' + selectMark.estado_checkin.icono : 'assets/img/' + selectMark.estado_checkin.icono,
                                        size: {
                                            height: 25,
                                            width: 25
                                        }
                                    },
                                    position: latLng
                                };
                                if (!_.isNull(selectMark.mapMarker) && !_.isUndefined(selectMark.mapMarker)) {
                                    if (selectMark.mapMarker && selectMark.mapMarker.setMap) {
                                        console.log("borra ", selectMark.mapMarker)
                                        selectMark.mapMarker.setMap(null);
                                    }
                                    if (!_.isNull(selectMark['inMap']) && !_.isUndefined(selectMark['inMap']) && selectMark['inMap'] == true) {
                                        selectMark.mapMarker.remove();
                                        let marker: Marker = this.map.addMarkerSync(addMarker);
                                        console.log("addMarker ", marker)
                                        selectMark['mapMarker'] = marker;
                                        this.selectedMarker = marker;

                                        //espera que sea seleccionado
                                        marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((selectedMarker: any) => {
                                            this.markerClicked(selectedMarker, selectMark, marker, "mapa");
                                        });
                                    } else this.util.showToast("Ocurrió un error al actualizar el checkin el mapa, por favor actualize para ver el registro en el mapa", 3000);
                                }
                            }
                            this.hasCheckin = true;
                            try {
                                let context = this;
                                console.log("scroll to bottom")
                                context.content.scrollToBottom(300);
                            } catch (e) {
                                console.log("Error en scroll ", e)
                            }
                        } else {
                            console.log("sin selectMark")
                        }
                        this.isLoading = false;
                        this.isLoadingButtons = false;
                        clearInterval(loadingTime);
                        loading.dismiss();
                    }
                })
                .catch((error: any) => {
                    console.log("error checkIn", error);
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    loading.dismiss();
                    if (error && error.message) this.util.showToast("Ocurrió un error al marcar Checkin, por favor intente mas tarde", 3000);
                });
        }

    }

    /!**
     * Cambio de estado de marker a finalizado (a checkout), se desbloquear el poder
     * clickear otros markers y envia data a servicio
     *!/
    async selectCheckout() {
        if (this.noInternet == true) {
            const confirm = this.alert.create({
                title: 'Atención',
                message: "No se ha detectado una conexión a internet, los datos no pueden ser enviados",
                buttons: [{
                    text: 'Aceptar',
                    handler: () => {
                        //this.loadMap();
                    }
                }]
            });
            confirm.present();
        } else {
            //let context = this;
            console.log("validCheckout ", this.validCheckout);

            const confirm = this.alert.create({
                title: 'Atención',
                message: "¿Esta seguro de seleccionar checkout en la sucursal seleccionada?",
                buttons: [{
                    text: 'Cancelar',
                    handler: () => {
                        //this.loadMap();
                    }
                }, {
                    text: 'Aceptar',
                    handler: () => {
                        this.preSendCheckout();
                    }
                }]
            });
            confirm.present();

            /!* if (this.validCheckout == false) {

             } else {
                 this.preSendCheckout();
             }*!/
        }
    }

    /!**
     * Continuacion de selectCheckout tras realizar validaciones de tiempo
     * @returns {Promise<void>}
     *!/
    async preSendCheckout() {
        const loading = this.loading.create({content: 'Subiendo Información', duration: 7000});
        loading.present();
        this.isLoading = true;
        this.isLoadingButtons = true;
        let context = this;
        let loadingTime = setTimeout(function () {
                context.isLoadingButtons = false;
                console.log("end loading ", context.isLoadingButtons);
            }, (5000) //5 segundos
        );
        console.log("all markets", this.branch_offices)
        console.log("marker", this.selectedMarker)

        var position = {
            coords: {
                latitude: this.backLat,
                longitude: this.backLong,
                accuracy: this.accuracy
            }
        };
        this.validateHasCheckin(position).then(position => {
            this.isLoading = false;
            this.isLoadingButtons = false;
            clearInterval(loadingTime);
            loading.dismiss();
        }).catch((error: any) => {
            this.util.showToast("Ocurrió un error al validar el checkout, por favor intente mas tarde", 3000);
            loading.dismiss();
        });
    }

    /!**
     * Valida que exista un checkin pendiente en el servidor
     * @param position
     * @returns {Promise<void>}
     *!/
    async validateHasCheckin(position) {
        if (this.checkin_id == 0) {
            this.request
                .get(config.endpoints.get.getCheck, true)
                .then((response: any) => {
                    console.log("response ", response);
                    if (response.code == 200) {
                        this.checkin_id = response.data[0].control_checkin_id;
                        console.log("checkin_id ", this.checkin_id);
                        this.sendCheckout(position);
                    }
                }).catch((error: any) => {
                console.log("error getCheck ", error);
                if (error && error.message) this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente mas tarde", 3000);
            });
        } else {
            this.sendCheckout(position);
        }
    }

    /!**
     * Envia checkout a servidor y reinicia mapa
     * @param resp
     *!/
    sendCheckout(resp) {
        const loading = this.loading.create({content: 'Actualizando información', duration: 20000});
        loading.present();
        this.isLoading = true;
        this.isLoadingButtons = true;
        let context = this;
        let loadingTime = setTimeout(function () {
                context.isLoadingButtons = false;
                console.log("end loading ", context.isLoadingButtons);
            }, (5000) //5 segundos
        );
        var toSend = {
            "control_checkin_id": this.checkin_id,
            "latitud_final": resp.coords.latitude,
            "longitud_final": resp.coords.longitude
        };
        let select = 0;

        this.request
            .post(config.endpoints.post.checkOut, toSend, true)
            .then(async (response: any) => {
                console.log("checkOut")
                this.paramsToSend().then((response: any) => {
                    if (this.isMap == true && this.noGps == false) {
                        let context = this;
                        if (this.fromCheckin == "select") select = this.selectedMarker['get']('id_sucursal');
                        else select = context.selected_branch_office;

                        let selectMark = _.find(context.branch_offices, {id: select});
                        console.log("selectMark ", selectMark)
                        if (!_.isNull(selectMark.estado_checkin) && !_.isUndefined(selectMark.estado_checkin)) {
                            selectMark.estado_checkin = {
                                codigo: "visitada",
                                icono: "ico-mapa-finalizado.png",
                                nombre: "OK"
                            };
                            var latLng = {
                                lat: selectMark['latitud'],
                                lng: selectMark['longitud']
                            };

                            var addMarker = {
                                id_sucursal: selectMark['id'],
                                title: selectMark['nombre_real'],
                                icon: {
                                    'url': this.platform.is('ios') ? 'www/assets/img/' + selectMark.estado_checkin.icono : 'assets/img/' + selectMark.estado_checkin.icono,
                                    size: {
                                        height: 25,
                                        width: 25
                                    }
                                },
                                position: latLng
                            };
                            if (!_.isNull(selectMark.mapMarker) && !_.isUndefined(selectMark.mapMarker)) {
                                if (selectMark.mapMarker && selectMark.mapMarker.setMap) {
                                    console.log("borra ", selectMark.mapMarker)
                                    selectMark.mapMarker.setMap(null);
                                }
                                if (!_.isNull(selectMark['inMap']) && !_.isUndefined(selectMark['inMap']) && selectMark['inMap'] == true) {
                                    selectMark.mapMarker.remove();
                                    let marker: Marker = this.map.addMarkerSync(addMarker);
                                    console.log("addMarker ", marker)
                                    selectMark['mapMarker'] = marker;
                                    this.selectedMarker = marker;

                                    //espera que sea seleccionado
                                    marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe((selectedMarker: any) => {
                                        this.markerClicked(selectedMarker, selectMark, marker, "mapa");
                                    });
                                } else this.util.showToast("Ocurrió un error al actualizar el checkout el mapa, por favor actualize para ver el registro en el mapa", 3000);
                            }
                        }
                    }
                    this.restartFunctions(loadingTime);
                    loading.dismiss();
                }).catch((error: any) => {
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    loading.dismiss();
                    console.log("error paramsToSend", error);
                    if (error && error.message) this.util.showToast("Ocurrió un error al enviar la información, por favor intente mas tarde", 3000);
                });
            }).catch((error: any) => {
            this.isLoading = false;
            this.isLoadingButtons = false;
            clearInterval(loadingTime);
            loading.dismiss();
            console.log("error checkOut", error);
            if (error && error.message) this.util.showToast("Ocurrió un error al marcar el Checkout, por favor intente mas tarde", 3000);
        });
    }

    /!**
     * Restaura variables para ser utilizadas despues de hacer checkout
     *!/
    restartFunctions(loadingTime) {
        this.marker = {};
        this.selectedMarker = {};
        this.hasCheckin = false;
        this.updateCheckIn(false);
        this.updateCheckOut(false);
        this.updateVisit(false);
        this.updateMessage("Seleccione una sucursal de la lista o mapa.");
        this.checkin_id = 0;
        this.selected_branch_office = 0;
        this.storage.set('checkin_' + this.thisSession['usuario'].id, JSON.stringify(this.checkin_id));
        this.util.showToast('Datos actualizados correctamente', 5000);
        this.isLoading = false;
        this.isLoadingButtons = false;
        this.applicationRef.tick();
        clearInterval(loadingTime);
        return true;
    }

    /!**
     * Se ejecuta cuando un marker es seleccionado, se valida que cumpla con la distancia maxima y que no halla
     * otro marker con checkin, luego se actualizan los botones a mostrar
     * @param selectedMarker
     * @param foundMarker2
     * @param marker
     *!/
    markerClicked(selectedMarker, foundMarker, marker, from) {
        const loading = this.loading.create({
            content: 'Cargando sucursal',
            duration: 7000
        });
        loading.present();
        console.log("this.selectedMarker ", this.selectedMarker)
        console.log("selectedMarker ", selectedMarker)
        console.log("foundMarker ", foundMarker)
        console.log("marker ", marker)
        console.log("from ", from)
        if (this.hasCheckin == false || (this.hasCheckin == true && this.selectedMarker && this.selectedMarker['get'] && this.selectedMarker['get']('id_sucursal') == selectedMarker[1]['get']('id_sucursal'))) {
            //this.selectedMarker = marker;
            const mark = selectedMarker[1];
            //Se obtiene las coordenadas del marcador
            try {
                var latMarker, lngMarker;
                var pos = mark.getPosition() ? mark.getPosition() : (mark._objectInstance ? mark._objectInstance.position : {
                    lat: null,
                    lng: null
                });
            } catch (e) {
                this.util.showAlert("Atención", "No se encuentra la ubiacion de la sucursal");
            }

            latMarker = pos.lat;
            lngMarker = pos.lng;

            if (from == "mapa") {
                this.validatePerimeter({
                    coords: {
                        latitude: this.backLat,
                        longitude: this.backLong,
                        accuracy: this.accuracy
                    }
                }, latMarker, lngMarker, foundMarker, marker, from).then(test => {
                });
            } else {
                this.validatePerimeter({
                    coords: {
                        latitude: 0,
                        longitude: 0
                    }
                }, latMarker, lngMarker, foundMarker, marker, from).then(test => {
                });
            }
            this.fromCheckin = from;
            console.log("seleccionado desde: ", this.fromCheckin)
            loading.dismiss();
            return;
        } else {
            console.log("ya tiene checkin ", this.hasCheckin)
            this.util.showAlert("Atención", "No se puede hacer checkin en una sucursal si ya seleccionó otra");
            loading.dismiss();
            return;
        }
    }

    /!**
     * Se valida que la sucursal seleccionada se encuentre dentro del perimetro admitido
     * @param position
     * @param latMarker
     * @param lngMarker
     * @param foundMarker
     * @param marker
     * @returns {Promise<boolean>}
     *!/
    async validatePerimeter(position, latMarker, lngMarker, foundMarker, marker, from) {
        marker = marker.length > 1 ? marker[1] : marker;

        function toRad(x) {
            return x * Math.PI / 180;
        }

        if (!_.isUndefined(this.perimeterCheckin) && !_.isUndefined(this.perimeterCheckin)) {
            var earthRadius = {
                miles: 3958.8,
                km: 6371,
                mt: 6371000
            };
            var R = earthRadius['mt'];
            var lat1 = position.coords.latitude;
            var lon1 = position.coords.longitude;
            var lat2 = latMarker;
            var lon2 = lngMarker;
            var dLat = toRad((lat2 - lat1));
            var dLon = toRad((lon2 - lon1));
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;

            let showCheckin = true;
            if (foundMarker && foundMarker['estado_checkin'].codigo == 'incompleta') {
                showCheckin = false;
            }
            // solo sera seleccionable si se encuentra dentro del perimetro del usuario
            console.log("position ", position)
            console.log("d ", d)
            console.log("perimeterCheckin ", this.perimeterCheckin['value'])

            /!*this.backLat = position.coords.latitude;
            this.backLong = position.coords.longitude;
            this.accuracy = position.coords.accuracy ? position.coords.accuracy : 0;*!/
            if (from == "mapa") {
                if (d < (this.perimeterCheckin['value'] + (this.accuracy ? this.accuracy : 0))) {
                    /!*var coordinates = {
                        myLocation: {
                            lat: lat1,
                            lng: lon1
                        },
                        markerLocation: {
                            lat: lat2,
                            lng: lon2
                        }
                    };
                    var timestamp = String(new Date().getTime());
                    var today = new Date();
                    var datestring = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
                     var params = {
                         sucursal_id: marker.get('id_sucursal') ? marker.get('id_sucursal') : marker._objectInstance.id_sucursal,
                         app_id: 'SUC-' + (marker.get('id_sucursal') ? marker.get('id_sucursal') : marker._objectInstance.id_sucursal) + '-' + timestamp,
                         nombre: marker.get('title') ? marker.get('title') : marker._objectInstance.title,
                         latitud: coordinates.myLocation.lat,
                         longitud: coordinates.myLocation.lng,
                         fecha: datestring
                     };*!/
                    var message = "Tienes seleccionada la sucursal: " + (marker.get('title') ? marker.get('title') : marker._objectInstance.title);
                    var resp = {
                        'value': true,
                        'message': message,
                        'marker': marker,
                        'checkin': showCheckin
                    };
                    this.updatedSelect(resp);
                    this.selectedMarker = marker;
                    this.selected_branch_office = _.find(this.branch_offices, {id: this.selectedMarker['get']('id_sucursal')}).id;
                    console.log("this.selected_branch_office ", this.selected_branch_office)
                    //return true;
                } else {
                    this.util.showAlert("Atención", "La sucursal seleccionada se encuentra fuera del rango de seleccion");
                }
            } else {
                /!*var coordinates = {
                    myLocation: {
                        lat: lat1,
                        lng: lon1
                    },
                    markerLocation: {
                        lat: lat2,
                        lng: lon2
                    }
                };
                var timestamp = String(new Date().getTime());
                var today = new Date();
                var datestring = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

                var params = {
                    sucursal_id: marker.get('id_sucursal') ? marker.get('id_sucursal') : marker._objectInstance.id_sucursal,
                    app_id: 'SUC-' + (marker.get('id_sucursal') ? marker.get('id_sucursal') : marker._objectInstance.id_sucursal) + '-' + timestamp,
                    nombre: marker.get('title') ? marker.get('title') : marker._objectInstance.title,
                    latitud: coordinates.myLocation.lat,
                    longitud: coordinates.myLocation.lng,
                    fecha: datestring
                };*!/
                var message = "Tienes seleccionada la sucursal: " + (marker.get('title') ? marker.get('title') : marker._objectInstance.title);
                var resp = {
                    'value': true,
                    'message': message,
                    'marker': marker,
                    'checkin': showCheckin
                };
                let suc = _.find(this.branch_offices, {id: this.selected_branch_office});
                if (!_.isNull(suc) && !_.isUndefined(suc) && this.noGps == false) {
                    this.selectedMarker = suc['mapMarker'];
                    console.log("nuevo mark select", this.selectedMarker)

                    if (!_.isNull(suc['mapMarker']) && !_.isUndefined(suc['mapMarker'])) {
                        suc['mapMarker'].showInfoWindow();
                        this.map.moveCamera({
                            target: {lat: suc.latitud, lng: suc.longitud}
                        }).then(() => {
                            //alert("Camera target has been changed");
                        });
                    }
                }
                this.updatedSelect(resp);
            }
            try {
                let context = this;
                console.log("scroll in markerClicked")
                context.content.scrollToBottom(300);
            } catch (e) {
                console.log("error scroll in markerClicked ", e)
            }
            return true;
        }
    }

    /!**
     * Borra mapa actual y genera uno nuevo con las mismas condiciones
     * @returns {Promise<void>}
     *!/
    async updateAll() {
        if (this.noInternet == true) {
            this.util.showToast("Se requiere de una conexión a internet válida para actualizar", 3000);
        } else {
            this.isLoading = true;
            this.isLoadingButtons = true;

            let context = this;
            let loadingTime = setTimeout(function () {
                    context.isLoadingButtons = false;
                    console.log("end loading ", context.isLoadingButtons);
                }, (5000) //5 segundos
            );
            if (!this.map) {
                this.paramsToSend().then((response: any) => {
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    this.loadMap().then((response: any) => {
                        this.util.showToast('Datos actualizados correctamente', 5000);
                    }).catch((error: any) => {
                        clearInterval(loadingTime);
                        console.log("error loadMap", error);
                        if (error && error.message) this.util.showToast("Ocurrió un error al cargar el mapa, por favor intente mas tarde", 3000);
                    });

                }).catch((error: any) => {
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    console.log("error paramsToSend", error);
                    if (error && error.message) this.util.showToast("Ocurrió un error al enviar la información, por favor intente mas tarde", 3000);
                });
            } else {
                this.map.remove().then((response: any) => {
                    console.log("remove")
                    this.paramsToSend().then((response: any) => {
                        this.isLoading = false;
                        this.isLoadingButtons = false;
                        clearInterval(loadingTime);
                        this.loadMap().then((response: any) => {
                            this.util.showToast('Datos actualizados correctamente', 5000);
                        }).catch((error: any) => {
                            console.log("error loadMap", error);
                            if (error && error.message) this.util.showToast("Ocurrió un error al cargar el mapa, por favor intente mas tarde", 3000);
                        });
                    }).catch((error: any) => {
                        this.isLoading = false;
                        this.isLoadingButtons = false;
                        clearInterval(loadingTime);
                        console.log("error paramsToSend", error);
                        if (error && error.message) this.util.showToast("Ocurrió un error al enviar la información, por favor intente mas tarde", 3000);
                    });
                    console.log("response ", response);
                }).catch((error: any) => {
                    this.isLoading = false;
                    this.isLoadingButtons = false;
                    clearInterval(loadingTime);
                    console.log("error remove", error);
                    if (error && error.message) this.util.showToast("Ocurrió un error al actualizar el mapa, por favor intente mas tarde", 3000);
                });
            }
        }
    }

    /!**
     * Se trae desde memoria las variables para envio
     *!/
    async paramsToSend() {
        console.log("visita_tienda ", this.visita_tienda)
        let resps = this.visita_tienda['respuestas'];
        let visit = this.visita_tienda['visitas'];

        /!**
         * Se recorren las preguntas asociadas a la visita para validar que existan preguntas con 'No aplica',
         * en ese caso se genera una respuesta manual con datosa
         *!/
        _.forEach(this.visita_tienda['checklist_visita'], function (check) {
            _.forEach(check.ambitos, function (ambito) {
                _.forEach(ambito.preguntas, function (pregunta) {
                    if (pregunta.aplica == 1 && (!_.isNull(pregunta.hasApply) && !_.isUndefined(pregunta.hasApply) && pregunta.hasApply == false)) {
                        //TODO: agrega respuesta ficticia
                        console.log("alternativas ", pregunta.alternativas)
                        console.log("alternativas[0] ", pregunta.alternativas[Object.keys(pregunta.alternativas)[0]])

                        if (pregunta.tipo_id == 1) {
                            let resp = {
                                alternativa_peso: 0,
                                ambito_id: ambito.id,
                                comentario: 0,
                                comentarios: null,
                                id: "",
                                modified: true,
                                nombre_alternativa: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].nombre,
                                nombre_pregunta: pregunta.nombre,
                                pregunta_alternativa_id: 0,
                                pregunta_id: pregunta.id,
                                respuesta_alternativa_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                texto_adicional: "",
                                texto_respuesta: "",
                                tipo_id: 1,
                                visita_id: check.visita_id,
                                noAplica: true
                            };
                            console.log("no aplica resp 1 ", resp)
                            resps.push(resp)
                        } else if (pregunta.tipo_id == 2) {
                            let resp = {
                                ambito_id: ambito.id,
                                checkbox_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                checked: true,
                                comentario: 0,
                                comentarios: null,
                                modified: true,
                                nombre_alternativa: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].nombre,
                                nombre_pregunta: pregunta.nombre,
                                pregunta_alternativa_id: 0,
                                pregunta_id: pregunta.id,
                                respuesta_alternativa_id: pregunta.alternativas[Object.keys(pregunta.alternativas)[0]].id,
                                tipo_id: 2,
                                visita_id: check.visita_id,
                                noAplica: true
                            };
                            console.log("no aplica resp 2 ", resp)
                            resps.push(resp);
                        } else if (pregunta.tipo_id == 3) {
                            let resp = {
                                alternativa_peso: 0,
                                ambito_id: ambito.id,
                                modified: true,
                                nombre_alternativa: "",
                                nombre_pregunta: pregunta.nombre,
                                pregunta_alternativa_id: 0,
                                pregunta_id: pregunta.id,
                                respuesta_alternativa_id: 0,
                                texto_respuesta: "No Aplica",
                                tipo_id: 3,
                                visita_id: check.visita_id,
                                noAplica: true
                            };
                            console.log("no aplica resp 3 ", resp)
                            resps.push(resp)
                        } else if (pregunta.tipo_id == 4) {
                            let resp = {
                                alternativa_peso: 0,
                                ambito_id: ambito.id,
                                foto: [{
                                    foto: "data:image/jpeg;base64,R0lGODlhDwAPAKECAAAAzMzM/////wAAACwAAAAADwAPAAACIISPeQHsrZ5ModrLlN48CXF8m2iQ3YmmKqVlRtW4MLwWACH+H09wdGltaXplZCBieSBVbGVhZCBTbWFydFNhdmVyIQAAOw==",
                                }],
                                id: "54749030-62061000-76471000-44501000-229478956435100000000000",
                                modified: true,
                                nombre_alternativa: "",
                                nombre_pregunta: pregunta.nombre,
                                pregunta_alternativa_id: 0,
                                pregunta_id: pregunta.id,
                                respuesta_alternativa_id: 0,
                                texto_respuesta: "",
                                tipo_id: 4,
                                visita_id: check.visita_id,
                                noAplica: true
                            };
                            console.log("no aplica resp 4 ", resp)
                            resps.push(resp)
                        }
                    }
                });
            });
        });
        console.log("new resps ", resps)

        await this.sendOfflineData(visit, resps);
    }

    /!**
     * Envio de visitas a servicio
     * @param visitas
     * @param respuestas
     * @returns {Promise<{}>}
     *!/
    async sendOfflineData(visitas, respuestas) {
        console.log("updateOfflineData ", visitas, respuestas)
        var params = {
            data: {
                visitas_respuestas: visitas ? visitas : [],
                respuestas: respuestas
            }
        };
        _.forEach(params.data.respuestas, function (resp) {
            /!*if(_.isNull(resp.aplicaResp) || _.isUndefined(resp.aplicaResp)){
                resp['aplicaResp'] = 1;
            }*!/

            resp.id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
            resp.id = resp.id + "-" + Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
            resp.id = resp.id + "-" + Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
            resp.id = resp.id + "-" + Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
            resp.id = resp.id + "-" + Math.floor(Math.random() * (999999999999 - 100000000000 + 1)) + 100000000000;

            if (_.isNull(resp.alternativa_peso) || _.isUndefined(resp.alternativa_peso)) resp.alternativa_peso = 0;

            if (!_.isNull(resp.foto) && !_.isUndefined(resp.foto)) {
                var tempPhotos = resp.foto;
                resp.foto = [];
                if (_.isArray(tempPhotos)) {
                    _.forEach(tempPhotos, function (pic) {
                        resp.foto.push(pic);
                    });
                } else {
                    resp.foto.push(tempPhotos);
                }
                console.log("new photo ", resp.foto)
            }
        });
        console.log("params to send ", params)
        let data = {};
        await this.request
            .post(config.endpoints.post.refresh, params, false)
            .then(async (response: any) => {
                try {
                    console.log("response ", response);
                    if (response.status == true) {
                        await this.getAllInfo();
                    }
                }
                catch (e) {
                    console.log("error refresh", e);
                    this.util.showAlert("Atención", "Ocurrió un problema al actualizar el mapa, por favor intente de nuevo más tarde");
                }
            })
            .catch((error: any) => {
                console.log("error refresh", error);
                this.util.showAlert("Atención", "Ocurrió un problema al actualizar el mapa, por favor intente de nuevo más tarde");
            });
        return data;
    }

    /!**
     * Trae informacion completa de visitas desde servicio
     * @returns {Promise<{}>}
     *!/
    async getAllInfo() {
        var endpoint = "?zona_id=&tipo=usuario";
        let data = {};
        await this.request
            .get(config.endpoints.get.refreshOfflineGet + endpoint, false)
            .then((response: any) => {
                try {
                    console.log("response get info", response);
                    if (response.code == 200) {
                        if (!_.isUndefined(response.data) && !_.isNull(response.data)) {
                            if (!_.isUndefined(response.data.sucursales_sin_responder) && !_.isNull(response.data.sucursales_sin_responder)) {
                                this.visita_tienda = {
                                    sucursales: response.data.sucursales_sin_responder.sucursales,
                                    zonas: response.data.sucursales_sin_responder.zonas,
                                    checklists: response.data.sucursales_sin_responder.checklists,
                                    visitas_respuestas: response.data.sucursales_sin_responder.visitas_respuestas,
                                    respuestas: response.data.sucursales_sin_responder.respuestas,
                                    estados_visita: response.data.sucursales_sin_responder.estado_visita,
                                };
                                this.visita_tienda['fechaActualizacion'] = new Date();
                                this.storage.set('visita_tienda_' + this.thisSession['usuario'].id, JSON.stringify(this.visita_tienda));
                                this.applicationRef.tick();
                                return data;
                            } else {
                                this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                            }
                        } else {
                            this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                        }
                    } else {
                        this.util.showAlert("Atención", "Ocurrió un error al descargar los checklists. Intente de nuevo más tarde");
                    }
                }
                catch (e) {
                    console.log("error refreshOfflineGet", e);
                }
            })
            .catch((error: any) => {
                console.log("error refreshOfflineGet", error);
                if (error && error.message) this.util.showToast("Ocurrió un error al traer las sucursales. Intente de nuevo más tarde", 3000);
            });
    }

    /!**
     * Redireccion hacia sucursal seleccionada
     *!/
    goToSuc(from) {
        console.log("fromCheckin ", this.fromCheckin);
        console.log("from ", from);
        if (this.fromCheckin == "select") {
            let branch_office = _.find(this.branch_offices, {id: this.selected_branch_office});

            // Si no encontramos el objeto de la sucursal, cortamos la ejecución del método (Caso borde, no debería ocurrir)
            if (!branch_office) {
                this.util.showToast('No encontramos su sucursal, por favor intente nuevamente', 5000);
                return;
            }
            this.navCtrl.push(VisitaSucursalPage, {
                sucursal: branch_office.id,
                action: 3
            });
        } else {
            var suc = 0;
            if (this.isMap == true) {
                console.log("selectedMarker goToSuc", this.selectedMarker)
                if (!_.isNull(this.selectedMarker['get']('id_sucursal')) && !_.isUndefined(this.selectedMarker['get']('id_sucursal'))) {
                    suc = this.selectedMarker['get']('id_sucursal');
                    console.log("con get ", suc)
                } else {
                    suc = this.selectedMarker['get']('id_sucursal') ? this.selectedMarker['get']('id_sucursal') : this.selectedMarker['id_sucursal'];
                    console.log("sin get ", suc)
                    if (_.isNull(suc) || _.isUndefined(suc)) {
                        if (this.selectedMarkerId != 0) {
                            suc = this.selectedMarkerId;
                        }
                    }
                }
            } else {
                if (!_.isUndefined(this.selectedMarker['id_sucursal']) && !_.isNull(this.selectedMarker['id_sucursal'])) {
                    suc = this.selectedMarker['id_sucursal'];
                } else if (!_.isUndefined(this.selected_branch_office) && !_.isNull(this.selected_branch_office)) {
                    suc = this.selected_branch_office;
                }
                console.log("con get ", suc)
            }
            console.log("sucursal ", suc)
            if (!_.isUndefined(suc) && !_.isNull(suc)) {
                this.navCtrl.push(VisitaSucursalPage, {
                    sucursal: suc,
                    action: 3
                });
            }
        }

    }

    /!**
     * Actualiza mensaje de checklist seleccionado
     * @param mess
     *!/
    updateMessage(mess) {
        console.log("message", this.message)
        this.message = mess;
        this.applicationRef.tick();
        console.log("new message", this.message)
    }

    /!**
     * Actualiza estado para boton de checkin
     * @param check
     *!/
    updateCheckIn(check) {
        console.log("showBtnCheckIn", this.showBtnCheckIn)
        this.showBtnCheckIn = check;
        this.applicationRef.tick();
        console.log("new showBtnCheckIn", this.showBtnCheckIn)
    }

    /!**
     * Actualiza estado para boton de checkouot
     * @param check
     *!/
    updateCheckOut(check) {
        console.log("showBtnCheckOut", this.showBtnCheckOut)
        this.showBtnCheckOut = check;
        this.applicationRef.tick();
        console.log("new showBtnCheckOut", this.showBtnCheckOut)
    }

    /!**
     * Actualiza estado para boton de redireccion a visitas
     * @param check
     *!/
    updateVisit(check) {
        console.log("showBtnVisit", this.showBtnVisit)
        this.showBtnVisit = check;
        this.applicationRef.tick();
        console.log("new showBtnVisit", this.showBtnVisit)
    }

    /!**
     * Trae info de usuario, se genera marker con posicion actual de usuario y se genera circulo con limites de distancia
     * @param userOptions
     *!/
    getPosition(userOptions) {
        return new Promise((resolve, reject) => {
            this.settings = userOptions.settings;
            var perimetro = _.find(this.settings, {nombre: "control_color_perimetro"});
            var perimetroBorde = _.find(this.settings, {nombre: "control_color_borde_perimetro"});
            if (this.noGps == false) {
                this.map.getMyLocation().then((location) => {
                    console.log("getCurrentPosition ", location)
                    this.backLat = location.latLng.lat;
                    this.backLong = location.latLng.lng;
                    this.accuracy = location.accuracy;
                    var position = {
                        coords: {
                            latitude: this.backLat,
                            longitude: this.backLong,
                            accuracy: this.accuracy
                        }
                    };
                    this.insertPosition(position, perimetro, perimetroBorde).then(position => {
                        return true;
                    });
                    resolve(position);

                }).catch(error => {
                    console.log("error ", error)
                    this.util.showToast('Internet o GPS débil o no disponible. Revise o utilice el botón para actualizar y reintente.', 5000);
                    resolve(position);
                });
            } else {
                var position = {
                    coords: {
                        latitude: this.backLat,
                        longitude: this.backLong,
                        accuracy: this.accuracy
                    }
                };
                this.insertPosition(position, perimetro, perimetroBorde).then(position => {
                    return true;
                });
                resolve(position);
            }
        });
    }

    /!**
     * Inserta posición actual del usuario como marker en mapa
     * @param position
     * @param perimetro
     * @param perimetroBorde
     * @returns {Promise<boolean>}
     *!/
    async insertPosition(position, perimetro, perimetroBorde) {
        this.accuracy = position.coords.accuracy;

        if (this.hasCheckin == false) {
            this.map.moveCamera({
                target: {lat: position.coords.latitude, lng: position.coords.longitude}
            });
        }

        var addMarker = {
            id: 1,
            icon: {
                'url': this.platform.is('ios') ? 'www/assets/img/iconos/mymarker.png' : 'assets/img/iconos/mymarker.png',
                size: {
                    height: 60,
                    width: 35
                }
            },
            position: {lat: position.coords.latitude, lng: position.coords.longitude}
        };
        let marker: Marker = this.map.addMarkerSync(addMarker);
        marker.hideInfoWindow();
        this.myMarker = marker;
        this.circle = null;
        if (!_.isUndefined(perimetro) && !_.isNull(perimetro) && !_.isUndefined(perimetroBorde) && !_.isNull(perimetroBorde)) {
            // Add circle
            this.perimeterCheckin = _.find(this.settings, {nombre: "control_perimetro_chkin"});
            console.log("perimeterCheckin ", this.perimeterCheckin)
            if (!_.isUndefined(this.perimeterCheckin) && !_.isNull(this.perimeterCheckin) && _.isNull(this.circle)) {
                let sendPerimeter = this.perimeterCheckin['value'] + this.accuracy;
                if (sendPerimeter > 1000) sendPerimeter = 1000;
                let circle: Circle = this.map.addCircleSync({
                    'center': {lat: position.coords.latitude, lng: position.coords.longitude},
                    'radius': sendPerimeter,
                    'strokeColor': perimetroBorde.params,
                    'strokeWidth': 5,
                    'fillColor': perimetro.params,
                    'fillOpacity': 0.1
                });
                this.circle = circle;
            } else {
                console.log("no hay checkin")
            }
        }
        return true;
    }


    /!**
     * Trae info de usuario, se genera marker con posicion actual de usuario y se genera circulo con limites de distancia
     * @param userOptions
     *!/
    updatePosition(coords): void {
        console.log("updatePosition ", coords);
        this.backLat = coords.latitude;
        this.backLong = coords.longitude;
        this.accuracy = coords.accuracy;
        let context = this;
        if (context.noInternet == false) {
            let perimetro = _.find(context.season['settings'], {nombre: "control_color_perimetro"});
            let perimetroBorde = _.find(context.season['settings'], {nombre: "control_color_borde_perimetro"});
            if (!_.isNull(context.myMarker)) {
                if (!_.isUndefined(perimetro) && !_.isNull(perimetro) && !_.isUndefined(perimetroBorde) && !_.isNull(perimetroBorde)) {
                    // Add circle
                    if (!_.isUndefined(context.perimeterCheckin) && !_.isNull(context.perimeterCheckin)) {
                        let sendPerimeter = this.perimeterCheckin['value'] + this.accuracy;
                        if (sendPerimeter > 1000) sendPerimeter = 1000;
                        if (this.firstLocation && this.hasCheckin == false) {
                            var position = {
                                coords: {
                                    latitude: this.backLat,
                                    longitude: this.backLong,
                                    accuracy: this.accuracy
                                }
                            };
                            this.insertPosition(position, perimetro, perimetroBorde).then(position => {
                                this.map.moveCamera({
                                    target: {lat: this.backLat, lng: this.backLong}
                                }).then(() => {
                                    //alert("Camera target has been changed");
                                });
                                this.firstLocation = false;
                                return true;
                            });
                        } else {
                            context.myMarker.setPosition({lat: coords.latitude, lng: coords.longitude});
                            context.circle.setCenter({lat: coords.latitude, lng: coords.longitude});
                            context.circle.setRadius(sendPerimeter);
                            return;
                        }
                    } else {
                        console.log("no hay checkin")
                    }
                }
            } else {
                console.log("no hay marker")
                var position = {
                    coords: {
                        latitude: this.backLat,
                        longitude: this.backLong,
                        accuracy: this.accuracy
                    }
                };
                this.insertPosition(position, perimetro, perimetroBorde).then(position => {
                    if (this.hasCheckin == false) {
                        this.map.moveCamera({
                            target: {lat: this.backLat, lng: this.backLong}
                        }).then(() => {
                            //alert("Camera target has been changed");
                        });
                    }
                    this.firstLocation = false;
                    return true;
                });
            }
        } else {
            console.log("no hay mapa")
        }
    }

    /!**
     * Abre actionsheet para acceder a vistas incluidas en el módulo
     * @param item
     * @param index
     *!/
    presentActionSheet(item, index) {
        let actionSheet = this.actionSheet.create({
            title: '',
            buttons: [
                {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push(HistoricasPage);
                    }
                },
                {
                    text: 'Asignación de Visitas',
                    handler: () => {
                        this.navCtrl.push(AsignacionPage);
                    }
                }/!*,
                {
                    text: 'Reloj Control',
                    handler: () => {
                        this.navCtrl.push(RelojControlPage);
                    }
                }*!/
            ]
        });
        actionSheet.present();
    }

    /!**
     * Redireccion a vista de checkin mediante foto
     *!/
    redirectToPhoto() {
        console.log("marker", this.selectedMarker)
        this.navCtrl.push(PhotoAccessPage, {
            checkin_id: this.checkin_id,
            markers: this.markets,
            selectsuc: (!_.isUndefined(this.selectedMarker) && !_.isNull(this.selectedMarker) && !_.isEmpty(this.selectedMarker)) ? this.selectedMarker['get']('id_sucursal') : null,
            user: this.thisSession['usuario'].id
        });
    }

    /!**
     * Foreach asincronico para utilizarse en funciones
     * @param array
     * @param callback
     * @returns {Promise<void>}
     *!/
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    /!**
     * Busca sucursal seleccionada mediante selector en arreglo y habilita botones correspondientes
     *!/
    onBranchOfficeChange() {
        let branch_office = _.find(this.branch_offices, {id: this.selected_branch_office});
        console.log("selectedMarker 1 ", this.selectedMarker)
        if (this.selected_branch_office === 0) {
            console.log("suc 0 ", this.selected_branch_office)

            let select = this.selectedMarker['get']('id_sucursal');
            console.log("selectedMarker 2 ", this.selectedMarker)
            console.log("select ", select)
            console.log("marker ", this.marker)
            console.log("this.markets ", this.markets)
            let suc = _.find(this.markets, {id: select});
            console.log("suc ", suc)
            if (!_.isNull(suc) && !_.isUndefined(suc)) {
                suc['mapMarker'].hideInfoWindow();
            }

            this.marker = {};
            this.selectedMarker = {};
            this.hasCheckin = false;
            this.updateCheckIn(false);
            this.updateCheckOut(false);
            this.updateVisit(false);
            this.updateMessage("Seleccione una sucursal de la lista o mapa.");
            return;
        }

        this.isLoading = false;

        console.log("onBranchOfficeChange ", branch_office)
        let selected_branch_office: MarkerOptions = {
            id_sucursal: branch_office.id,
            title: (branch_office.nombre_real ? branch_office.nombre_real : branch_office.nombre),
            icon: {
                'url': this.platform.is('ios') ? 'www/assets/img/' + branch_office.estado_checkin.icono : 'assets/img/' + branch_office.estado_checkin.icono,
                size: {
                    height: 25,
                    width: 25
                }
            },
            position: {
                lat: branch_office.latitud,
                lng: branch_office.longitud
            }
        };
        let marker: any = new Marker(this.map, selected_branch_office);
        this.markerClicked([0, marker], branch_office, [0, marker], "select");
    }

    /!**
     * Trae sucursales desde servidor
     * @returns {Promise<any[]>}
     *!/
    async getBranchOffices() {
        let result = [];
        let session_aux = null;

        // Traemos las sucursales desde la sesión
        await this.session.getSession()
            .then((session: any) => {
                if (session && session.usuario) {
                    session_aux = session;
                    result = session.usuario.sucursales_visita;
                }
            })
            .catch(error => console.log('ERROR AL OBTENER LA SESIÓN (LOCAL)', error));

        // También solicitamos la lista de sucursales del servicio
        // Si la solicitud es exitosa usamos estas sucursales
        await this.request
            .get(config.endpoints.get.getBranchs, true)
            .then((response: any) => {
                if (response && response.data) {
                    result = response.data.sucursales;
                    // Aprovechamos de actualizar las sucursales en la sesión local
                    if (session_aux && session_aux.usuario) {
                        session_aux.usuario.sucursales_visita = result;
                        this.session.saveSession(session_aux);
                    }
                } else {
                    console.log('ERROR AL OBTENER LA SESIÓN (API)');
                }
            })
            .catch(error => console.log('ERROR AL OBTENER LA SESIÓN (API)', error));
        return result;
    }

    /!**
     * Verifica que exista un checkin activo al iniciar controlador
     * @returns {Promise<void>}
     *!/
    async getActiveCheckIn() {
        await this.request
            .get(config.endpoints.get.getCheck, true)
            .then((response: any) => {
                if (response.code == 200 && response.message != "No posee algún checkin abierto.") {
                    this.checkin_id = response.data[0].control_checkin_id;
                    if (this.checkin_id) {
                        this.selected_branch_office = response.data[0].sucursal['id'];
                        if (this.selected_branch_office) {
                            console.log("selected_branch_office ", this.selected_branch_office)
                            this.fromCheckin = "select";
                            this.selectedMarkerId = this.selected_branch_office;
                            let branch_office = _.find(this.branch_offices, {id: this.selected_branch_office});
                            console.log("branch_office ", branch_office)
                            this.updateCheckIn(false);
                            this.updateCheckOut(true);
                            this.updateVisit(true);
                        }
                    }
                } else if (response.code != 200) {
                    console.log("error getActiveCheckIn")
                    this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente nuevamente", 3000);
                } else {
                    console.log("no hay checkin ", response)
                }
            }).catch((error: any) => {
                console.log("error  getActiveCheckIn ", error)
                if (error && error.message) this.util.showToast("Ocurrió un error al traer el checkin actual, por favor intente nuevamente", 3000);
            });
    }

    /!**
     * Aviso a usuario para que active su geolocalización en caso de estar desactivada o en nivel bajo
     * @returns {Promise<void>}
     *!/
    async checkGpsStatus() {
        try {
            await this.locationAccuracy.canRequest()
                .then(async (canRequest: boolean) => {

                    if (canRequest) {
                        // the accuracy option will be ignored by iOS
                        await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                            () => {
                                console.log('Request successful')
                                return;
                            }, error => {
                                console.log('Error requesting location permissions', error)
                                return;
                            }
                        );
                    }
                })
                .catch((error) => console.log('CAN REQUEST', error));
        } catch (e) {
            console.log('CAN REQUEST 2', e);
        }
    }*/
}
