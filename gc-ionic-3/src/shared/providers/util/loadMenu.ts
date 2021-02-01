import { ApplicationRef, Injectable } from '@angular/core';
import { ToastController, AlertController } from 'ionic-angular';
import { Base64 } from '@ionic-native/base64';
import * as _ from 'lodash';
import { Network } from "@ionic-native/network";
import { ItemInterface } from "../../../components/menu/menu";
import { SessionProvider } from "../session/session";
import { globalConfig } from "../../../config";
import { UtilProvider } from './util';
import { EstadisticasPage } from "../../../pages/dashboard/zonal/estadisticas";
import { IndexPage } from "../../../pages/index";

import { Component } from '@angular/core';
import { LoadingController, MenuController, NavController } from 'ionic-angular';
import { DashboardPage } from "../../../pages/dashboard/tienda/dashboard";

import { global } from '../../config/global';

@Injectable()
export class LoadMenuProvider {

    static menuItems: ItemInterface[] = [];
    static hasDashboard: boolean = false;

    constructor(private toast: ToastController,
        private alert: AlertController,
        private applicationRef: ApplicationRef,
        private base64: Base64,
        private network: Network,
        private session: SessionProvider,
        private util: UtilProvider) {
    }

    // Retorna los módulos y cargo del usuario
    async getModulesAndHierarchy() {
        let result = { modules: [], charge: null };
        await this.session
            .getSession()
            .then((response: any) => {
                try {
                    let charge = null;
                    // Si es admin asignamos el cargo directamente
                    if (response.usuario.tipo === 'administrador') charge = 'admin';
                    // Si no lo es, según la jerarquía asignamos el cargo
                    else charge = ((!response.usuario.jerarquia || response.usuario.jerarquia < 98) ? 'branch-office' : (response.usuario.jerarquia < 100 ? 'zonal' : 'country'));

                    result = { modules: response.usuario.modulos, charge: charge };
                    //console.log("getModulesAndHierarchy ", result)

                    //Esto es mientras no se define el acceso a index y estadisticas
                    var indexModule = _.find(result.modules, function (module) {
                        return module.nombre === 'Inicio' || module.nombre === 'Estadísticas' || module.nombre === 'Estadisticas' || module.nombre === 'Estadística';
                    });
                    //console.log("indexModule ", indexModule)
                    /*
                    if(!_.isUndefined(indexModule) && !_.isNull(indexModule) && indexModule.image == 'estadistica.png'){
                        var indexNum = _.indexOf(result.modules, {nombre: indexModule.nombre});
                        result.modules[indexNum].page = "EstadisticasPage";
                        console.log("new results ", result)
                    }*/
                } catch (e) {
                }
            })
            .catch((error: any) => {
                console.log("Error ", error)
            });
        return result;
    }

    // Asigna los ítems para mostrar en el menú
    public async setMenuItems() {
        let result = await this.getModulesAndHierarchy();
        let ordered_modules = _.orderBy(result.modules, ['orden'], ['asc']);
        LoadMenuProvider.menuItems = [];

        let menu_active_value = (result.charge === 'branch-office' ? '1' : ((result.charge === 'country' || result.charge === 'zonal' || result.charge === 'admin') ? '2' : null));
        LoadMenuProvider.hasDashboard = false;

        _.forEach(ordered_modules, (mod: any) => {
            try {
                if(mod.url_prefix === 'taskmanager') mod.icon = 'ion-close'
                let icon_info = this.util.getIconAndColorFromV1(mod.icon);
                mod.icon = icon_info.icon;

                // Buscamos la página a partir del nombre del módulo
                let item = _.find(globalConfig.modules, (aux) => {
                    if (mod.url_prefix.toLowerCase() === 'kpi') {
                        return (_.includes(aux.names, mod.url_prefix) && _.includes(aux.charges, result.charge) && _.includes(aux.companies, global.title.toLowerCase()));
                    }
                    return (_.includes(aux.names, mod.url_prefix) && _.includes(aux.charges, result.charge));
                });

                if (mod.dashboard == 1 || mod.dashboard == "1") LoadMenuProvider.hasDashboard = true;

                if (mod.menu == menu_active_value && mod.url_prefix !== 'chat') {
                    LoadMenuProvider.menuItems.push({ title: mod.nombre, icon: mod.icon, page: item.page, customIcon: (item.customIcon ? item.customIcon : null), url_prefix: mod.url_prefix });
                }
            } catch (e) { }
        });
        this.applicationRef.tick();
        return LoadMenuProvider.menuItems;
    }

}