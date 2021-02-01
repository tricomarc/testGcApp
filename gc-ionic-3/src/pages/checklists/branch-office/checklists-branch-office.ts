import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ActionSheetController, Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as _ from 'lodash';
import * as moment from 'moment';

import { RequestProvider } from '../../../shared/providers/request/request';
import { UtilProvider } from '../../../shared/providers/util/util';
import { SessionProvider } from '../../../shared/providers/session/session';
import { LoadMenuProvider } from '../../../shared/providers/util/loadMenu';

import { AmbitsComponent } from '../components/ambits/ambits';
import { ChecklistHistoricalComponent } from '../components/checklist-historical/checklist-historical';

import { checklistConfig } from '../checklists.config';
import { globalConfig } from '../../../config';
import { DictionaryProvider } from '../../../shared/providers/dictionary/dictionary';
import { filter } from 'lodash';

@IonicPage()
@Component({
	selector: 'page-checklists-branch-office',
	templateUrl: 'checklists-branch-office.html',
})
export class ChecklistsBranchOfficePage {

	private checklists = {
		all: [],
		list: [],
		occasionals: []
	};

	private auxChecklists: any;
	private filterSelected: number;
	private filterPrev: number = null;
	private areas: any = [{ id: null, nombre: 'Todas' }];
	private requesting: boolean = true;
	private currentDate: string = null;
	private areaFilter: any = 0;
	private session: any = null;
	private showOccasionals: boolean = true;
	private showNormals: boolean = true;
	private checklistState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
	private branchOfficeId: any = null;
	private checkinId: number = null;
	private moduleName: string = '';

