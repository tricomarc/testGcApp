import { Component, ViewChild, NgZone } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import * as _ from 'lodash';

// Proveedores
import { RequestProvider } from '../../../../shared/providers/request/request';
import { UtilProvider } from '../../../../shared/providers/util/util';
import { SessionProvider } from '../../../../shared/providers/session/session';

// Páginas

// Configuración del componente
import { config } from './kpi-colgram.config'

// Configuración global
import { global } from '../../../../shared/config/global';
import { FirebaseAnalyticsProvider } from '../../../../shared/providers/firebase-analytics/firebase-analytics';

@IonicPage()
@Component({
    selector: 'page-kpi-colgram',
    templateUrl: 'kpi-colgram.html'
})

export class KpiColgramPage {

    // Atributos
    private groups: any = [{
        nombre: 'Todas'
    }];

    private branch_offices: any = [{
        nombre: 'Todas',
        id: -1
    }];

    private zones: any = [];

    private selected_group: any = null;
    private selected_branch_office: any = null;
    private selected_zone: any = null;

    private charge: any = null;

    private current_date: any = null;

    // Representa el estado de carga cuando se pide o actualiza la data
    private requesting: boolean = false;

    private form: any = {
        consulta_id: null,
        tipo: 'zona'
    };

    private session: any = null;
    private fulfillment: any = [];
    private data_name: any = '--';
    private ranking: any = null;
    private hierarchy: any = null;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = 'KPI'; //Nombre para mostrar del módulo seleccionado

