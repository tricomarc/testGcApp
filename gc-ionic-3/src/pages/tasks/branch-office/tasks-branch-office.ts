import {ApplicationRef, Component} from '@angular/core';
import {
    IonicPage,
    NavController,
    LoadingController,
    Events,
    MenuController,
    ActionSheetController
} from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import {RequestProvider} from '../../../shared/providers/request/request';
import {UtilProvider} from '../../../shared/providers/util/util';
import {SessionProvider} from '../../../shared/providers/session/session';

// Configuración del componente
import {config} from './tasks-branch-office.config'

// Configuración global
import {global} from '../../../shared/config/global';
import {DetallePage} from "../../checklist/sub-pages/detalle/detalle";
import {Tareas1Page} from "../sub-pages/tareas1/tareas1";
import {Tareas2Page} from "../sub-pages/tareas2/tareas2";
import {Tareas3Page} from "../sub-pages/tareas3/tareas3";
import {Tareas4Page} from "../sub-pages/tareas4/tareas4";

@IonicPage()
@Component({
    selector: 'page-tasks-branch-office',
    templateUrl: 'tasks-branch-office.html',
})

export class TasksBranchOfficePage {

    // Atributos
    private days: any = [];
    private today: string = null;
    // Representa el estado de carga cuando se actualiza la data
    private requesting: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    // Constructor
    constructor(private navCtrl: NavController,
                private loading: LoadingController,
                private request: RequestProvider,
                private util: UtilProvider,
                private session: SessionProvider,
                private event: Events,
                private menu: MenuController,
                private actionSheet: ActionSheetController,
                private applicationRef: ApplicationRef) {
        let date = new Date();
        this.today = (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
    }

    // Método que se ejecuta cuando carga la vista
    async ionViewWillEnter() {
        this.menu.enable(true, "menu");
        this.days = await this.getTasksByDays(false);
    }

    // Trae la lista de tareas
    async getTasksByDays(isRefresh: boolean) {
        const loading = this.loading.create({content: 'Obteniendo detalles'});
        loading.present();
        if (!isRefresh) this.requesting = true;
        let days: any = [];
        await this.request
            .get(config.endpoints.newApi.get.tasks, true)
            .then((response: any) => {
                if (response && response.data) days = response.data.tareas_diarias;
                else this.util.showAlert('Atención', 'No ha sido posible obtener la lista de tareas.');

                this.applicationRef.tick();
                loading.dismiss();
            })
            .catch((error: any) => {
                this.util.showAlert('Atención', 'No ha sido posible obtener la lista de tareas.');
                loading.dismiss();
            });
        this.requesting = false;
        return days;
    }

    // Actualiza la lista de tareas por días
    async refreshTasks(refresher: any) {
        this.days = await this.getTasksByDays(true);
        refresher.complete();
    }

    // Navega hasta la vista que muestra el detalle de una tarea
    navigateToTaskDetail(task_id: any) {
        this.navCtrl.push(DetallePage, {task_id: task_id});
    }

    presentActionSheet(item, index) {
        let actionSheet = this.actionSheet.create({
            title: '',
            buttons: [
                {
                    text: 'Crear tarea',
                    handler: () => {
                        this.navCtrl.push(Tareas1Page);
                    }
                },
                {
                    text: 'Tareas Asignadas por Mi',
                    handler: () => {
                        this.navCtrl.push(Tareas2Page);
                    }
                }/*,
                {
                    text: 'Tareas 3',
                    handler: () => {
                        this.navCtrl.push(Tareas3Page);
                    }
                }*/,
                {
                    text: 'Tareas 4',
                    handler: () => {
                        this.navCtrl.push(Tareas4Page);
                    }
                }
            ]
        });
        actionSheet.present();
    }
}
