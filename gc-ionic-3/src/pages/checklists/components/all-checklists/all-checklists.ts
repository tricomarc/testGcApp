import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AmbitsComponent } from '../ambits/ambits';
import { ChecklistDetailsPage } from "../../../dashboard/zonal/sub-pages/checklist/checklist";

@Component({
	selector: 'all-checklists',
	templateUrl: 'all-checklists.html'
})
export class AllChecklistsComponent {

	@Input() module: string;
	@Input() checklists: any = [];
	@Input() session: any;

	constructor(private navController: NavController) { }

	ngOnInit() { }

	showAmbit(checklist: any) {
		this.navController.push(AmbitsComponent, { checklistId: checklist.asignacion_id, showTemplate: true });
	}

	showStatistics(checklist: any) {
		let params: any = {
			checks_id: [checklist.check_id],
			nombreModulo: checklist.check_nombre,
		};
		if (this.session && this.session.usuario && this.session.usuario.zona_id) {
			params.zona_id = this.session.usuario.zona_id;
		}
		this.navController.push(ChecklistDetailsPage, params);
	}
}