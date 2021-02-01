import { Component, NgZone, Inject } from '@angular/core';
import { AlertController, Events, MenuController, NavController } from 'ionic-angular';
import { Pro } from '@ionic/pro';
import { FileError } from '@ionic-native/file';

import * as _ from 'lodash';

import { global } from '../../shared/config/global';
import { globalConfig } from '../../config';

import { UpdateProvider } from "../../shared/providers/update/update";
import { UtilProvider } from "../../shared/providers/util/util";

@Component({
    selector: 'update',
    templateUrl: 'update.html'
})
export class UpdateComponent {
    // Avance de la actualización
    private current_progress: number = 0;
    // Estado de la actualización
    private status_label: string = 'Preparando actualización';
    // Color por defecto del loading
    private color_progress: string = '#CCCCCC';
    // Tiempo que tarda la descarga
    private download_elapsed_time: any = 0;
    // Controla si se muestra o no el botón para cancelar la actualización
    private show_cancel_button: boolean = false;
    // Definimos una alerta para cancelar la actualización
    private cancelAlert: any = null;
    // Definimos un intervalo, el cual contará los segundos transcurridos por la descarga
    private downloadInterval: any = null;

    // Valor estático que nos indica si una actualización está en curso
    public static updating: boolean = false;

    constructor(private zone: NgZone,
        private alert: AlertController,
        private events: Events,
        private menu: MenuController,
        private navCtrl: NavController,
        private update: UpdateProvider,
        @Inject(UtilProvider) private util: UtilProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    ionViewDidLoad() {
        // Deshabilitamos el menu
        this.menu.enable(false, "menu");
        // Asignamos el color primario del cliente definido en la configuración
        this.color_progress = global.client_colors.primary;
        // Actualizamos la app
        this.updateApp();
    }

    // Método que se ejecuta cuando la vista se destruye
    ionViewWillUnload() {
        UpdateComponent.updating = false;
    }

    ionViewWillLeave() {
        try {
            this.cancelAlert.dismiss();
            clearInterval(this.downloadInterval);
        } catch (e) { }
    }

    // Se suscribe a un método que actualiza la app
    updateApp() {
        // Cambiamos el valor de la variable estática (no indica que estamos actualizando)
        UpdateComponent.updating = true;
        // Guardamos la suscripción de descarga en una variable
        const subscription = this.update
            .updateApp()
            .subscribe((update: any) => {

                // Variable para guardar el nombre de un error
                let errorTemp = null;

                // Ante cada progreso intentamos obtener el nombre del error
                // Los 'FileError' no detienen la actualización
                try {
                    errorTemp = update.name.__proto__.constructor.name;
                } catch (e) { }

                // Si algún de los resultados es un error (y no es error de archivos), informamos al usuario y se cancela la actualización
                if (update.type === 'error' && errorTemp !== 'FileError') {
                    // Registramos el error en la API
                    this.util.logError(JSON.stringify(update.name), 'UpdateComponent.updateApp()', globalConfig.version);
                    let alert = this.alert.create({
                        title: 'Atención',
                        message: ('La actualización ha fallado, la próxima vez que inicie la aplicación volveremos a intentarlo.'),
                        buttons: [{
                            text: 'Aceptar',
                            handler: (data: any) => { }
                        }]
                    });
                    // Borramos la suscripción
                    alert.present();
                    alert.onDidDismiss(() => {
                        // Si la actualización falla, publicamos el evento 'FailedUpdate' (suscrito en el menú)
                        this.events.publish('FailedUpdate');
                    });
                    if (subscription) subscription.unsubscribe();
                    return;
                }
                // Si el resultado es success
                this.zone.run(() => {
                    // Actualizamos el progreso y el estado de la actualización
                    if (update.type === 'success') {
                        this.current_progress = update.progress;
                        this.status_label = (update.name === 'downloading' ? 'Descargando' : 'Aplicando cambios');

                        // Si el progreso es del tipo descarga y el tiempo de descarga es 0
                        if (update.name === 'downloading' && this.download_elapsed_time === 0) {
                            // Asignamos el intervalo
                            this.downloadInterval = setInterval(() => {
                                this.download_elapsed_time++;

                                // Si transcurrieron 2 minutos, habilitamos la opción de cancelar la actualización
                                if (this.download_elapsed_time === 2) {
                                    let view = this.navCtrl.getActive();
                                    if (view.instance instanceof UpdateComponent) {
                                        this.show_cancel_button = true;
                                        this.cancelUpdate(subscription);
                                    }
                                }
                            }, 60000);
                        }
                    }
                });
            });
    }

    cancelUpdate(subscription: any) {

        this.cancelAlert = this.alert.create({
            title: 'Atención',
            message: ('La actualización está tardando demasiado, puedes cancelar la actualización y volver a intentarlo cuando tengas una mejor conexión a internet.'),
            buttons: [{
                text: 'Continuar',
                handler: (data: any) => { }
            }, {
                text: 'Cancelar',
                handler: (data: any) => {
                    try {
                        UpdateProvider.cancel = true;
                        this.events.publish('FailedUpdate');
                        if (subscription) subscription.unsubscribe();
                    } catch (e) { }
                }
            }]
        });

        this.cancelAlert.present();
    }
}
