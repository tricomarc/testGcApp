import { Component } from '@angular/core';
import { IonicPage, Content, NavController } from 'ionic-angular';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../shared/providers/request/request';
import { UtilProvider } from '../../shared/providers/util/util';

// Configuración global
import { global } from '../../shared/config/global';

// Configuración del componente
import { config } from './knowledge-base.config';

// Páginas
import { SolutionsPage } from './solutions/solutions';
import { globalConfig } from '../../config';

@IonicPage()
@Component({
    selector: 'page-knowledge-base',
    templateUrl: 'knowledge-base.html',
})
export class KnowledgeBasePage {

    private problems: any = [];
    private requesting: boolean = false;
    private searchControl = new FormControl();

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(private navCtrl: NavController,
        private request: RequestProvider,
        private util: UtilProvider) {
    }

    // Método que se inicia al cargar la vista
    ionViewDidLoad() {
        this.watchSearch();
    }

    // Obtiene y retorna la lista de problemas que coincida con la búsqueda
    async getProblemsBySearchTerm(search_term: any) {
        let results = [];
        await this.request
            .get(config.endpoints.newApi.get.problems + search_term, true)
            .then((response: any) => {
                if (response && response.data) results = response.data;
            })
            .catch((error: any) => {
                try { this.util.logError(JSON.stringify(error), null, globalConfig.version); } catch (e) { }
                this.util.showAlert('Atención', 'No ha sido posible obtener la lista de problemas, intente nuevamente.');
            });
        return results;
    }

    // Observa el campo de búsqueda y solicita buscar nuevos "problemas"
    watchSearch() {
        this.searchControl.valueChanges
            .debounceTime(300) // Cuando se deja de tipear por 300 ms
            .distinctUntilChanged() // Si el input es distinto
            .subscribe(async (search_term: any) => {
                if (search_term) {
                    this.requesting = true;
                    this.problems = await this.getProblemsBySearchTerm(search_term);
                    this.requesting = false;
                }
                else this.problems = [];
            });
    }

    // Muestra las soluciones de un problema
    showSolutions(problem: any) {
        this.navCtrl.push(SolutionsPage, { problem: problem });
    }

    // Refresca los datos de la vista
    async refreshKnowledgewBase(refresher: any) {
        this.problems = await this.getProblemsBySearchTerm(this.searchControl.value);
        refresher.complete();
    }
}
