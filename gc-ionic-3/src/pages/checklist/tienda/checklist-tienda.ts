import { ApplicationRef, Component } from '@angular/core';
import {
    Events,
    IonicPage,
    LoadingController,
    MenuController,
    NavController,
    NavParams,
    ActionSheetController,
    ModalController
} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LocalNotifications } from '@ionic-native/local-notifications';

import * as _ from 'lodash';
import * as moment from 'moment';

import { config } from './checklist-tienda.config'
import { SessionProvider } from "../../../shared/providers/session/session";
import { RequestProvider } from "../../../shared/providers/request/request";
import { UtilProvider } from "../../../shared/providers/util/util";
import { DashboardPage } from "../../dashboard/tienda/dashboard";
import { AmbitoPage } from "../sub-pages/ambito/ambito";
import { AmbitosPage } from "../sub-pages/ambitos/ambitos";
import { HistoricoPage } from "../sub-pages/historico/historico";
import { OcacionalesPage } from "../sub-pages/ocacionales/ocacionales";
import { ComunicadosTiendaPage } from "../../comunicados/tienda/comunicados-tienda";
import { VisualPage } from "../../visual/branch-office/visual";
import { IndexPage } from "../../index/index";
import { EstadisticasPage } from "../../dashboard/zonal/estadisticas";
import { FinalizadasPage } from "../sub-pages/finalizadas/finalizadas";
import { TasksBranchOfficePage } from "../../tasks/branch-office/tasks-branch-office";
import { global } from "../../../shared/config/global";
import { FinalizadasDetallePage } from "../sub-pages/finalizadas/sub-pages/finalizadas-detalle/finalizadas-detalle";
import { scheduleMicroTask } from '@angular/core/src/util';
import { FirebaseAnalyticsProvider } from '../../../shared/providers/firebase-analytics/firebase-analytics';

import { SucursalesModalComponent } from '../components/sucursales-modal/sucursales-modal';

