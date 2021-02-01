import { Component, ViewChild } from '@angular/core';
import { Platform, Events, AlertController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from "@ionic-native/network";
import { Insomnia } from '@ionic-native/insomnia';
import { LocalNotifications } from '@ionic-native/local-notifications';

import { PushNotificationProvider } from '../shared/providers/push-notifications/push-notification';
import { LoadMenuProvider } from "../shared/providers/util/loadMenu";
import { UtilProvider } from "../shared/providers/util/util";
import { SessionProvider } from "../shared/providers/session/session";
import { VisualLocalProvider } from '../pages/visual/services/visual.local';
import { ChecklistsProvider } from '../pages/checklists/checklists.provider';



import { global } from '../shared/config/global';
import { Geolocation } from "@ionic-native/geolocation";
import { RequestProvider } from '../shared/providers/request/request';
import { from } from 'rxjs';

import * as _ from 'lodash';
import { globalConfig } from '../config';


declare var window;

@Component({
    templateUrl: 'app.html'
})
export class GcApp {

    private watcher_position: any = null;
    private watcher_suscription: any = null;
    private has_watcher: boolean = false;

    private internet_status_toast: any = null;


    constructor(private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private network: Network,
        private events: Events,
        private alert: AlertController,
        private insomnia: Insomnia,
        private toast: ToastController,
        private localNotifications: LocalNotifications,
        private pushNotification: PushNotificationProvider,
        private util: UtilProvider,
        private visualLocalProvider: VisualLocalProvider,
        private checklistsProvider: ChecklistsProvider,
        private geolocation: Geolocation,
        private sessionProvider: SessionProvider,
        private requestProvider: RequestProvider) {

        this.platform.ready().then(async () => {
            window.skipLocalNotificationReady = true;

            this.sessionProvider.initializeState();

            this.insomnia.keepAwake()
                .then((res) => {
                }, (err) => { })
                .catch((error) => {
                    this.util.logError(JSON.stringify(error), 'INK01', globalConfig.version);
                });



            if (this.platform.is('android')) this.statusBar.styleLightContent();
            else if (this.platform.is('ios')) this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.util.checkActiveDirectory();




            /*
            this.localNotifications.on( `chk-not-${check.id}` ).subscribe( ( res ) => {
                    console.log(',this.localNotifications.on( )', res )
                });
            */

            /* MANEJO DE CAMBIOS EN EL ESTADO DE INTERNET */

            // Función que se suscribe al evento 'onchange' y esucha los cambios de conexión
            this.network.onchange()
                .subscribe((response: any) => {
                    if (response.type === 'online') {

                        this.util.sendBulkRequestErrors();
                        this.requestProvider.sendBulkLogRequestErrors();

                        this.checklistsProvider.sendPendingAmbits();


                        UtilProvider.hasInternet = true;
                        this.events.publish('map-network-connected');

                        this.events.publish('network-connected');

                        try {
                            if (this.internet_status_toast) {
                                this.internet_status_toast.dismiss();
                                this.internet_status_toast = null;
                            }

                            this.internet_status_toast = this.toast.create({
                                message: 'La conexión a Internet ha sido restablecida',
                                showCloseButton: true,
                                position: 'top',
                                duration: 5000,
                                closeButtonText: 'OK'
                            });
                            this.internet_status_toast.present();
                        } catch (e) { console.log('ERROR TOAST', e); }
                        // Cuando detectamos una conexión a internet reintentamos enviar las implementaciones
                        // y fotos adicionales en caso de que existan en la base de datos local
                        this.visualLocalProvider
                            .retryUploadImplementations()
                            .then(() => {
                                this.visualLocalProvider
                                    .retryUploadOptionals()
                                    .then(() => {
                                    })
                                    .catch(() => {
                                    });
                            })
                            .catch(() => {
                                this.visualLocalProvider
                                    .retryUploadOptionals()
                                    .then(() => {
                                    })
                                    .catch(() => {
                                    });
                            });
                    } else if (response.type === 'offline') {
                        UtilProvider.hasInternet = false;
                        this.events.publish('map-network-disconnected');

                        this.events.publish('network-disconnected');

                        try {
                            if (this.internet_status_toast) {
                                this.internet_status_toast.dismiss();
                                this.internet_status_toast = null;
                            }

                            this.internet_status_toast = this.toast.create({
                                message: 'Sin conexión a Internet',
                                showCloseButton: true,
                                position: 'top',
                                duration: 5000,
                                closeButtonText: 'OK'
                            });
                            this.internet_status_toast.present();
                        } catch (e) { console.log('ERROR ALERT', e); }
                    }
                });

            this.localNotifications.on('click').subscribe((notification) => {
                if (
                    notification.data
                    && notification.data.additionalData
                    && notification.data.additionalData.payload
                    && notification.data.additionalData.payload.data
                    && notification.data.additionalData.payload.data.url_prefix === 'chat'
                ) {
                    this.events.publish('navigate-from-notification-to-chat', {
                        roomId: notification.data.additionalData.payload.data.conversacion_id
                    });
                }
            });
        });

    }


}
