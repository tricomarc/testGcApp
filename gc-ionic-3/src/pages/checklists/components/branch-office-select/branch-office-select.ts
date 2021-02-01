import { Component, OnInit } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

@Component({
    selector: 'branch-office-select',
    templateUrl: 'branch-office-select.html'
})

export class BranchOfficeSelectComponent implements OnInit {

    private branchOffices: any = [];
    private branchOfficesList: any = [];
    private searchControl = new FormControl();

    constructor(private navParams: NavParams, private viewCtrl: ViewController) { }

    ngOnInit() {
        if (!this.navParams.data.branchOffices) {
            this.viewCtrl.dismiss();
            return;
        }

        this.watchSearch();

        this.branchOffices = this.navParams.data.branchOffices;
        this.branchOfficesList = _.cloneDeep(this.branchOffices);
    }

    onBranchOfficeSelected(branchOffice: any) {
        this.viewCtrl.dismiss(branchOffice);
    }

    // Observa el campo de búsqueda y solicita filtrar las sucursales
    watchSearch() {
        this.searchControl.valueChanges
            .debounceTime(300) // Cuando se deja de tipear por 300 ms
            .distinctUntilChanged() // Si el input es distinto
            .subscribe(async (searchTerm: any) => {
                if (searchTerm) {
                    this.branchOffices = _.filter(this.branchOfficesList, (branchOffice) => {
                        return (_.includes(branchOffice.nombre.toLowerCase(), searchTerm.toLowerCase()));
                    });
                    return;
                }
                this.branchOffices = this.branchOfficesList;
            });
    }

    closeModal() {
        this.viewCtrl.dismiss();
    }
}