/**
 * Generated class for the ChecklistTiendaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-checklist-tienda',
    templateUrl: 'checklist-tienda.html',
})
export class ChecklistTiendaPage {

    private occasionalChecklists: any = [];
    private showOccasionalChecklists: boolean = true;
    private session: any = null;
    private charge: string = null;

    actualDate: Date;
    checklists = [];
    stop = [];
    showChecklists = [];
    visita_tienda = [];
    areas = [{
        id: 0,
        name: "Todas"
    }, {
        id: 99,
        name: "Sin Area"
    }];
    thisSession = {};
    sucursal = {};
    visit = {};
    areaFilter: null;
    sucursal_id: null;
    settingViewComparador = false;
    settingViewHistorico = false;
    settingViewOcasional = false;

    showTienda: boolean = true;
    showPropios: boolean = false;

    isReady: boolean = false;

    private title: string = global.title; //Nombre para mostrar de la App
    private module: string = UtilProvider.actualModule; //Nombre para mostrar del módulo seleccionado

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private loading: LoadingController,
        private request: RequestProvider,
        private util: UtilProvider,
        private sessionProvider: SessionProvider,
        private applicationRef: ApplicationRef,
        private event: Events,
        private storage: Storage,
        private menu: MenuController,
        private actionSheet: ActionSheetController,
        private events: Events,
        private modalController: ModalController,
        private localNotifications: LocalNotifications,
        private firebaseAnalyticsProvider: FirebaseAnalyticsProvider) {

    }

    async ionViewDidLoad() {
        // tracks de vista
        this.firebaseAnalyticsProvider.trackView( 'ChecklistTienda' );
        

        await this.sessionProvider
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
            })
        // Si no entramos desde visita a tienda, buscamos si el usuario tiene checklists ocasionales
        if (!this.navParams.data.sucursal) {
            this.occasionalChecklists = await this.getOccasionalChecklists();
        }
    }

    async ionViewWillEnter() {
        this.menu.enable(true, "menu");
        this.thisSession = await this.util.getInternalSession();
        
        if (!_.isUndefined(this.navParams.data.sucursal) && !_.isNull(this.navParams.data.sucursal)) {
            this.sucursal_id = this.navParams.data.sucursal;
        }

        // Si proviene desde visitas
        if (!_.isUndefined(this.sucursal_id) && !_.isNull(this.sucursal_id)) {
            this.getDatafromMemory(this.sucursal_id);
        } else {
            // Si proviene desde checklist
            this.sucursal_id = null;
            var settings = this.thisSession["usuario"].settings;
            //TODO: Ya no se usa esta validación
            /*var comparador = _.find(settings, { nombre: 'checklist_comparador' });
            var historico = _.find(settings, { nombre: 'checklist_historico_tienda' });
            var ocasional = _.find(settings, { nombre: 'checklist_ocasional' });

            if (!_.isUndefined(comparador)) {
                if (comparador != 0 && comparador.valor == 1 && comparador.visible == 1) {
                    this.settingViewComparador = true;
                }
            }
            if (!_.isUndefined(historico)) {
                if (historico != 0 && historico.valor == 1 && historico.visible == 1) {
                    this.settingViewHistorico = true;
                }
            }
            if (!_.isUndefined(ocasional)) {
                if (ocasional != 0 && ocasional.valor == 1 && ocasional.visible == 1) {
                    this.settingViewOcasional = true;
                }
            }*/
            this.getAllChecklists();
        }
    }

    /**
     * Antes de cerrar la vista, se detienen los contadores de tiempo
     */
    ionViewWillLeave() {
        this.stopInterval();
    }

    /**
     * Trae lista de checklists y areas desde API
     * @returns {Promise<{}>}
     */
    async getAllChecklists() {
        let active = this.navCtrl.getActive();
        
        if (active.instance instanceof ChecklistTiendaPage || active.instance instanceof DashboardPage || active.instance instanceof EstadisticasPage || active.instance instanceof AmbitoPage || active.instance instanceof HistoricoPage || active.instance instanceof ComunicadosTiendaPage || active.instance instanceof VisualPage || active.instance instanceof IndexPage || active.instance instanceof TasksBranchOfficePage) {
            const loading = this.loading.create({ content: 'Obteniendo checklist' });
            
            loading.present();
            
            this.showChecklists = [];
            
            let data = {};
            
            let checksCompletados:any = [];

            await this.request
                .get( config.endpoints.get.checklists, true )
                .then( ( response: any ) => {
                    loading.dismiss();
                    try {
                        this.checklists = response.data.checklist;
                        
                        this.actualDate = response.data.fecha_actual;
                        
                        // guardo cada checklist traido en el arreglo
                        _.forEach( this.checklists, ( check ) => {   
                            // los que vienen completados pero no enviados
                            if( check.estado_id == 3 ){
                                // lo guardo aqui
                                checksCompletados.push( check );
                            }  
                            this.showChecklists.push( check )
                        });

                        // si existe la notificacion agendada, pero no el checklist, se borra
                        this.localNotifications.getScheduledIds().then( ids => {
                            _.forEach( ids, ( id ) => {
                                _.forEach( checksCompletados, ( check ) => {
                                    if( ! _.isMatch( check, { 'id': id } ) ){
                                        this.localNotifications.clear( id );
                                        
                                        return;
                                    }
                                } );
                            } );
                        } );
                        
                        // Luego, envio los checks completados a agendar
                        this.scheduleChecklist( checksCompletados );

                        // cuenta atras para cada checklist traido
                        for ( let checklist of this.showChecklists ) {
                            this.countdown( checklist );
                        }
                        
                        if ( _.isUndefined( this.areaFilter ) || _.isNull( this.areaFilter ) ) {
                            if ( !_.isUndefined( response.data.areas ) && !_.isNull( response.data.areas)  ) {
                                _.forEach(response.data.areas, (area) => {
                                    this.areas.push( {
                                        id: area.id,
                                        name: area.nombre
                                    } )
                                });
                            }
                            this.asignAreas();
                        }
                        
                        this.filterByArea( this.areaFilter );
                        
                        if (!_.isUndefined( this.navParams.data.ambitos ) && !_.isNull( this.navParams.data.ambitos ) ) {
                            this.navParams.data.ambitos = null;
                            
                            this.navigateToAmbitos( this.checklists )
                        }
                        this.applicationRef.tick();
                    }
                    catch (e) {
                    }
                })
                .catch((error: any) => {
                    loading.dismiss();
                    
                    if (error && error.message) this.util.showToast("Ocurrió un error, por favor contacte a soporte.", 3000);
                });
            return data;
        }
    }

    // Agendar notificaciones locales para los checklist completos pero no enviados
    scheduleChecklist( checksCompletados:any ){
        // Recorro los checks completados 
        _.forEach( checksCompletados, async ( check ) => {
            let termino = moment( `${check.vencimiento} ${check.termino}` ).subtract( 30, 'minutes' ).format( 'HH:mm:ss' );
            // reviso is el check esta agendado ya
            if( await ( this.localNotifications.isScheduled( check.id ) || this.localNotifications.isTriggered( check.id ) ) ){
                // si ya esta agendado hago update por si cambia algun dato
                await this.localNotifications.clear(check.id)

            // si no, lo agendo 
            }
                this.localNotifications.schedule( {
                    id: check.id, // hacemos id_asignacion = id
                    smallIcon: "res://ic_stat_icon_250x250",
                    title: `${ check.nombre }`,
                    text: '¡Tienes este checklist respondido sin enviar!',
                    trigger: { at: new Date( check.vencimiento+" "+termino ) },
                    
                } );

                
        } ); 
    }

    /**
     * Asigna Area inicial para mostrar s en el filtro
     * @param selected
     */
    asignAreas = function() {
        this.areaFilter = this.areas[0].id;
    };

    /**
     * Filtro de checklists por area y cambia apariencia según el estado del checklist
     * @param selected
     */
    filterByArea = function(selected) {
        this.showChecklists = [];
        if (selected == 0) {
            _.forEach(this.checklists, (check) => {
                if (check.estado_id == 4) check.icon = 'checkmark-circle';
                if (check.estado_id == 3) check.icon = 'checkmark-circle-outline';
                if (check.estado_id == 2) check.icon = 'ios-radio-button-on';
                if (check.estado_id == 1) check.icon = 'ios-radio-button-off';
                this.showChecklists.push(check)
            });
        } else if (selected == 99) {
            _.forEach(this.checklists, (check) => {
                if (check["area_id"] == null) {
                    if (check.estado_id == 4) check.icon = 'checkmark-circle';
                    if (check.estado_id == 3) check.icon = 'checkmark-circle-outline';
                    if (check.estado_id == 2) check.icon = 'ios-radio-button-on';
                    if (check.estado_id == 1) check.icon = 'ios-radio-button-off';
                    this.showChecklists.push(check)
                }
            });
        } else {
            _.forEach(this.checklists, (check) => {
                if (check["area_id"] == selected) {
                    if (check.estado_id == 4) check.icon = 'checkmark-circle';
                    if (check.estado_id == 3) check.icon = 'checkmark-circle-outline';
                    if (check.estado_id == 2) check.icon = 'ios-radio-button-on';
                    if (check.estado_id == 1) check.icon = 'ios-radio-button-off';
                    this.showChecklists.push(check)
                }
            });
        }
        if (this.showChecklists.length < 1) {
            this.stopInterval();
        } else {
            for (let checklist of this.showChecklists) {
                this.countdown(checklist);
            }
        }
        this.applicationRef.tick();
    };

    /**
     * Redireccion a vista de checklist singular, si se encuentra finalizado la redirección es solo para ver
     * @param checklist
     */
    navigateToAmbito(checklist: any, fueraDeHorario: boolean) {

        if (fueraDeHorario) return;

        if (!_.isUndefined(this.navParams.data.sucursal) && !_.isNull(this.navParams.data.sucursal)) {
            if (checklist.estado_id == 4) {
                
                this.navCtrl.push(FinalizadasDetallePage, {
                    checklist_id: checklist.id * 1,
                    sucursal_id: this.sucursal['id'],
                    visita_id: checklist['visit_id'] ? checklist['visit_id'] : this.visit['visita_id'],
                    action_id: 0
                });

                // TRACK DE EVENTO DESDE VISITA
                this.firebaseAnalyticsProvider.trackButtonEvent( "navigateToAmbito" );
            } else {
                this.navCtrl.push(AmbitoPage, {
                    checklist_id: checklist.id,
                    sucursal_id: this.navParams.data.sucursal,
                    visita: true
                });
                
                // TRACK DE EVENTO DESDE VISITA
                this.firebaseAnalyticsProvider.trackButtonEvent( "navigateToAmbito" );
            }
        } else {
            this.stopInterval();
            if (checklist.estado_id == 4) {
                this.navCtrl.push(FinalizadasDetallePage, {
                    checklist_id: checklist.id * 1,
                    sucursal_id: null,
                    visita_id: null,
                    action_id: null,
                    from: 'Finalizadas'
                });
            } else {
                this.navCtrl.push(AmbitoPage, {
                    checklist_id: checklist.id,
                });
            }

        }
    }

    /**
     * Redireccion a vista de checklists historicos
     * @param checklist
     */
    navigateToHistorico(checklists: any) {
        this.stopInterval();
        this.navCtrl.push(HistoricoPage, {
            checklists: checklists,
        });
    }

    /**
     * Redireccion a vista de detalle y ambitos
     * @param checklist
     */
    navigateToAmbitos(checklists: any) {
        this.stopInterval();
        this.navCtrl.push(AmbitosPage, {
            checklists: checklists,
        });
    }

    /**
     * Redireccion a vista de checklists ocacionales
     * @param checklist
     */
    navigateToOcasional(checklists: any) {
        this.stopInterval();
        this.navCtrl.push(OcacionalesPage, {
            checklists: checklists,
        });
    }