	// diccionario
	private ambitos: string;
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
		private navCtrl: NavController,
		private navParams: NavParams,
		private loading: LoadingController,
		private actionSheetController: ActionSheetController,
		private events: Events,
		private dictionary: DictionaryProvider,
		private requestProvider: RequestProvider,
		private utilProvider: UtilProvider,
		private sessionProvider: SessionProvider,
		private loadMenuProvider: LoadMenuProvider
	) { }

	// Cuando la vista carga, obtenemos la sesión y todos los checklists del usuario
	async ionViewDidLoad() {

		this.branchOfficeId = this.navParams.data.branchOfficeId;
		this.checkinId = this.navParams.data.checkinId;

		const result = await this.loadMenuProvider.getModulesAndHierarchy();
		const module = _.find(result.modules, (m) => {
			return (!this.branchOfficeId ? (m.url_prefix === 'checklist') : (m.url_prefix === 'visita' || m.url_prefix === 'control'));
		});
		if (module) {
			UtilProvider.actualModule = module.nombre;
			this.moduleName = module.nombre;
		} else this.moduleName = this.diccChecklist;

		await this.sessionProvider.getSession().then((session: any) => {
			this.session = session;
		});
		
		await this.dictionary.getDictionary().then( ( dictionary: any ) => {
			this.ambitos = dictionary['Ambitos']
			this.diccChecklist = dictionary['Checklist']
            this.diccChecklists = dictionary['Checklists']
		} );

		this.requesting = true;

		this.checklistState.subscribe((update: boolean) => {
			if (update && !this.requesting) {
				this.refreshChecklists(null);
			}
		});

		this.getCustomStatusColor();
		await this.getChecklists();
		this.requesting = false;
	}

	// Antes de que la vista sea desmontada, paramos todos los intervalos (contadores por checklist) 
	ionViewWillUnload() {
		_.forEach(this.checklists.list, (checklist: any) => {
			if (checklist.checklistInterval) {
				try { clearInterval(checklist.checklistInterval) } catch (e) { }
			}
		});
		_.forEach(this.checklists.all, (checklist: any) => {
			if (checklist.checklistInterval) {
				try { clearInterval(checklist.checklistInterval) } catch (e) { }
			}
		});

		if (this.branchOfficeId) {
			this.events.publish('checklists-closed', { message: this.getVisitStatusMessage() });
		}
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

	// Calcula el tiempo restante de un checklist
	public static getRemainingTime(endTime: string, currentDate: string) {
		if (!endTime) return null;
		if (!currentDate) currentDate = '01-01-2000';

		let startTime = moment(moment.now()).format('HH:mm:ss');
		let remainingTime = moment.utc(moment(`${currentDate} ${endTime}`, 'DD-MM-YYYY HH:mm:ss').diff(moment(`${currentDate} ${startTime}`, 'DD-MM-YYYY HH:mm:ss'))).format('HH:mm:ss');

		if (!remainingTime || remainingTime === 'Invalid date') return null;

		return remainingTime;
	}

	// Muestra los ámbitos de un checklist
	showChecklistAmbits(checklistId: any) {
		this.navCtrl.push(AmbitsComponent, {
			checklistId: checklistId,
			checklistState: this.checklistState,
			branchOfficeId: this.branchOfficeId,
			checkinId: this.checkinId,
			fromCheckStore: (this.navParams.data.fromCheckStore === true ? true : false)
		});
	}

	// Refresca la lista de checklists noramles y ocasionales
	async refreshChecklists(event: any) {
		this.filterSelected =  null;
		await this.getChecklists();
		this.areaFilter = 0;
		if (event) {
			event.complete();
		}
	}

	// Filtra los checklists normales por su área
	filterChecklistsByArea() {
		if (!this.areaFilter) {
			this.checklists.list = this.checklists.all;
			return;
		}
		this.checklists.list = _.filter(this.checklists.all, (checklist: any) => {
			return this.areaFilter === checklist.area_id;
		});
	}

	// Genera la asignación del checklist ocasional
	assignChecklist(checklist: any) {
		let body: any = { check_id: checklist.id };
		if (
			this.session
			&& this.session.usuario
			&& this.session.usuario.sucursales
			&& this.session.usuario.sucursales.length === 1
		) {
			body.sucursal_id = this.session.usuario.sucursales[0];
		}

		// Si venimos desde checkstore, es prioridad la sucursal del checkin
		if (this.branchOfficeId) {
			body.sucursal_id = this.branchOfficeId;
		}

		// Si contamos con checkinId también lo enviamos
		if (this.checkinId) {
			body.checkin_id = this.checkinId;
		}

		const loading = this.loading.create({ content: 'Asignando checklist.' });
		loading.present();

		this.requestProvider
			.post(checklistConfig.endpoints.newApi.post.assignChecklist, body, true)
			.then((response: any) => {
				loading.dismiss();
				// Si la asignación es satisfactoria, entramos a los ámbitos de forma directa
				if (response && response.data && response.data.asignacion_id) {
					this.showChecklistAmbits(response.data.asignacion_id);
					this.refreshChecklists(null);
					return;
				}
				this.utilProvider.showToast((response.message ? response.message : 'No ha sido posible asignar el checklist ocasional, intente nuevamente.'), 3000);
			})
			.catch((error: any) => {
				this.utilProvider.showToast('No ha sido posible asignar el checklist ocasional, intente nuevamente.', 3000);
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				loading.dismiss();
			});
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
				this.navCtrl.push(ChecklistHistoricalComponent, { type: (this.branchOfficeId ? 2 : 1) });
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

	// Obtiene los checklists
	async getChecklists() {
		let response = null;
		let occasionals = null;

		if (this.branchOfficeId) {
			response = await this.getBranchOfficeChecklistsAndAreas();
			occasionals = await this.getBranchOfficeOccasionalChecklists();
		} else {
			response = await this.getChecklistsAndAreas();
			occasionals = await this.getOccasionalChecklists();
		}

		if(response && occasionals) {
			this.checklists.all = response.checklists;
			this.checklists.list = response.checklists;
			this.auxChecklists = this.checklists.list;
			this.checklists.occasionals = occasionals;
			this.areas = response.areas;
			
			if (this.navParams.data.lean === true) {
				this.navCtrl.push('AmbitosPage', {
					checklists: response.checklists,
				});
			}
		}
	}

	// Obtiene y retorna la lista de checklists y áreas
	async getChecklistsAndAreas(): Promise<any> {
		let response = {
			checklists: [],
			areas: [{ id: 0, nombre: 'Todas' }]
		};
		await this.requestProvider.get(checklistConfig.endpoints.newApi.get.checklists, true)
			.then((res: any) => {
				if (res && res.data && res.data) {
					this.currentDate = res.data.fecha_actual;
					_.forEach(res.data.checklist, (checklist: any) => {
						checklist.statusData = ChecklistsBranchOfficePage.getChecklistStatus(checklist);
						checklist.remainingTime = null;
						if (checklist.activo) {
							let checklistInterval = setInterval(() => {
								checklist.remainingTime = ChecklistsBranchOfficePage.getRemainingTime(checklist.termino, res.data.fecha_actual);
							}, 1000);
							checklist.checklistInterval = checklistInterval;
						}
					});
					_.forEach(res.data.areas, (area: any) => {
						response.areas.push(area);
					});
					response.checklists = res.data.checklist;
				}
			})
			.catch((error: any) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.utilProvider.showToast('No ha sido posible traer los checklists. Intente nuevamente.', 3000);
			});
		return response;
	}

	// Obtiene la lista de checklists ocasionales
	async getOccasionalChecklists() {
		let occasionals = [];
		await this.requestProvider.get(checklistConfig.endpoints.newApi.get.occasionals, true)
			.then((response: any) => {
				if (response && response.data && response.data.length) {
					occasionals = response.data;
				}
			})
			.catch((error: any) => { try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }  });
		return occasionals;
	}

	// Obtiene los checklists de una sucursal que viene desde checkstore
	async getBranchOfficeChecklistsAndAreas() {
		let response = {
			checklists: [],
			areas: [{ id: 0, nombre: 'Todas' }]
		};
		await this.requestProvider.post(checklistConfig.endpoints.newApi.post.branchOfficeChecklists, { sucursal_id: this.branchOfficeId }, true)
			.then((res: any) => {
				if (res && res.data && res.data) {
					this.currentDate = res.data.fecha_actual;
					_.forEach(res.data.checklist, (checklist: any) => {
						checklist.statusData = ChecklistsBranchOfficePage.getChecklistStatus(checklist);
						checklist.remainingTime = null;
						if (checklist.activo) {
							let checklistInterval = setInterval(() => {
								checklist.remainingTime = ChecklistsBranchOfficePage.getRemainingTime(checklist.termino, res.data.fecha_actual);
							}, 1000);
							checklist.checklistInterval = checklistInterval;
						}
					});
					_.forEach(res.data.areas, (area: any) => {
						response.areas.push(area);
					});
					response.checklists = res.data.checklist;
				}
			})
			.catch((error: any) => {
				try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
				this.utilProvider.showToast('No ha sido posible traer los checklists. Intente nuevamente.', 3000);
			});
		return response;
	}

	// Obtiene la lista de checklists ocasionales de una sucursal que viene desde checkstore
	async getBranchOfficeOccasionalChecklists() {
		let occasionals = [];
		await this.requestProvider.post(checklistConfig.endpoints.newApi.post.branchOfficeOccasionalsChecklists, { check_tipo_id: 2, sucursal_id: this.branchOfficeId }, true)
			.then((response: any) => {
				if (response && response.data && response.data.length) {
					occasionals = response.data;
				}
			})
			.catch((error: any) => { try { this.utilProvider.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { } });
		return occasionals;
	}

	getVisitStatusMessage() {
		let message: string = null;
		if (!this.checklists.occasionals.length && !this.checklists.list.length) {
			return message;
		}

		if (this.checklists.occasionals.length && !this.checklists.list.length) {
			message = 'No has respondido ningún checklist en esta visita. ¿Está seguro que desea hacer checkout?';
			return message;
		}

		const statuses = {
			isAtLeastOneWithoutAnswer: false,
			isAtLeastOneIncomplete: false,
			isAtLeastOneComplete: false,
		};

		this.checklists.list.forEach(checklist => {
			if (checklist.estado_id === 1) statuses.isAtLeastOneWithoutAnswer = true;
			if (checklist.estado_id === 2) statuses.isAtLeastOneIncomplete = true;
			if (checklist.estado_id === 3) statuses.isAtLeastOneComplete = true;
		});

		if (!statuses.isAtLeastOneWithoutAnswer && !statuses.isAtLeastOneIncomplete && !statuses.isAtLeastOneComplete) return message;

		if (statuses.isAtLeastOneWithoutAnswer) {
			message = 'Tiene checklist sin contestar en esta visita. ¿Está seguro que desea hacer checkout?';
			return message;
		}

		if (statuses.isAtLeastOneIncomplete) {
			message = 'Tiene checklist incompletos. ¿Está seguro que desea hacer checkout?';
			return message;
		}

		if (statuses.isAtLeastOneComplete) {
			message = 'Tiene checklist sin finalizar. ¿Está seguro que desea hacer checkout?';
			return message;
		}
		return message;
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