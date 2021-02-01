import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { delay } from 'lodash';

import { UtilProvider } from '../../../../shared/providers/util/util';
import { RequestProvider } from '../../../../shared/providers/request/request';
import { config } from '../../map-visit.config';
import { Visit } from '../../models/visit.class';
import { VisitDetailComponent } from '../visit-detail/visit-detail';
import { DictionaryProvider } from '../../../../shared/providers/dictionary/dictionary';

@Component({
    selector: 'visit-historical',
    templateUrl: 'visit-historical.html'
})
export class VisitHistoricalComponent {

    /**
     * Arreglo con visitas del usuario actual
     */
    private visits: Visit[] = [];

    /**
     * Filtros de fecha para obtener las visitas
     */
    private filters: { from: string; to: string; } = null;

    /**
     * Objeto con los estados de carga de los requests
     */
    private loading = {
        getVisits: false
    };

    // diccionario
    private sucursal: string;
    private checklists: string;
    
    constructor(
        private navController: NavController,
        private events: Events,
        private utilProvider: UtilProvider,
        private requestProvider: RequestProvider,
        private dictionary: DictionaryProvider
    ) { }

    async ionViewDidLoad() {
        this.setFilterDate();
        this.visits = await this.getVisits(true);

        this.events.subscribe('sent-answers', async () => {
            this.visits = await this.getVisits(false);
            this.events.publish('visits-change', { visits: this.visits });
        });

        await this.dictionary.getDictionary().then( ( dictionary: any ) => {
            this.sucursal = dictionary['Sucursal']
            this.checklists = dictionary['Checklists']
		} );
    }

    ionViewWillUnload() {
        this.events.unsubscribe('sent-answers');
    }

    /**
     * Asigna los valores para los filtros de fecha
     * to: último día del mes actual
     * from: primer día del mes actual
     */
    setFilterDate() {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);

        this.filters = {
            from: this.utilProvider.getFormatedDate(from),
            to: this.utilProvider.getFormatedDate(to)
        };
    }

    /**
     * Solicita a la API y retorna un arreglo de visitas
     * @param showLoading
     */
    async getVisits(showLoading: boolean): Promise<Visit[]> {
        if (showLoading) this.loading.getVisits = true;
        const visits: Visit[] = await this.requestProvider.post('/checklist/visitas/historico', this.getBodyParams(), true)
            .then((result: { data: any[] }) => (result.data) ? result.data.map(visit => Visit.parse(visit)) : [])
            .catch((error) => {
                this.utilProvider.showToast('No ha sido posible obtener el historial de visitas, intente nuevamente.', 3000);
                return [];
            });
        this.loading.getVisits = false;
        return visits;
    }

    /**
     * Retorna los parámetros que filtrarán las visitas a nivel de API
     */
    getBodyParams() {
        return {
            desde: this.filters.from,
            hasta: this.filters.to
        };
    }

    /**
     * Refresca las visitas
     * @param refresher
     */
    async refreshVisits(refresher: any) {
        this.visits = await this.getVisits((refresher ? false : true));
        if (refresher) refresher.complete();
    }

    showVisitDetail(visit: Visit) {
        this.navController.push(VisitDetailComponent, { visit: visit });
    }
}