/*
    /**
     * Actualización de tiempo para contadores en checklist
     * @param hora_termino
     * @param fecha_actual
     * @returns {any}
     
    cuentaAtras(hora_termino: any, fecha_actual: any) {
        var resultado = null;
        var ahora = new Date();
        if (!_.isUndefined(hora_termino.split(':')) && !_.isNull(hora_termino.split(':'))) {
            var hora_termino = (hora_termino.split(':'));
            var fecha_actual = fecha_actual.split('-');
            hora_termino[0] = (hora_termino[0] * 1) - 1;
            if (hora_termino[0] < 0) hora_termino[0] = 0;
            hora_termino = new Date(fecha_actual[2], fecha_actual[1], fecha_actual[0], hora_termino[0], hora_termino[1], hora_termino[2]);
            var faltan = hora_termino.getTime() - ahora.getTime();
            // si todavía no es futuro
            if (faltan > 0) {
                let segundos = Math.round(faltan / 1000);
                let minutos = Math.floor(segundos / 60);
                let segundos_i = (segundos % 60);
                let segundos_s = (segundos % 60) + "";
                let horas = Math.floor(minutos / 60);
                let minutos_i = minutos % 60;
                let minutos_s = minutos % 60 + "";
                let horas_i = horas % 24;
                let horas_s = horas % 24 + "";

                // escribe los resultados
                (segundos_i < 10) ? segundos_s = '0' + segundos_i : segundos_s;
                (minutos_i < 10) ? minutos_s = '0' + minutos_i : minutos_s;
                (horas_i < 10) ? horas_s = '0' + horas_i : horas_s;
                resultado = horas_s + ':' + minutos_s + ':' + segundos_s;
            }
        } else {
            resultado = hora_termino;
        }
        this.applicationRef.tick();
        return resultado;
    }
*/
    getRemainingTime( endTime: string, currentDate: string ) {
        if ( !endTime ) return null;
        
        if ( !currentDate ) currentDate = '01-01-2000';

        let startTime = moment( moment.now() ).format( 'HH:mm:ss' );
        
        let remainingTime = moment.utc( moment( `${currentDate} ${endTime}`, 'DD-MM-YYYY HH:mm:ss' ).diff( moment( `${currentDate} ${startTime}`, 'DD-MM-YYYY HH:mm:ss' ) ) ).format( 'HH:mm:ss' );

        if ( !remainingTime || remainingTime === 'Invalid date' ) return null;

        return remainingTime;
    }

    /**
     * Activa contador de tiempo
     * @param checklist
     */
    countdown = function( checklist ) {
        let active = this.navCtrl.getActive();
        
        if ( active.instance instanceof ChecklistTiendaPage ) {
            var hora_termino = checklist.termino;
            
            // si el chechlist esta inactivo
            if ( checklist.activo == false ) {
                checklist.countDown = null;
            
            // si no
            } else {
                if ( hora_termino == null ) {
                    hora_termino = '23:59:59';
                }
                var interval = setInterval( () =>
                    /*checklist.countDown = this.cuentaAtras(hora_termino, fecha_actual)*/
                    checklist.countDown = this.getRemainingTime( checklist.termino, this.actualDate )
                    , 1000);
                this.stop.push( interval );
            }
        }
    };

    /**
     * Detiene los contadores de tiempo ejecutados por cada checklist
     */
    public stopInterval() {
        for (let inter of this.stop) {
            clearInterval(inter);
        }
    }

    /**
     * Trae visitas guardadas en memoria asociadas a usuario, en caso de no encontrar, se cargan desde el usuario
     * @param sucursal
     */
    getDatafromMemory(sucursal) {
        this.storage.get('visita_tienda_' + this.thisSession['usuario'].id).then((val) => {
            if (val) this.visita_tienda = JSON.parse(val);

            this.sucursal = _.find(this.visita_tienda['sucursales'], { 'id': sucursal });
            this.showChecklists = [];
            this.checklists = [];

            _.forEach(this.sucursal['checklists'], (check) => {
                var visit = _.find(this.visita_tienda['visitas'], {
                    'sucursal_id': sucursal * 1,
                    'checklist_id': check * 1
                });


                if (_.isNull(visit) || _.isUndefined(visit)) {
                    visit = _.find(this.visita_tienda['visitas_respuestas'], {
                        'sucursal_id': sucursal * 1,
                        'checklist_id': check * 1
                    });

                    if (_.isNull(visit) || _.isUndefined(visit)) visit = _.find(this.visita_tienda['visitas'], {
                        'sucursal_id': sucursal + "",
                        'checklist_id': check * 1
                    });

                    if (_.isNull(visit) || _.isUndefined(visit)) visit = _.find(this.visita_tienda['visitas_respuestas'], {
                        'sucursal_id': sucursal + "",
                        'checklist_id': check + ""
                    });


                    var foundCheck = _.find(this.visita_tienda['checklists'], { 'id': check + "" });
                    if (_.isNull(foundCheck) || _.isUndefined(foundCheck)) foundCheck = _.find(this.visita_tienda['checklists'], { 'id': check * 1 });


                    if (_.isNull(visit) || _.isUndefined(visit)) {
                        foundCheck.estado_id = 1;
                        foundCheck.nombre_estado = "Sin contestar";
                        _.forEach(foundCheck.ambitos, function(ambito) {
                            ambito.estado_id = 1;
                            ambito.nombre_estado = "Sin contestar";
                            _.forEach(ambito.preguntas, function(pregunta) {
                                pregunta.hasApply = undefined;

                            })
                        })
                    } else {
                        this.visit = visit;
                        let estado_id = JSON.parse(JSON.stringify(visit.estado_id));
                        let nombre_estado = JSON.parse(JSON.stringify(visit.nombre_estado));

                        foundCheck.estado_id = estado_id;
                        foundCheck.nombre_estado = nombre_estado + "";
                    }
                    this.checklists.push(JSON.parse(JSON.stringify(foundCheck)));
                } else {

                    this.visit = visit;
                    let isSend = false;


                    let state_id = null;
                    let state_name = null;
                    let foundCheck = null;

                    if (!_.isUndefined(this.visita_tienda['checklist_visita']) && !_.isNull(this.visita_tienda['checklist_visita'])) {
                        //TODO: agregar validacion de visita
                        foundCheck = _.find(this.visita_tienda['checklist_visita'], { 'id': check, 'visita_id': this.visit['id'] });

                        if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                            state_id = foundCheck.estado_id;
                            state_name = foundCheck.nombre_estado;
                            if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                isSend = true;
                            } else {
                                isSend = false;
                            }
                        } else {

                            foundCheck = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check });

                            if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                                state_id = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check }).estado_id;
                                state_name = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check }).nombre_estado;

                                if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                    isSend = true;
                                } else {
                                    isSend = false;
                                }
                            }
                        }

                    } else {

                        foundCheck = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check });

                        if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                            state_id = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check }).estado_id;
                            state_name = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklists'])), { 'id': check }).nombre_estado;

                            if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                isSend = true;
                            } else {
                                isSend = false;
                            }
                        }
                    }
                    if (_.isUndefined(foundCheck) || _.isNull(foundCheck)) foundCheck = _.find(this.visita_tienda['checklists'], { 'id': check });

                    if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                        if (!_.isUndefined(visit) && !_.isNull(visit)) {
                            let tempCheck = foundCheck;
                            foundCheck.temp_visit_id = visit.id;
                            if (visit.estado_id == 4) {
                                tempCheck.estado_id = 4;
                                tempCheck.nombre_estado = "Finalizado";
                                this.applicationRef.tick();
                            }
                            if (foundCheck && !foundCheck.estado_id) {
                                foundCheck.estado_id = visit.estado_id;
                                foundCheck.nombre_estado = visit.nombre_estado;
                            }
                            foundCheck['visit_id'] = visit.id;
                        }
                    }
                    this.numeroPreguntasContestadas(foundCheck, this.visit);

                    this.checklists.push(foundCheck);
                    //this.checklists.push(foundCheck);
                }
            });

            // Obtenemos el estado real de cada checklist a esta altura
            _.forEach(this.checklists, (checklist) => {

                let check = JSON.parse(JSON.stringify(checklist));
                checklist = check;

                _.forEach(checklist.ambitos, (ambito) => {
                    _.forEach(ambito.preguntas, (pregunta) => {
                        let hasResp = _.find(this.visita_tienda['respuestas'], {
                            pregunta_id: pregunta.id * 1,
                            no_aplica: 1,
                            'visita_id': this.visit['visita_id'] * 1
                        });
                        if (_.isUndefined(hasResp) || _.isNull(hasResp)) hasResp = _.find(this.visita_tienda['respuestas'], {
                            pregunta_id: pregunta.id + "",
                            no_aplica: "1",
                            'visita_id': this.visit['visita_id'] + ""
                        });


                        if (!_.isUndefined(hasResp) && !_.isNull(hasResp)) pregunta.hasApply = false;
                        else {
                            let hasResp2 = _.find(this.visita_tienda['respuestas'], {
                                pregunta_id: pregunta.id * 1,
                                no_aplica: 0,
                                'visita_id': this.visit['visita_id'] * 1
                            })
                            if (_.isUndefined(hasResp) || _.isNull(hasResp2)) hasResp2 = _.find(this.visita_tienda['respuestas'], {
                                pregunta_id: pregunta.id + "",
                                no_aplica: "0",
                                'visita_id': this.visit['visita_id'] + ""
                            })
                            if (!_.isUndefined(hasResp2) && !_.isNull(hasResp2)) pregunta.hasApply = true;
                        }
                    })
                })
                if (checklist.estado_id != 4 && checklist.estado_id != "4") {
                    let isEmpty = 0;
                    let isUnclomplete = 0;
                    let isComplete = 0;
                    let isSend = 0;
                    _.forEach(checklist.ambitos, (ambito) => {
                        if (ambito.estado_id == 1) isEmpty++;
                        if (ambito.estado_id == 2) isUnclomplete++;
                        if (ambito.estado_id == 3) isComplete++;
                        if (ambito.estado_id == 4) isSend++;
                    });

                    if (isSend == checklist.ambitos.length) {
                        checklist.estado_id = 4;
                        checklist.nombre_estado = "Finalizado";
                    } else if (isComplete == checklist.ambitos.length) {
                        checklist.estado_id = 3;
                        checklist.nombre_estado = "Completo";
                    } else if ((isEmpty == checklist.ambitos.length) || (isEmpty == 0 && isUnclomplete == 0 && isComplete == 0 && isSend == 0)) {
                        checklist.estado_id = 1;
                        checklist.nombre_estado = "Sin contestar";
                    } else {
                        checklist.estado_id = 2;
                        checklist.nombre_estado = "Incompleto";
                    }

                    let isSended = false;

                    let state_id = null;
                    if (this.visita_tienda['checklist_visita'] && _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklist_visita'])), { 'id': checklist.id })) state_id = _.find(JSON.parse(JSON.stringify(this.visita_tienda['checklist_visita'])), { 'id': checklist.id }).estado_id;


                    if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                        isSended = true;
                    } else {
                        isSended = false;
                    }

                    if (isSended) {

                        checklist['estado_id'] = 4;
                        checklist['nombre_estado'] = "Finalizado";
                    }
                }

            });

            this.showChecklists = JSON.parse(JSON.stringify(this.checklists));

            _.forEach(this.showChecklists, (checklist) => {
                if (checklist.send && checklist.send == true) {
                    checklist['estado_id'] = 4;
                    checklist['nombre_estado'] = "Finalizado";
                }

                if (checklist.estado_id == 4) checklist.icon = 'checkmark-circle';
                if (checklist.estado_id == 3) checklist.icon = 'checkmark-circle-outline';
                if (checklist.estado_id == 2) checklist.icon = 'ios-radio-button-on';
                if (checklist.estado_id == 1 || !checklist.estado_id) checklist.icon = 'ios-radio-button-off';
            });

            this.isReady = true;
            this.applicationRef.tick();
        });
    }


    public static numeroPreguntasContestadas2(checklist, visit, visita_tienda) {

        var contestadas = 0;
        var total = 0;
        let noComents = false;

        _.forEach(checklist.ambitos, function(ambito, key) {
            var respuestas = _.filter(visita_tienda['respuestas'], {
                ambito_id: ambito.id + "",
                visita_id: visit.id + ""
            });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(visita_tienda['respuestas'], { 'ambito_id': ambito.id + "", 'visita_id': visit.id * 1 });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': visit.id + "" });


            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': visit.id * 1 });

            var count = 0;
            var preguntaExiste = [];

            ambito.hasCommentPend = false;
            ambito.has_photo_action = true;

            //Buscamos si existen preguntas con 'no aplica'
            _.forEach(ambito.preguntas, function(pregunta) {
                if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                    if (pregunta.hasApply == false) {
                        count++;
                    }
                }
            });

            _.forEach(respuestas, function(respuesta) {
                // Buscamos la pregunta asociada a esta respuesta
                let question = _.find(ambito.preguntas, { id: respuesta.pregunta_id });
                if (question) {
                    // Luego la alternativa seleccionada para esta respuesta
                    let alternative = _.find(question.alternativas, { id: respuesta.respuesta_alternativa_id });
                    // Si encontramos la alternativa, al asignamos a la respuesta
                    if (alternative) {
                        respuesta.alternative_selected = alternative;
                    }
                }
                if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 1) {
                    count++;
                } else {
                    if (respuesta.tipo_id == 1) { // Radio
                        if (respuesta.pregunta_alternativa_id == 0 || respuesta.pregunta_alternativa_id == null) {
                            if (respuesta.comentario && respuesta.comentario == 1 && !respuesta.comentarios) {
                                noComents = true;
                                ambito.hasCommentPend = true;
                                ambito.force_incomplete_status = true;
                            } else {
                                if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 3 && (respuesta.texto_adicional == "" || _.isNull(respuesta.texto_adicional) || _.isUndefined(respuesta.texto_adicional))) {
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    noComents = true;
                                    //count--;
                                } else {
                                    if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 4 && ((_.isArray(respuesta.foto) ? (!respuesta.foto.length || !respuesta.foto[0].foto) : (!respuesta.foto || !respuesta.foto.foto)))
                                    ) {
                                        ambito.has_photo_action = false;
                                        noComents = true;
                                        ambito.force_incomplete_status = true;
                                    } else {
                                        count++;
                                    }
                                }
                                // Solamente los radio buttons tienen acción con foto
                                // Si no han agregado la foto, se considera incompleta
                                // Aunque primero debemos considerar si viene dentro de un arreglo
                            }
                        }
                    } else if (respuesta.tipo_id == 2) { // Checkbox

                        if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 0) respuesta.checked = true;

                        if (respuesta.alternative_selected && respuesta.checked == true) {

                            // Buscamos si ya se ha ingresado una respuesta para esta pregunta
                            let found_id_question = _.indexOf(preguntaExiste, respuesta.pregunta_id);

                            if ((respuesta.comentario === 1) || (respuesta.alternative_selected.comentario === 1)) {
                                if (respuesta.comentarios) {
                                    if (found_id_question === -1) {
                                        preguntaExiste.push(respuesta.pregunta_id);
                                    }
                                } else {
                                    noComents = true;
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    preguntaExiste.splice(found_id_question, 1);
                                }
                            } else {
                                if (found_id_question === -1) {
                                    preguntaExiste.push(respuesta.pregunta_id);
                                }
                            }
                        }
                    } else if (respuesta.tipo_id == 3) { // Texto
                        if ((respuesta.texto_respuesta || respuesta.texto_respuesta === 0) && respuesta.texto_respuesta !== "") {
                            count++;
                        }
                    } else if (respuesta.tipo_id == 4) { // Foto
                        if (respuesta.foto && respuesta.foto.length > 0) {
                            count++;
                        }
                    }
                }
            });

            if (count < 0) count = 0;

            ambito['contestadas'] = count + preguntaExiste.length; // Se le asocia el numero de preguntas contestadas al ambito para mostrarlo en la vista

            if (ambito['contestadas'] > ambito['total']) ambito['contestadas'] = ambito['total'];

            ambito['pendientes'] = ambito['total'] - ambito['contestadas'];
            contestadas += ambito['contestadas'];
            total += ambito['total'];


            if (ambito['contestadas'] == 0) {
                ambito.estado_id = 1;
                ambito.nombre_estado = "Sin contestar";
            }
            if (ambito['contestadas'] > 0 && ambito['contestadas'] < ambito['total']) {
                ambito.estado_id = 2;
                ambito.nombre_estado = "Incompleto";
            }
            if (ambito['contestadas'] >= ambito['total']) {

                if (ambito.hasCommentPend == false && ambito.has_photo_action) {
                    ambito.estado_id = 3;
                    ambito.nombre_estado = "Completo";
                } else {
                    ambito.estado_id = 2;
                    ambito.nombre_estado = "Incompleto";
                }
            }
        });
        if (contestadas == 0) {
            checklist.estado_id = 1;
            checklist.nombre_estado = "Sin contestar";
        }
        if (contestadas > 0 && contestadas < total) {
            checklist.estado_id = 2;
            checklist.nombre_estado = "Incompleto";
        }
        if (contestadas == total) {
            if (noComents == false) {
                checklist.estado_id = 3;
                checklist.nombre_estado = "Completo";
            } else {
                checklist.estado_id = 2;
                checklist.nombre_estado = "Incompleto";
            }
        }
    }


    public static getData2(storage, usuarioId, sucursalId) {

        return new Promise((resolve) => {
            storage.get('visita_tienda_' + usuarioId).then((val) => {


                if (!val) { resolve([]); return; }

                let visita_tienda = JSON.parse(val);

                let sucursal = _.find(visita_tienda['sucursales'], { 'id': sucursalId });

                if (!sucursal) { resolve([]); return; }

                let showChecklists = [];
                let checklists = [];

                let visit2 = null;

                _.forEach(sucursal['checklists'], (check) => {
                    var visit = _.find(visita_tienda['visitas'], {
                        'sucursal_id': sucursalId * 1,
                        'checklist_id': check * 1
                    });

                    if (visit) {

                        visit2 = visit;

                        let isSend = false;


                        let state_id = null;
                        let state_name = null;
                        let foundCheck = null;

                        if (!_.isUndefined(visita_tienda['checklist_visita']) && !_.isNull(visita_tienda['checklist_visita'])) {
                            //TODO: agregar validacion de visita
                            foundCheck = _.find(visita_tienda['checklist_visita'], { 'id': check, 'visita_id': visit['id'] });

                            if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                                state_id = foundCheck.estado_id;
                                state_name = foundCheck.nombre_estado;
                                if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                    isSend = true;
                                } else {
                                    isSend = false;
                                }
                            } else {

                                foundCheck = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check });

                                if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                                    state_id = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check }).estado_id;
                                    state_name = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check }).nombre_estado;

                                    if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                        isSend = true;
                                    } else {
                                        isSend = false;
                                    }
                                }
                            }

                        } else {

                            foundCheck = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check });

                            if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                                state_id = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check }).estado_id;
                                state_name = _.find(JSON.parse(JSON.stringify(visita_tienda['checklists'])), { 'id': check }).nombre_estado;

                                if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                                    isSend = true;
                                } else {
                                    isSend = false;
                                }
                            }
                        }
                        if (_.isUndefined(foundCheck) || _.isNull(foundCheck)) foundCheck = _.find(visita_tienda['checklists'], { 'id': check });

                        if (!_.isUndefined(foundCheck) && !_.isNull(foundCheck)) {
                            if (!_.isUndefined(visit) && !_.isNull(visit)) {
                                let tempCheck = foundCheck;
                                foundCheck.temp_visit_id = visit.id;
                                if (visit.estado_id == 4) {
                                    tempCheck.estado_id = 4;
                                    tempCheck.nombre_estado = "Finalizado";
                                }
                                if (foundCheck && !foundCheck.estado_id) {
                                    foundCheck.estado_id = visit.estado_id;
                                    foundCheck.nombre_estado = visit.nombre_estado;
                                }
                                foundCheck['visit_id'] = visit.id;
                            }
                        }
                        ChecklistTiendaPage.numeroPreguntasContestadas2(foundCheck, visit, visita_tienda);

                        checklists.push(foundCheck);
                    } else {
                        visit = _.find(visita_tienda['visitas_respuestas'], {
                            'sucursal_id': sucursalId * 1,
                            'checklist_id': check * 1
                        });

                        if (_.isNull(visit) || _.isUndefined(visit)) visit = _.find(visita_tienda['visitas'], {
                            'sucursal_id': sucursalId + "",
                            'checklist_id': check * 1
                        });

                        if (_.isNull(visit) || _.isUndefined(visit)) visit = _.find(visita_tienda['visitas_respuestas'], {
                            'sucursal_id': sucursalId + "",
                            'checklist_id': check + ""
                        });


                        var foundCheck = _.find(visita_tienda['checklists'], { 'id': check + "" });
                        if (_.isNull(foundCheck) || _.isUndefined(foundCheck)) foundCheck = _.find(visita_tienda['checklists'], { 'id': check * 1 });


                        if (_.isNull(visit) || _.isUndefined(visit)) {
                            foundCheck.estado_id = 1;
                            foundCheck.nombre_estado = "Sin contestar";
                            _.forEach(foundCheck.ambitos, function(ambito) {
                                ambito.estado_id = 1;
                                ambito.nombre_estado = "Sin contestar";
                                _.forEach(ambito.preguntas, function(pregunta) {
                                    pregunta.hasApply = undefined;

                                })
                            })
                        } else {
                            visit2 = visit;
                            let estado_id = JSON.parse(JSON.stringify(visit.estado_id));
                            let nombre_estado = JSON.parse(JSON.stringify(visit.nombre_estado));

                            foundCheck.estado_id = estado_id;
                            foundCheck.nombre_estado = nombre_estado + "";
                        }
                        checklists.push(JSON.parse(JSON.stringify(foundCheck)));
                    }

                });

                // Obtenemos el estado real de cada checklist a esta altura
                _.forEach(checklists, (checklist) => {

                    let check = JSON.parse(JSON.stringify(checklist));
                    checklist = check;

                    _.forEach(checklist.ambitos, (ambito) => {
                        _.forEach(ambito.preguntas, (pregunta) => {
                            let hasResp = _.find(visita_tienda['respuestas'], {
                                pregunta_id: pregunta.id * 1,
                                no_aplica: 1,
                                'visita_id': visit2['visita_id'] * 1
                            });
                            if (_.isUndefined(hasResp) || _.isNull(hasResp)) hasResp = _.find(visita_tienda['respuestas'], {
                                pregunta_id: pregunta.id + "",
                                no_aplica: "1",
                                'visita_id': visit2['visita_id'] + ""
                            });


                            if (!_.isUndefined(hasResp) && !_.isNull(hasResp)) pregunta.hasApply = false;
                            else {
                                let hasResp2 = _.find(visita_tienda['respuestas'], {
                                    pregunta_id: pregunta.id * 1,
                                    no_aplica: 0,
                                    'visita_id': visit2['visita_id'] * 1
                                })
                                if (_.isUndefined(hasResp) || _.isNull(hasResp2)) hasResp2 = _.find(visita_tienda['respuestas'], {
                                    pregunta_id: pregunta.id + "",
                                    no_aplica: "0",
                                    'visita_id': visit2['visita_id'] + ""
                                })
                                if (!_.isUndefined(hasResp2) && !_.isNull(hasResp2)) pregunta.hasApply = true;
                            }
                        })
                    })
                    if (checklist.estado_id != 4 && checklist.estado_id != "4") {
                        let isEmpty = 0;
                        let isUnclomplete = 0;
                        let isComplete = 0;
                        let isSend = 0;
                        _.forEach(checklist.ambitos, (ambito) => {
                            if (ambito.estado_id == 1) isEmpty++;
                            if (ambito.estado_id == 2) isUnclomplete++;
                            if (ambito.estado_id == 3) isComplete++;
                            if (ambito.estado_id == 4) isSend++;
                        });

                        if (isSend == checklist.ambitos.length) {
                            checklist.estado_id = 4;
                            checklist.nombre_estado = "Finalizado";
                        } else if (isComplete == checklist.ambitos.length) {
                            checklist.estado_id = 3;
                            checklist.nombre_estado = "Completo";
                        } else if ((isEmpty == checklist.ambitos.length) || (isEmpty == 0 && isUnclomplete == 0 && isComplete == 0 && isSend == 0)) {
                            checklist.estado_id = 1;
                            checklist.nombre_estado = "Sin contestar";
                        } else {
                            checklist.estado_id = 2;
                            checklist.nombre_estado = "Incompleto";
                        }

                        let isSended = false;

                        let state_id = null;
                        if (visita_tienda['checklist_visita'] && _.find(JSON.parse(JSON.stringify(visita_tienda['checklist_visita'])), { 'id': checklist.id })) state_id = _.find(JSON.parse(JSON.stringify(visita_tienda['checklist_visita'])), { 'id': checklist.id }).estado_id;


                        if (!_.isUndefined(state_id) && !_.isNull(state_id) && state_id == 4) {
                            isSended = true;
                        } else {
                            isSended = false;
                        }

                        if (isSended) {

                            checklist['estado_id'] = 4;
                            checklist['nombre_estado'] = "Finalizado";
                        }
                    }

                });

                showChecklists = JSON.parse(JSON.stringify(checklists));

                _.forEach(showChecklists, (checklist) => {
                    if (checklist.send && checklist.send == true) {
                        checklist['estado_id'] = 4;
                        checklist['nombre_estado'] = "Finalizado";
                    }

                    if (checklist.estado_id == 4) checklist.icon = 'checkmark-circle';
                    if (checklist.estado_id == 3) checklist.icon = 'checkmark-circle-outline';
                    if (checklist.estado_id == 2) checklist.icon = 'ios-radio-button-on';
                    if (checklist.estado_id == 1 || !checklist.estado_id) checklist.icon = 'ios-radio-button-off';
                });

                resolve(showChecklists);
            });
        });
    }


    /**
     * Calcula cuantas preguntas del checklist ya fueron respondidas y cuantas aun se encuentran pendientes, según esta información,
     * se actualiza su estado
     * @param checklist
     * @returns {Promise<void>}
     */

    async numeroPreguntasContestadas(checklist, visit) {
        let context = this;
        var contestadas = 0;
        var total = 0;
        let noComents = false;

        _.forEach(checklist.ambitos, function(ambito, key) {
            var respuestas = _.filter(context.visita_tienda['respuestas'], {
                ambito_id: ambito.id + "",
                visita_id: visit.id + ""
            });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id + "", 'visita_id': visit.id * 1 });

            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': visit.id + "" });


            if (_.isUndefined(respuestas) || _.isNull(respuestas) || respuestas.length <= 0) respuestas = _.filter(context.visita_tienda['respuestas'], { 'ambito_id': ambito.id * 1, 'visita_id': visit.id * 1 });

            var count = 0;
            var preguntaExiste = [];

            ambito.hasCommentPend = false;
            ambito.has_photo_action = true;

            //Buscamos si existen preguntas con 'no aplica'
            _.forEach(ambito.preguntas, function(pregunta) {
                if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                    if (pregunta.hasApply == false) {
                        count++;
                    }
                }
            });

            _.forEach(respuestas, function(respuesta) {
                // Buscamos la pregunta asociada a esta respuesta
                let question = _.find(ambito.preguntas, { id: respuesta.pregunta_id });
                if (question) {
                    // Luego la alternativa seleccionada para esta respuesta
                    let alternative = _.find(question.alternativas, { id: respuesta.respuesta_alternativa_id });
                    // Si encontramos la alternativa, al asignamos a la respuesta
                    if (alternative) {
                        respuesta.alternative_selected = alternative;
                    }
                }
                if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 1) {
                    count++;
                } else {
                    if (respuesta.tipo_id == 1) { // Radio
                        if (respuesta.pregunta_alternativa_id == 0 || respuesta.pregunta_alternativa_id == null) {
                            if (respuesta.comentario && respuesta.comentario == 1 && !respuesta.comentarios) {
                                noComents = true;
                                ambito.hasCommentPend = true;
                                ambito.force_incomplete_status = true;
                            } else {
                                if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 3 && (respuesta.texto_adicional == "" || _.isNull(respuesta.texto_adicional) || _.isUndefined(respuesta.texto_adicional))) {
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    noComents = true;
                                    //count--;
                                } else {
                                    if (respuesta.alternative_selected && respuesta.alternative_selected.tipo_id === 4 && ((_.isArray(respuesta.foto) ? (!respuesta.foto.length || !respuesta.foto[0].foto) : (!respuesta.foto || !respuesta.foto.foto)))
                                    ) {
                                        ambito.has_photo_action = false;
                                        noComents = true;
                                        ambito.force_incomplete_status = true;
                                    } else {
                                        count++;
                                    }
                                }
                                // Solamente los radio buttons tienen acción con foto
                                // Si no han agregado la foto, se considera incompleta
                                // Aunque primero debemos considerar si viene dentro de un arreglo
                            }
                        }
                    } else if (respuesta.tipo_id == 2) { // Checkbox

                        if (!_.isNull(respuesta.no_aplica) && !_.isUndefined(respuesta.no_aplica) && respuesta.no_aplica == 0) respuesta.checked = true;

                        if (respuesta.alternative_selected && respuesta.checked == true) {

                            // Buscamos si ya se ha ingresado una respuesta para esta pregunta
                            let found_id_question = _.indexOf(preguntaExiste, respuesta.pregunta_id);

                            if ((respuesta.comentario === 1) || (respuesta.alternative_selected.comentario === 1)) {
                                if (respuesta.comentarios) {
                                    if (found_id_question === -1) {
                                        preguntaExiste.push(respuesta.pregunta_id);
                                    }
                                } else {
                                    noComents = true;
                                    ambito.hasCommentPend = true;
                                    ambito.force_incomplete_status = true;
                                    preguntaExiste.splice(found_id_question, 1);
                                }
                            } else {
                                if (found_id_question === -1) {
                                    preguntaExiste.push(respuesta.pregunta_id);
                                }
                            }
                        }
                    } else if (respuesta.tipo_id == 3) { // Texto
                        if ((respuesta.texto_respuesta || respuesta.texto_respuesta === 0) && respuesta.texto_respuesta !== "") {
                            count++;
                        }
                    } else if (respuesta.tipo_id == 4) { // Foto
                        if (respuesta.foto && respuesta.foto.length > 0) {
                            count++;
                        }
                    }
                }
            });

            if (count < 0) count = 0;

            ambito['contestadas'] = count + preguntaExiste.length; // Se le asocia el numero de preguntas contestadas al ambito para mostrarlo en la vista

            if (ambito['contestadas'] > ambito['total']) ambito['contestadas'] = ambito['total'];

            ambito['pendientes'] = ambito['total'] - ambito['contestadas'];
            contestadas += ambito['contestadas'];
            total += ambito['total'];


            if (ambito['contestadas'] == 0) {
                ambito.estado_id = 1;
                ambito.nombre_estado = "Sin contestar";
            }
            if (ambito['contestadas'] > 0 && ambito['contestadas'] < ambito['total']) {
                ambito.estado_id = 2;
                ambito.nombre_estado = "Incompleto";
            }
            if (ambito['contestadas'] >= ambito['total']) {

                if (ambito.hasCommentPend == false && ambito.has_photo_action) {
                    ambito.estado_id = 3;
                    ambito.nombre_estado = "Completo";
                } else {
                    ambito.estado_id = 2;
                    ambito.nombre_estado = "Incompleto";
                }
            }
        });
        if (contestadas == 0) {
            checklist.estado_id = 1;
            checklist.nombre_estado = "Sin contestar";
        }
        if (contestadas > 0 && contestadas < total) {
            checklist.estado_id = 2;
            checklist.nombre_estado = "Incompleto";
        }
        if (contestadas == total) {
            if (noComents == false) {
                checklist.estado_id = 3;
                checklist.nombre_estado = "Completo";
            } else {
                checklist.estado_id = 2;
                checklist.nombre_estado = "Incompleto";
            }
        }
    }

    // Recibe un checklist, recorre sus ámbitos y preguntas, evalua las respuestas y retorna su estado real
    getChecklistStatus(checklist: any) {
        let checklist_status = { estado_id: checklist.estado_id, nombre_estado: checklist.nombre_estado };
        let ambits: any = [];
        if (checklist.temp_visit_id) {
            // Evaluamos cada ámbito de cada checklist
            _.forEach(checklist.ambitos, (ambit) => {
                let answers = _.filter(this.visita_tienda['respuestas'], {
                    ambito_id: ambit.id,
                    visita_id: checklist.temp_visit_id
                });

                let ambit_metrics = {
                    answered_questions: 0,
                    pending_comments: false,
                    pending_photos: false,
                    checkbox_answers: [],
                    total: ambit.total
                };

                _.forEach(ambit.preguntas, function(pregunta) {
                    if (!_.isUndefined(pregunta.hasApply) && !_.isNull(pregunta.hasApply)) {
                        if (pregunta.hasApply == false) {
                            ambit_metrics.answered_questions++;
                        }
                    }
                });

                _.forEach(answers, (answer) => {
                    // Buscamos la pregunta asociada a esta respuesta
                    let question = _.find(ambit.preguntas, { id: answer.pregunta_id });
                    if (question) {
                        // Luego la alternativa seleccionada para esta respuesta
                        let alternative = _.find(question.alternativas, { id: answer.respuesta_alternativa_id })
                        // Si encontramos la alternativa, al asignamos a la respuesta
                        if (alternative) {
                            answer.alternative_selected = alternative;
                        }
                    }
                    // Respuesta asociada a pregunta del tipo radio
                    if (answer.tipo_id == 1) {
                        // Con respuesta
                        if (answer.pregunta_alternativa_id === 0 || answer.pregunta_alternativa_id === null) {
                            ambit_metrics.answered_questions++;
                        }

                        // No comentada
                        if (answer.comentario && answer.comentario == 1 && !answer.comentarios) {
                            ambit_metrics.pending_comments = true;
                        }

                        // Solamente los radio buttons tienen acción con foto
                        // Si no han agregado la foto, se considera incompleta
                        // Aunque primero debemos considerar si viene dentro de un arreglo
                        if (
                            answer.alternative_selected
                            && answer.alternative_selected.tipo_id === 4
                            && (
                                (_.isArray(answer.foto) ? (!answer.foto.length || !answer.foto[0].foto) : (!answer.foto || !answer.foto.foto))
                            )
                        ) {
                            ambit_metrics.pending_photos = true;
                        }
                        // Respuesta asociada a pregunta del tipo checkbox
                    } else if (answer.tipo_id == 2) {
                        if (answer.pregunta_id && !_.includes(ambit_metrics.checkbox_answers, answer.pregunta_id)) {
                            ambit_metrics.checkbox_answers.push(answer.pregunta_id);
                        }
                        if ((answer.comentario === 1 || (answer.alternative_selected.comentario === 1)) && !answer.comentarios) {
                            ambit_metrics.pending_comments = true;
                        }
                        // Respuesta asociada a pregunta del tipo texto
                    } else if (answer.tipo_id == 3) {
                        ambit_metrics.answered_questions++;
                        // Respuesta asociada a pregunta del tipo foto
                    } else if (answer.tipo_id == 4) {
                        if (answer.foto && answer.foto.length > 0) {
                            ambit_metrics.answered_questions++;
                        }
                    }
                });
                ambits.push(ambit_metrics);
            });

            // Evaluamos los resultados y asignamos el estado que corresponda a cada ámbito
            for (let index = 0; index < ambits.length; index++) {

                let total_answers = (ambits[index].answered_questions + ambits[index].checkbox_answers.length);

                if (total_answers === 0) {
                    ambits[index].temp_status_id = 1;
                } else if (total_answers > 0 && total_answers < ambits[index].total) {
                    ambits[index].temp_status_id = 2;
                } else if (total_answers >= ambits[index].total) {
                    if (ambits[index].pending_comments || ambits[index].pending_photos) {
                        ambits[index].temp_status_id = 2;
                    } else {
                        ambits[index].temp_status_id = 3;
                    }
                }
            }

            let found_statuses = {
                no_answer: _.find(ambits, (ambit) => {
                    return ambit.temp_status_id === 1
                }),
                incomplete: _.find(ambits, (ambit) => {
                    return ambit.temp_status_id === 2
                }),
                complete: _.find(ambits, (ambit) => {
                    return ambit.temp_status_id === 3
                }),
            };

            // Si el checklist sólo tiene ámbitos sin contestar
            if (
                found_statuses.no_answer
                && !found_statuses.incomplete
                && !found_statuses.complete
            ) {
                checklist_status.estado_id = 1;
                checklist_status.nombre_estado = 'Sin contestar';

                // Si el checklist tiene algún ámbito incompleto
            } else if (found_statuses.incomplete) {
                checklist_status.estado_id = 2;
                checklist_status.nombre_estado = 'Incompleto';

                // Si el checklist tiene todos los ámbitos completos
            } else if (
                found_statuses.complete
                && !found_statuses.no_answer
                && !found_statuses.incomplete
            ) {
                checklist_status.estado_id = 3;
                checklist_status.nombre_estado = 'Completo';

                // Si el checklist sólo tiene ámbitos completos y sin contestar
            } else if (
                found_statuses.complete
                && found_statuses.no_answer
                && !found_statuses.incomplete
            ) {
                checklist_status.estado_id = 2;
                checklist_status.nombre_estado = 'Incompleto';
            }
        }
        return checklist_status;
    }

    /**
     * Actualiza checklists y vista completa
     * @param refresher
     * @returns {Promise<void>}
     */
    async refreshChecklist(refresher: any) {
        if (this.sucursal_id) {
            this.getDatafromMemory(this.sucursal_id);
            if (!_.isNull(refresher)) {
                refresher.complete();
            }
        } else {
            this.occasionalChecklists = await this.getOccasionalChecklists();
            await this.getAllChecklists();
            if (!_.isNull(refresher)) {
                refresher.complete();
            }
        }

    }

    /**
     * ActionSheet para cambiar de ventana dentro de módulo, solo se puede acceder al comparador
     * si el cliente tiene el módulo LEAN habilitado.
     * @param item
     * @param index
     */
    presentActionSheet(item, index) {

        let hasLean = _.find(this.thisSession["usuario"].modulos, function(mod) {
            return mod.url_prefix == "checklistambitos";
        });
        let hasCompare = false;
        if (!_.isNull(hasLean) && !_.isUndefined(hasLean)) {
            if (((hasLean.menu * 1) >= 1) || (hasLean.dashboard * 1) >= 1) hasCompare = true;
        }

        if (hasCompare == true) {
            let actionSheet = this.actionSheet.create({
                title: '',
                buttons: [
                    {
                        text: '' + this.module,
                        handler: () => {
                        }
                    },
                    {
                        text: 'Comparador',
                        handler: () => {
                            this.navCtrl.push(AmbitosPage);
                        }
                    },
                    {
                        text: 'Históricos',
                        handler: () => {
                            this.navCtrl.push(HistoricoPage);
                        }
                    }
                ]
            });
            actionSheet.present();
        } else {
            let actionSheet = this.actionSheet.create({
                title: '',
                buttons: [
                    {
                        text: '' + this.module,
                        handler: () => {
                        }
                    },
                    {
                        text: 'Históricos',
                        handler: () => {
                            this.navCtrl.push(HistoricoPage);
                        }
                    }
                ]
            });
            actionSheet.present();
        }
    }

    showVisitActionSheet() {
        const actionSheet = this.actionSheet.create({
            buttons: [
                {
                    text: 'Inicio',
                    handler: () => {
                        this.navCtrl.popToRoot();
                    }
                }, {
                    text: 'No enviados',
                    handler: () => {
                        this.navCtrl.push('NoEnviadasPage');
                    }
                }, {
                    text: 'Históricos',
                    handler: () => {
                        this.navCtrl.push('HistoricasPage');
                    }
                }
            ]
        });
        actionSheet.present();
    }

    // Obtiene la lista de checklists ocasionales
    async getOccasionalChecklists() {
        let occasionalChecklists = [];

        await this.request
            .get(config.endpoints.get.occasionalChecklists, true)
            .then((response: any) => {
                if (response && response.data && response.data.length) {
                    occasionalChecklists = response.data;
                }
            })
            .catch((error: any) => { });
        return occasionalChecklists;
    }

    async selectBranchOffice(branchOffices: any) {
        return new Promise((resolve) => {
            const modal = this.modalController.create(SucursalesModalComponent, { branchOffices: branchOffices});
            modal.present();
            modal.onDidDismiss((params: any) => {
                resolve(params);
            });
        });
    }

    // Genera la asignación del checklist ocasional
    async assignChecklist(checklist: any) {
        let body: any = { check_id: checklist.id };
        let branchOfficeId: any = null;

        if(this.charge !== 'branch-office' && checklist.sucursales) {
            await this.selectBranchOffice(checklist.sucursales)
            .then((branchOffice: any) => {
                if(branchOffice && branchOffice.id) {
                    branchOfficeId = branchOffice.id;
                }
            });

            if(!branchOfficeId) {
                this.util.showToast('Debes seleccionar una sucursal.', 3000);
                return;
            }
        }


        if (
            this.session
            && this.session.usuario
            && this.session.usuario.sucursales
            && this.session.usuario.sucursales.length === 1
        ) {
            branchOfficeId = this.session.usuario.sucursales[0];
        }

        body.sucursal_id = branchOfficeId;

        const loading = this.loading.create({ content: 'Asignando checklist.' });
        loading.present();

        this.request
            .post(config.endpoints.post.assignChecklist, body, true)
            .then((response: any) => {
                loading.dismiss();
                if (response && response.data && response.data.asignacion_id) {
                    this.navigateToAmbito({ id: response.data.asignacion_id }, false);
                    return;
                }
                this.util.showToast((response.message ? response.message : 'No ha sido posible asignar el checklist ocasional, intente nuevamente.'), 3000);
            })
            .catch((error: any) => {
                this.util.showToast('No ha sido posible asignar el checklist ocasional, intente nuevamente.', 3000);
                loading.dismiss();
            });
    }
}
