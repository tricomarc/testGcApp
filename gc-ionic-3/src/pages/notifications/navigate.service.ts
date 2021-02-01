import { Injectable } from "@angular/core";
import { SessionProvider } from '../../shared/providers/session/session';
import { FilesPage } from './../files/files';
import { ChecklistZonalPage } from './../checklist/zonal/checklist-zonal';
import { AmbitoPage } from './../checklist/sub-pages/ambito/ambito';
import { ComunicadosTiendaPage } from './../comunicados/tienda/comunicados-tienda';
import { DetailIncidentPage } from './../incidents/branch-office/sub-pages/detail-incident/detail-incident';
import { VisualZonalPage } from './../visual/zonal/visual-zonal';
import { VisualReportPage } from './../visual/branch-office/visual-report/visual-report';
import { App } from 'ionic-angular';
import { ComunicadosZonalPage } from "../comunicados/zonal/comunicados-zonal";
import { UtilProvider } from '../../shared/providers/util/util';
// import { DetailsModalPage } from './../comunicados/details-modal/details-modal';
import { LoadMenuProvider } from '../../shared/providers/util/loadMenu';
import * as _ from 'lodash';

@Injectable()
export class NavigateService {


    public modules = [{
        prefixes: ['visual'],
        params: { fromMiGestion: true,  key: 'report_id' },
        component: VisualReportPage,
        charges: ['branch-office']
    }, {
        prefixes: ['visual'],
        params: null,
        component: VisualZonalPage,
        charges: ['zonal', 'country']
    }, {
        prefixes: ['incidencia'],
        params: { key: 'incident_id' },
        component: DetailIncidentPage,
        charges: ['branch-office']
    },{
        prefixes: ['com'],
        params: { comunicado: '' },
        component: 'DetailsModalPage',
        charges: ['branch-office']
    }, {
        prefixes: ['premios'],
        params: null,
        component: ComunicadosTiendaPage,
        charges: ['branch-office']
    }, {
        prefixes: ['com', 'premios'],
        params: null,
        component: ComunicadosZonalPage,
        charges: ['zonal', 'country']
    }, {
        prefixes: ['checklist'],
        params: { key: 'checklist_id' },
        component: AmbitoPage,
        charges: ['branch-office']
    }, {
        prefixes: ['checklist'],
        params: null,
        component: ChecklistZonalPage,
        charges: ['zonal', 'country']
    }, {
        prefixes: ['cms'],
        params: null,
        component: FilesPage,
        charges: ['branch-office', 'zonal', 'country']
    }]
    private module: string = UtilProvider.actualModule;

    constructor(private app: App, 
        private util: UtilProvider,
        private loadMenu: LoadMenuProvider,
        private sesion: SessionProvider){

    }

    public async redirect(prefix, id){

        var charge = await this.obtenerCargo()
            .then((e)=>{return e})
            .catch((er) => {return er});

        if(charge['cargo']){
            const cargo = charge['cargo'];
            var module = null;
            
            this.modules.forEach((mod) => {
                var pre = mod.prefixes.find((p) => {return p === prefix});
                if(pre){
                    var jobPosition = mod.charges.find((c) => {return c === cargo});
                    if(jobPosition){
                        module = mod
                    }
                }
            });
            if(!module){
                return false;
            }
            const result = await this.loadMenu.getModulesAndHierarchy();
            const _module = _.find(result.modules, { url_prefix: prefix });
            if (_module) {
                UtilProvider.actualModule = _module.nombre;
            }

            if(module.prefixes[0] == 'com' && module.params)
                module.params = {comunicado: {comunicado_id: id}}
            
            if(!module.params){
                this.app.getRootNav().setRoot(module.component);
            }else{
                module.params[module.params.key] = id
                this.app.getRootNav().push(module.component, module.params);
            }

            return true;

        }

    }

    
    


    private obtenerCargo(){
        return new Promise(async (resolve, reject) => {
            var session = await this.sesion.getSession()
            .then((sesion) => {
                return sesion
            })
            .catch((e) => {reject(e)});

            if(session['usuario']){
                const cargo = parseInt(session['usuario']['jerarquia'])
                if(cargo == 98 || cargo == 99){
                    resolve({cargo: 'zonal'});
                } else
                if(cargo > 99){
                    resolve({cargo: 'country'});
                } else
                if(cargo >= 0 || cargo <= 97){
                    resolve({cargo: 'branch-office'});
                } else resolve({cargo: 'NoEncontrado'});

            }else{
                reject('Error');
            }

        })
        
    }   

}


