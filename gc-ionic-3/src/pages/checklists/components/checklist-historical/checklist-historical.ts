import { Component, Input, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { filter } from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';

import { AmbitsComponent } from '../ambits/ambits';

import { checklistConfig } from '../../checklists.config';
import { globalConfig } from '../../../../config';


import * as _ from 'lodash';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'checklist-historical',
    templateUrl: 'checklist-historical.html'
})
export class ChecklistHistoricalComponent implements OnInit {

    private filterSelected: number;
    private filterPrev: number = null;
    private auxChecklists: any;
    private historical: any = null;
    private checklists: any[] = [];
    private loading: boolean = false;
    private types: any[] = [{ label: 'Todos', value: -1 }, { label: 'Evaluable', value: 1 }, { label: 'No evaluable', value: 0 }];
    private filters: any = {
        to: null,
        from: null,
        type: null
    };
    private type: number = 1;

    private module: string = UtilProvider.actualModule;
    private session: any;

    // diccionario
    private ambitos: string;
    private sucursal: string;
    private diccChecklist: string;
    private diccChecklists: string;

	private statusColors = { 
		"completo": null, 
		"enviado": null, 
		"fuera_horario": null, 
		"incompleto": null, 
		"sin_contestar": null
	}
    constructor(
        private requestProvider: RequestProvider,
        private utilProvider: UtilProvider,
        private navController: NavController,
        private navParams: NavParams,
        private sessionProvider: SessionProvider,
        private dictionary: DictionaryProvider) { }

    async ngOnInit() {
        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.diccChecklist = dictionary['Checklist']
            this.diccChecklists = dictionary['Checklists']
        } );

        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);

        this.type = (this.navParams.data.type ? this.navParams.data.type : this.type);

        this.filters = {
            to: this.getFormatedDate(to),
            from: this.getFormatedDate(from),
            type: this.types[0].value
        };
        this.historical = await this.getHistorical(false);
        this.getCustomStatusColor();
        if (this.historical) {
            if (this.type === 2) {
                this.checklists = this.historical.checklist.filter((checklist: { modulo: { id: number; }; }) => (checklist.modulo && checklist.modulo.id === 2));
                return;
            }
            this.checklists = this.historical.checklist;
            this.auxChecklists = this.checklists;

            _.forEach( this.checklists , ( checklist: any ) => {
			    checklist.statusData = ChecklistHistoricalComponent.getChecklistStatus( checklist );
						
            });
        }
        await this.sessionProvider.getSession().then((session: any) => {
			this.session = session;
		});
    }

    // Retorna los parámetros que se pasarán por url a los servicios de estadísticas
    getQueryParams() {
        return `?fecha_desde=${this.filters.from}&fecha=${this.filters.to}&tipo=usuario`;;
    }

    // Recibe una fecha y retorna un string en formato yyyy-mm-dd
    getFormatedDate(date: any) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1);
        const day = date.getDate();

        return `${year}-${month < 10 ? ('0' + month) : month}-${day < 10 ? ('0' + day) : day}`;
    }

    async getHistorical(isRefresher: boolean) {
        let historical = null;
        if (!isRefresher) this.loading = true;
        await this.requestProvider.get(checklistConfig.endpoints.newApi.get.historical + this.getQueryParams(), true)
            .then((result: any) => {
                if (result && result.data) {
                    historical = result.data;
                }
            })
            .catch((err) => {
                try { this.utilProvider.logError(JSON.stringify(err), null, globalConfig.version); } catch (e) { }
                this.utilProvider.showToast('No ha sido posible obtener el historial, intente nuevamente.', 3000);
            });
        this.loading = false;
        return historical;
    }

    filterByType() {
        if (!this.historical) return;
        if (this.filters.type < 0) {
            this.checklists = this.historical.checklist;
            return;
        }
        this.checklists = filter(this.historical.checklist, { evaluable: this.filters.type });
    }

    // Muestra los ámbitos de un checklist
    showChecklistAmbits(checklistId: any) {
        this.navController.push(AmbitsComponent, {
            checklistId: checklistId,
            fromStatistics: true
        });
    }

    // Actualiza la información del checklist
    async refreshChecklist(event: any) {
        this.filterSelected = null;
        this.historical = await this.getHistorical(true);

        /*
        if (this.historical) {
            if (this.type === 2) {
                this.checklists = this.historical.checklist.filter((checklist: { modulo: { id: number; }; }) => (checklist.modulo && checklist.modulo.id === 2));
            } else {
                this.checklists = this.historical.checklist;
            }
        }
        */
        this.getCustomStatusColor();
        if (this.historical) {
            if (this.type === 2) {
                this.checklists = this.historical.checklist.filter((checklist: { modulo: { id: number; }; }) => (checklist.modulo && checklist.modulo.id === 2));
                return;
            }
            this.checklists = this.historical.checklist;
            this.auxChecklists = this.checklists;

            _.forEach( this.checklists , ( checklist: any ) => {
			    checklist.statusData = ChecklistHistoricalComponent.getChecklistStatus( checklist );
						
            });
        }

        if (event) {
            event.complete();
        }
    }

    async filterByDateRange() {
        this.historical = await this.getHistorical(false);
        if (this.historical) {
            this.checklists = this.historical.checklist;
        }
        this.filterByType();
    }

    // Obtiene y retorna los datos del estado de un checklist
	public static getChecklistStatus(checklist: any) {
		const statusData = {
			statusId: checklist.estado_id,
			icon: 'md-radio-button-off',
			color: 'default'
		};

		if (checklist.estado_id === 1) {
			statusData.icon = 'ios-radio-button-off';
			statusData.color = '#bfbfbf';
			return statusData;
		}
		if (checklist.estado_id === 2) {
			statusData.icon = 'ios-radio-button-on';
			statusData.color = '#f2b705';
			return statusData;
		}
		if (checklist.estado_id === 3) {
			statusData.icon = 'checkmark-circle-outline';
			statusData.color = '#048abf';
			return statusData;
		}
		if (checklist.estado_id === 4) {
			statusData.icon = 'checkmark-circle';
			statusData.color = '#a9bf04';
			return statusData;
		}
		return statusData;
    }
    

	async getCustomStatusColor(){
		const { checklist } = await this.utilProvider.getColors();
		if(!checklist) return;

		const statusColor = checklist.status || null;
		if(!statusColor) return;

		this.statusColors = {
			enviado: 		statusColor.enviado,
			completo: 		statusColor.completo,
			incompleto: 	statusColor.incompleto,
			sin_contestar:  statusColor.sin_contestar,
			fuera_horario: 	statusColor.fuera_horario

		}

    }
    
    filterStatus( status: any ){
        if( status == this.filterPrev ){
			this.checklists = this.auxChecklists;

			this.filterSelected = null;
			this.filterPrev = null;

			return;
		}else{
			this.filterSelected = status;

			this.filterPrev = status;

			this.checklists = _.filter( this.auxChecklists, [ 'orden_status', status ] )
			
			return;
        }
    }
}