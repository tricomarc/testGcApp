import { Component, Input } from '@angular/core';
import { LoadingController, NavController, ModalController } from 'ionic-angular';

import * as _ from 'lodash';

import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';

import { checklistConfig } from '../../checklists.config';

import { BranchOfficeSelectComponent } from '../branch-office-select/branch-office-select';
import { AmbitsComponent } from '../ambits/ambits';
import { SessionProvider } from '../../../../shared/providers/session/session';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'own-checklists',
    templateUrl: 'own-checklists.html'
})
export class OwnChecklistsComponent {

	@Input() module: string;
	@Input() checklists: any;
	@Input() session: any;
	@Input() checklistState: any;
	@Input() filterSelected: any;
	
	private filterPrev: number = null;
	private auxChecklists: any;
	private showOccasionals: boolean = true;
	private showNormals: boolean = true;
	private charge: string = null;
	private statusColors = { 
		"completo": null, 
		"enviado": null, 
		"fuera_horario": null, 
		"incompleto": null, 
		"sin_contestar": null
	}

	//diccionarios
	private diccChecklists: string;

    constructor(
    	private loadingController: LoadingController,
		private navController: NavController,
		private modalController: ModalController,
    	private requestProvider: RequestProvider,
		private utilProvider: UtilProvider,
		private sessionProvider: SessionProvider,
		private dictionary: DictionaryProvider
    ) { }

    async ngOnInit() {
		await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.diccChecklists = dictionary['Checklists']
        } );
        
		this.sessionProvider
			.getSession()
			.then((response: any) => {
				this.session = response;
				if (response && response.usuario) {
					this.charge = (
						(
							response.usuario.jerarquia < 98 || !response.usuario.jerarquia
						) ? 'branch-office' : (
							response.usuario.jerarquia > 97 && response.usuario.jerarquia < 99
						) ? 'zonal' : 'country'
					);
				}
			});
		
		this.auxChecklists = this.checklists.own;
		this.getCustomStatusColor();
	}

    ngOnDestroy() {
    	_.forEach(this.checklists.own, (checklist: any) => {
			if (checklist.checklistInterval) {
				try { clearInterval(checklist.checklistInterval) } catch (e) { }
			}
		});
    }

    // Genera la asignación del checklist ocasional
	async assignChecklist(checklist: any) {
		const body: any = { check_id: checklist.id };
		let branchOfficeId: any = null;

		if(!this.charge) return;

		if (this.charge !== 'branch-office' && checklist.sucursales && checklist.sucursales.length) {
			await this.selectBranchOffice(checklist.sucursales)
				.then((branchOffice: any) => {
					if (branchOffice && branchOffice.id) {
						branchOfficeId = branchOffice.id;
					}
				});

			if (!branchOfficeId) return;
		}

		body.sucursal_id = branchOfficeId;

		const loading = this.loadingController.create({ content: 'Asignando checklist.' });
		loading.present();

		this.requestProvider
			.post(checklistConfig.endpoints.newApi.post.assignChecklist, body, true)
			.then((response: any) => {
				loading.dismiss();
				// Si la asignación es satisfactoria, entramos a los ámbitos de forma directa
				if (response && response.data && response.data.asignacion_id) {
					this.showChecklistAmbits(response.data.asignacion_id);
					this.checklistState.next(true);
					return;
				}
				this.utilProvider.showToast((response.message ? response.message : 'No ha sido posible asignar el checklist ocasional, intente nuevamente.'), 3000);
			})
			.catch((error: any) => {
				this.utilProvider.showToast('No ha sido posible asignar el checklist ocasional, intente nuevamente.', 3000);
				loading.dismiss();
			});
	}

	// Muestra los ámbitos de un checklist
	showChecklistAmbits(checklistId: any) {
		this.navController.push(AmbitsComponent, { checklistId: checklistId, checklistState: this.checklistState });
	}

	async selectBranchOffice(branchOffices: any) {
		return new Promise((resolve) => {
			const modal = this.modalController.create(BranchOfficeSelectComponent, { branchOffices: branchOffices });
			modal.present();
			modal.onDidDismiss((params: any) => {
				resolve(params);
			});
		});
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
			sin_contestar: statusColor.sin_contestar,
			fuera_horario: 	statusColor.fuera_horario

		}

	}

	filterStatus( status: any ){
		if( status == this.filterPrev ){
			this.checklists.list = this.auxChecklists;

			this.filterSelected = null;
			this.filterPrev = null;

			return;
		}else{
			this.filterSelected = status;

			this.filterPrev = status;

			this.checklists.list = _.filter( this.auxChecklists, [ 'orden_status', status ] )
			
			return;
		}
	}
}