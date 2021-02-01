import { Component } from '@angular/core';
import { NavParams, NavController, Events } from 'ionic-angular';
import { find } from 'lodash';

import { Visit } from '../../models/visit.class';
import { AmbitsComponent } from '../../../checklists/components/ambits/ambits';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'visit-detail',
    templateUrl: 'visit-detail.html'
})
export class VisitDetailComponent {

    private visit: Visit = null;

    // diccionario
    private checklists: string;
    private sucursal: string;

    constructor(
        private navParams: NavParams,
        private navController: NavController,
        private events: Events,
        private dictionary: DictionaryProvider
    ) { }

    async ionViewDidLoad() {
        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.checklists = dictionary['Checklists']
            this.sucursal = dictionary['Sucursal']
        } );
        
        if (!this.navParams.data.visit) {
            this.navController.pop();
            return;
        }
        this.visit = this.navParams.data.visit;
        this.events.subscribe('visits-change', (data) => {
            if (!data.visits) return;
            const visit = find(data.visits, (v) => v.id === this.visit.id);
            if (!visit) return;
            this.visit = visit;
        });
    }

    ionViewWillUnload() {
        this.events.unsubscribe('visits-change');
    }

    // Muestra los ámbitos de un checklist
    showChecklistAmbits(checklist: any) {
        this.navController.push(AmbitsComponent, {
            checklistId: checklist.id,
            checklistState: null,
            branchOfficeId: this.visit.branchOffice.id,
            historicDates: {
                start: (checklist.inicio_checklist ? checklist.inicio_checklist : null),
                end: (checklist.finalizacion_checklist ? checklist.finalizacion_checklist : null)
            }
        });
    }
}