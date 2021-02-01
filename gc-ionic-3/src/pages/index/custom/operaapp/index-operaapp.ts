import { ApplicationRef, Component } from '@angular/core';
import { IonicPage, LoadingController, MenuController, NavController, NavParams, Platform, Events } from 'ionic-angular';

import * as _ from 'lodash';

import { SessionProvider } from '../../../../shared/providers/session/session';
import { UtilProvider } from '../../../../shared/providers/util/util';

import { UpdateComponent } from '../../../../components/update/update';

import { globalConfig } from '../../../../config';
import { ISetting } from '../../../../shared/interfaces/setting.interface';

@IonicPage()
@Component({
    selector: 'page-index-operaapp',
    templateUrl: 'index-operaapp.html',
})
export class IndexOperaappPage {

    private modules: any = [];
    private checklistSetting: any = null;

    constructor(public navCtrl: NavController,
        private loading: LoadingController,
        private applicationRef: ApplicationRef,
        private menu: MenuController,
        private navParams: NavParams,
        private events: Events,
        private session: SessionProvider,
        private util: UtilProvider) {
        this.menu.enable(true, "menu");
    }

    // Función que se ejecuta cuando carga la vista
    ionViewDidLoad() {
        _.delay( () => {
            this.events.subscribe( 'sessionRefresh', () => {
                this.setModules();
            } )
        }, 500 );
        
        try {
            const auxSetting = _.find(SessionProvider.state.value.settings, (setting: ISetting) => setting.name === 'checklist_core_params');
            if (auxSetting && auxSetting.params) {
                this.checklistSetting = { value: JSON.parse(auxSetting.params).version }
            } else { this.checklistSetting = null }
        } catch (e) { }

        this.setModules();
        if (!this.navParams.data.from_update) {
            this.checkForUpdate();
        }
    }

    ionViewWillUnload(){
        this.events.unsubscribe( 'sessionRefresh' );
    }

    // Asigna los módulos activos de este usuario
    async setModules() {
        let modules: any = await this.getActiveModules();
        
        if ( modules && modules.length ) {
            this.modules = modules;
        }
    }

    // Retorna los módulos del usuario actual
    async getActiveModules() {
        let result: any = null;
        
        await this.session
            .getSession()
            .then( ( response: any) => {
                try {
                    result = _.filter(response.usuario.modulos, (module) => {
                        if (module.url_prefix === 'checklist') {
                            // Si no tenemos el setting de checklist privilegiamos el módulo antiguo
                            if (!this.checklistSetting) {
                                module.info = this.getModuleInfo(module.url_prefix);
                            } else {
                                const value: any = this.checklistSetting.value;
                                if (value === 2) {
                                    module.info = this.getModuleInfo('checklistv2');
                                } else {
                                    module.info = this.getModuleInfo(module.url_prefix);
                                }
                            }
                        } else {
                            module.info = this.getModuleInfo(module.url_prefix);
                        }
                        return module.home == '1';
                    });
                    result = _.orderBy(result, ['orden'], ['asc']);
                } catch (e) { }
            })
            .catch((error: any) => { try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
        return result;
    }

    // Navega hasta el módulo recibido por parámetro
    navigateToModule( module: any ) {
        if ( module.info && module.info.page ) {
            UtilProvider.actualModule = module.nombre;
            this.navCtrl.setRoot(module.info.page);
            return;
        }
        this.util.showToast('Vista no disponible', 3000);
    }

    // Retorna las imágenes de cada módulo
    getModuleInfo(moduleCode: any) {
        let result = {
            key: '',
            icon: '',
            avatar: '',
            page: ''
        };

        let temp = _.find(modulesInfo, (module) => {
            return module.key === moduleCode.toLowerCase();
        });

        if (temp) result = temp;

        return result;
    }

    // Consulta al servicio e Ionic Pro, si es que hay una actualización
    async checkForUpdate() {
        // Consultamos si existe una actualización disponible
        let updateCheck = await this.util.checkForUpdate(globalConfig.version, globalConfig.isTest, globalConfig.testBuild, globalConfig.isBrowser);

        console.log('updateCheck', JSON.stringify(updateCheck));

        if (updateCheck.available && !UpdateComponent.updating) {
            if (updateCheck.required) {
                this.navCtrl.setRoot(UpdateComponent);
            } else {
                this.events.publish('show-update-button');
            }
        }
    }
}

export const modulesInfo = [{
    key: 'visual',
    icon: 'assets/img/iconos/custom/operaapp/visualapp-icon.png',
    avatar: 'assets/img/iconos/custom/operaapp/Visual-visual.png',
    page: 'VisualPage'
}, {
    key: 'checklist',
    icon: 'assets/img/iconos/custom/operaapp/checklist-icon.png',
    avatar: 'assets/img/iconos/custom/operaapp/Checklist-checklist.png',
    page: 'ChecklistTiendaPage'
}, {
    key: 'checklistv2',
    icon: 'assets/img/iconos/custom/operaapp/checklist-icon.png',
    avatar: 'assets/img/iconos/custom/operaapp/Checklist-checklist.png',
    page: 'ChecklistsBranchOfficePage'
}, {
    key: 'incidencia',
    icon: 'assets/img/iconos/custom/operaapp/incidencias-icon.png',
    avatar: 'assets/img/iconos/custom/operaapp/Incidencias-incidencias.png',
    page: 'IncidentsBranchOfficePage'
}, {
    key: 'materiales',
    icon: 'assets/img/iconos/custom/operaapp/materiales-icon.png',
    avatar: 'assets/img/iconos/custom/operaapp/Materiales-materiales.png',
    page: 'MaterialsPage'
}];
