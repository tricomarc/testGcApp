import { ApplicationRef, Component, ViewChild } from '@angular/core';
import {
    IonicPage,
    LoadingController,
    NavController,
    NavParams,
    ActionSheetController,
    Content
} from 'ionic-angular';
import { BehaviorSubject } from 'rxjs';

import * as _ from 'lodash';

import { global } from '../../../shared/config/global';

import { RequestProvider } from "../../../shared/providers/request/request";
import { UtilProvider } from "../../../shared/providers/util/util";
import { SessionProvider } from "../../../shared/providers/session/session";

import { ChecklistsBranchOfficePage } from '../branch-office/checklists-branch-office';
import { ChecklistHistoricalComponent } from '../components/checklist-historical/checklist-historical';

import { checklistConfig } from '../checklists.config';
import { globalConfig } from '../../../config';
import { DictionaryProvider } from '../../../shared/providers/dictionary/dictionary';

@IonicPage()
@Component({
    selector: 'page-checklists-zonal',
    templateUrl: 'checklists-zonal.html',
})

export class ChecklistsZonalPage {

    @ViewChild(Content) content;

    private filterSelected: number;
    private view: string = 'own';
    private checklists: any = {
        all: [],
        own: [],
        occasionals: []
    };
    private requesting: boolean = false;
    private session: any = null;

    private checklistState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado
    private statusColors = {
        "completo": null,
        "enviado": null,
        "fuera_horario": null,
        "incompleto": null,
        "sin_contestar": null
    }

    // diccionario
    private diccChecklist: string;
    private diccChecklists: string;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private actionSheetController: ActionSheetController,
        private requestProvider: RequestProvider,
        private utilProvider: UtilProvider,
        private sessionProvider: SessionProvider,
        private dictionary: DictionaryProvider) {
    }

    async ionViewDidLoad() {
        await this.dictionary.getDictionary().then((dictionary: any) => {
            this.diccChecklist = dictionary['Checklist']
            this.diccChecklists = dictionary['Checklists']
        });

        await this.sessionProvider.getSession().then((session: any) => {
            this.session = session;
        })

        this.requesting = true;

        this.checklistState.subscribe((update: boolean) => {
            if (update && !this.requesting) {
                this.refreshChecklists(null);
            }
        });

        this.getCustomStatusColor()
        this.checklists = await this.getChecklists();
        this.requesting = false;

    }

    ionViewWillUnload() {
        this.checklistState.unsubscribe();
    }

    async getChecklists() {
        let checklists = { all: [], own: [], occasionals: [] };
        await this.requestProvider.post(checklistConfig.endpoints.newApi.post.allChecklists, {}, true)
            .then((response: any) => {
                if (response && response.data) {

                    _.forEach(response.data.propios, (checklist: any) => {
                        checklist.statusData = ChecklistsBranchOfficePage.getChecklistStatus(checklist);
                        checklist.remainingTime = null;
                        if (checklist.activo) {
                            let checklistInterval = setInterval(() => {
                                checklist.remainingTime = ChecklistsBranchOfficePage.getRemainingTime(checklist.termino, null);
                            }, 1000);
                            checklist.checklistInterval = checklistInterval;
                        }
                    });

                    checklists.all = response.data.tiendas;
                    checklists.own = response.data.propios;
                }
            })
            .catch((error: any) => {
                try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.utilProvider.showToast('No ha sido posible obtener los checklists, intente nuevamente.', 3000);
            });

        await this.requestProvider
            .get(checklistConfig.endpoints.newApi.get.occasionals, true)
            .then((response: any) => {
                if (response && response.data) {
                    checklists.occasionals = response.data;
                }
            })
            .catch((error: any) => { try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });

        return checklists;
    }

    async refreshChecklists(event: any) {
        this.filterSelected = null;
        this.checklists = await this.getChecklists();
        if (event) event.complete();
    }

    // Muestra una hoja con acciones
    presentActionSheet() {
        const hasLean = _.find(this.session.usuario.modulos, (mod: any) => {
            return mod.url_prefix == "checklistambitos";
        });
        let hasCompare = false;
        if (hasLean) {
            if ((parseInt(hasLean.menu) >= 1) || parseInt(hasLean.dashboard) >= 1) {
                hasCompare = true;
            }
        }
        const buttons = [{
            text: 'Históricos',
            handler: () => {
                // this.navCtrl.push('HistoricoPage');
                this.navCtrl.push(ChecklistHistoricalComponent, { type: 1 });
            }
        }];
        if (hasCompare) {
            buttons.push({
                text: 'Comparador',
                handler: () => {
                    this.navCtrl.push('AmbitosPage');
                }
            });
        }
        const actionSheet = this.actionSheetController.create({
            title: '',
            buttons: buttons
        });
        actionSheet.present();
    }


    async getCustomStatusColor() {
        console.log('Here')
        const { checklist } = await this.utilProvider.getColors();
        if (!checklist) return;

        const statusColor = checklist.status || null;
        if (!statusColor) return;

        this.statusColors = {
            enviado: statusColor.enviado,
            completo: statusColor.completo,
            incompleto: statusColor.incompleto,
            sin_contestar: statusColor.sin_contestar,
            fuera_horario: statusColor.fuera_horario

        }

        console.log(this.statusColors)


    }
}