    // Constructor
    constructor(private navCtrl: NavController,
        private zone: NgZone,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {
    }

    // Método que se ejecuta cuando carga la vista
    ionViewDidLoad() {
        // track de vista
        this.firebaseAnalyticsProvider.trackView( 'KpiColgram' );
        //this.firebaseAnalyticsProvider.trackScreenEvent( 'KpiColgram', 'KPI' );

        this.getInitData();
    }

    // Obtiene los datos iniciales y consulta el cumplimiento
    async getInitData() {
        this.session = await this.getSession();

        if (!this.session || !this.session.zona_id) {
            this.util.showAlert('Alerta', 'No tiene una zona asociada');
            return;
        }

        this.zone.run(async () => {
            this.requesting = true;

            this.groups = await this.getGroups();

            this.form.consulta_id = this.selected_zone ? this.selected_zone : this.session.zona_id;

            this.selected_group = this.groups[0];

            this.fulfillment = await this.getFulfillment();

            this.requesting = false;
        });
    }

    // Obtiene y retorna datos de la sesión actual
    async getSession() {
        let session: any = {
            cargo: null,
            sucursales: [],
            zona_id: -1
        };

        await this.sessionProvider
            .getSession()
            .then((response: any) => {
                let hierarchy = response.usuario.jerarquia;
                let branch_offices = response.usuario.sucursales;
                let zone_id = response.usuario.zona_id;

                this.hierarchy = hierarchy;

                session.cargo = ((!hierarchy || hierarchy < 98) ? 'sucursal' : (hierarchy < 100 ? 'zona' : 'pais'));
                session.sucursales = branch_offices;
                session.zona_id = zone_id;
            })
            .catch((error: any) => { });
        return session;
    }

    // Vuelve a solicitar el cumplimiento
    async refreshKpi(refresher: any) {
        await this.getFulfillment();
        if (refresher) refresher.complete();
    }

    // Obtiene las cadenas de una zona
    async getGroups() {
        let groups = [{
            nombre: 'Todas'
        }];

        await this.request
            .get('/campana/menuKolo', true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data) {
                        if(response.data.cadenas) {
                            _.forEach(response.data.cadenas, (group) => {
                                groups.push(group);
                            });
                        }
                        if(response.data.zonas && response.data.zonas.length) {
                            this.zones = response.data.zonas;
                            let user_zone = _.find(this.zones, { id: this.session.zona_id });
                            if(user_zone) this.selected_zone = user_zone.id;
                            else this.selected_zone = this.zones[0].id;
                        }
                    } else {
                        this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
                    }
                } catch (e) {
                    this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
                }
            })
            .catch((error) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener la información de KPI');
            });
        return groups;
    }

    // Obtiene el cumplimiento con los filtros seleccionados
    async getFulfillment() {
        let fulfillment = [];

        await this.request
            .get(`/campana/inicioKolo${this.getQueryParams()}`, true)
            .then((response: any) => {
                try {
                    if (response.code === 200 && response.data) {
                        this.data_name = response.data.nombre;
                        fulfillment = response.data.data;
                    } else {
                        this.util.showAlert('Alerta', 'No ha sido posible obtener el cumplimiento');
                    }
                } catch (e) {
                    this.util.showAlert('Alerta', 'No ha sido posible obtener el cumplimiento');
                }
            })
            .catch((error) => {
                this.util.showAlert('Alerta', 'No ha sido posible obtener el cumplimiento');
            });
        return fulfillment;
    }

    // Retorna los parámetros para filtrar el cumplimiento
    getQueryParams() {
        let params: any = '';
        if (this.form.consulta_id) {
            params += `?dataId=${this.form.consulta_id}`;
            params += `&tipo=${this.form.tipo}`;
            if (this.form.tipo === 'cadena') params += `&zonaId=${this.selected_zone ? this.selected_zone : this.session.zona_id}`;
        }
        return params;
    }

    // Cada vez que hay un cambio en la selección de cadenas, se vuelve a solicitar el cumplimiento aplicando los nuevos filtros
    async onGroupChange() {
        if (!this.selected_group) {
            this.form.tipo = 'zona';
            return;
        }

        this.branch_offices = [{
            nombre: 'Todas',
            id: -1
        }];

        if (this.selected_group.nombre === 'Todas') {
            this.form.consulta_id = this.session.zona_id;
            this.form.tipo = 'zona';
            this.ranking = null;
        } else {
            _.forEach(this.selected_group.sucursales, (sucursal) => {
                this.branch_offices.push(sucursal);
            });
            this.form.consulta_id = this.selected_group.id;
            this.form.tipo = 'cadena';
            this.ranking = (this.selected_group.ranking && this.selected_group.ranking.length) ? this.selected_group.ranking : null;
        }
        this.selected_branch_office = this.branch_offices[0].id;

        this.requesting = true;

        // Obtenemos el cumplimiento
        this.fulfillment = await this.getFulfillment();

        this.requesting = false;
    }

    // Cada vez que hay un cambio en la selección de sucursales, se vuelve a solicitar el cumplimiento aplicando los nuevos filtros
    async onBranchOfficeChange() {
        let selected_branch_office = _.find(this.branch_offices, { id: this.selected_branch_office });
        if (!selected_branch_office) {
            this.form.tipo = 'cadena';
            return;
        }

        // Si la sucursal es 'Todas' asignamos el valor de la zona en caso de que exista
        if (selected_branch_office.nombre === 'Todas') {
            if (!this.selected_group || this.selected_group.nombre === 'Todas') {
                this.form.consulta_id = this.session.zona_id;
                this.form.tipo = 'zona';
            } else {
                this.form.consulta_id = this.selected_group.id;
                this.form.tipo = 'cadena';
            }
        } else {
            this.form.consulta_id = selected_branch_office.id;
            this.form.tipo = 'sucursal';
        }

        this.requesting = true;

        // Obtenemos las áreas
        this.fulfillment = await this.getFulfillment();

        this.requesting = false;
    }

    // Cada vez que se cambia la zona, actualizamos la data
    async onZoneChange() {

        this.form.tipo = 'zona';
        this.form.consulta_id = this.selected_zone;

        this.selected_group = this.groups[0];
        this.ranking = null;

        this.requesting = true;

        // Obtenemos las áreas
        this.fulfillment = await this.getFulfillment();

        this.requesting = false;
    }
}
